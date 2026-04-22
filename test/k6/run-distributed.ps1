param(
	[Parameter(Mandatory = $true)]
	[string]$ScriptPath,

	[int]$Workers = 10,
	[string]$EnvFile = "",
	[string]$K6Image = "grafana/k6:latest",
	[string]$DockerNetwork = "",
	[string]$ResultsDir = "./results",
	[string]$ExtraArgs = ""
)

if ($Workers -lt 2) {
	throw "Workers must be >= 2 for distributed execution."
}

if (-not (Test-Path $ScriptPath)) {
	throw "Script not found: $ScriptPath"
}

$workDir = (Get-Location).Path
$scriptAbsolute = Resolve-Path $ScriptPath
$scriptRelative = [System.IO.Path]::GetRelativePath($workDir, $scriptAbsolute)

if (-not (Test-Path $ResultsDir)) {
	New-Item -ItemType Directory -Path $ResultsDir | Out-Null
}

$sequenceParts = @("0")
for ($i = 1; $i -lt $Workers; $i++) {
	$sequenceParts += "$i/$Workers"
}
$sequenceParts += "1"
$segmentSequence = $sequenceParts -join ","

Write-Host "Starting distributed k6 run"
Write-Host "Script: $scriptRelative"
Write-Host "Workers: $Workers"
Write-Host "Segment sequence: $segmentSequence"

$jobs = @()

for ($i = 0; $i -lt $Workers; $i++) {
	$start = "$i/$Workers"
	$end = "$($i + 1)/$Workers"
	$segment = "$start:$end"
	$jsonOut = "results/summary-$i.json"

	$dockerArgs = @(
		"run", "--rm",
		"-v", "${workDir}:/work",
		"-w", "/work"
	)

	if ($DockerNetwork -ne "") {
		$dockerArgs += @("--network", $DockerNetwork)
	}

	$dockerArgs += @(
		$K6Image,
		"run",
		"--execution-segment=$segment",
		"--execution-segment-sequence=$segmentSequence",
		"--summary-export", $jsonOut
	)

	if ($EnvFile -ne "") {
		if (-not (Test-Path $EnvFile)) {
			throw "Env file not found: $EnvFile"
		}
		$dockerArgs += @("--env-file", $EnvFile)
	}

	if ($ExtraArgs -ne "") {
		$extra = [System.Management.Automation.PSParser]::Tokenize($ExtraArgs, [ref]$null) |
			Where-Object { $_.Type -eq 'CommandArgument' } |
			ForEach-Object { $_.Content }
		$dockerArgs += $extra
	}

	$dockerArgs += $scriptRelative

	$jobs += Start-Job -Name "k6-worker-$i" -ScriptBlock {
		param($argsList)
		& docker @argsList
		exit $LASTEXITCODE
	} -ArgumentList (, $dockerArgs)
}

Write-Host "Launched $($jobs.Count) workers. Waiting for completion..."
Wait-Job -Job $jobs | Out-Null

$failed = @()
foreach ($job in $jobs) {
	$state = $job.State
	$out = Receive-Job -Job $job -Keep
	if ($job.State -ne 'Completed') {
		$failed += $job.Name
	}

	if ($out) {
		$logPath = Join-Path $ResultsDir "$($job.Name).log"
		$out | Out-File -FilePath $logPath -Encoding utf8
	}
}

Remove-Job -Job $jobs | Out-Null

if ($failed.Count -gt 0) {
	throw "Distributed run finished with failed jobs: $($failed -join ', ')"
}

Write-Host "Distributed run completed successfully."
Write-Host "Per-worker summaries are in ./results/summary-*.json"
