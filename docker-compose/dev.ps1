<#
.SYNOPSIS
    Build and manage the TrackNest dev Docker Compose stack.

.DESCRIPTION
    Wraps docker compose -f docker-compose.yaml for the common dev workflows.

.PARAMETER Fresh
    Stop containers, wipe ALL named volumes, then rebuild and start from scratch.
    Use this when you change a database init SQL file (init scripts only run on
    empty volumes).

.PARAMETER Down
    Stop and remove all containers (volumes are preserved).

.PARAMETER NoBuild
    Start services without rebuilding images.

.PARAMETER Rebuild
    Rebuild and hot-swap a single service without touching the rest of the stack.
    Example: .\dev.ps1 -Rebuild user_tracking

.PARAMETER Logs
    Follow aggregated logs after starting. When used with -Rebuild, follows only
    that service's logs. Press Ctrl+C to exit.

.PARAMETER Status
    Print current container state and health without starting anything.

.PARAMETER Help
    Show usage information.

.EXAMPLE
    .\dev.ps1                           # build + start everything
    .\dev.ps1 -Fresh                    # wipe data + full rebuild
    .\dev.ps1 -Rebuild criminal_reports # rebuild one service
    .\dev.ps1 -Down                     # stop everything
    .\dev.ps1 -Status                   # show container health
    .\dev.ps1 -Logs                     # start + follow logs
#>

[CmdletBinding()]
param(
    [switch]$Fresh,
    [switch]$Down,
    [switch]$NoBuild,
    [string]$Rebuild,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# ── Helpers ──────────────────────────────────────────────────────────────────

function Write-Step($msg)    { Write-Host "`n▶  $msg" -ForegroundColor White }
function Write-Info($msg)    { Write-Host "   $msg" -ForegroundColor Cyan }
function Write-Ok($msg)      { Write-Host "   ✓  $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "   !  $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "   ✗  $msg" -ForegroundColor Red }

# ── Guard: must be in the docker-compose/ directory ──────────────────────────

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$composeFile = "docker-compose.yaml"

if (-not (Test-Path $composeFile)) {
    Write-Err "$composeFile not found. Run this script from the docker-compose/ directory."
    exit 1
}

# ── Guard: Docker must be running ────────────────────────────────────────────

$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker is not running. Start Docker Desktop and try again."
    exit 1
}

# ── Help ─────────────────────────────────────────────────────────────────────

if ($Help) {
    Write-Host @"

TrackNest dev stack builder

USAGE
  .\dev.ps1 [options]

OPTIONS
  (none)              Build images and start all services (detached)
  -Fresh              Wipe all volumes and rebuild from scratch
                      ⚠ Deletes all DB data, Keycloak config, MinIO objects
  -Down               Stop and remove containers (volumes kept)
  -NoBuild            Start without rebuilding images
  -Rebuild <service>  Rebuild and restart one service only
  -Logs               Follow logs after starting (Ctrl+C to exit)
  -Status             Show container state and health
  -Help               Show this message

SERVICES
  criminal_reports  emergency_ops  user_tracking
  keycloak  web  envoy  nginx

ENDPOINTS (once running)
  Web UI      http://localhost
  Keycloak    http://localhost/auth         admin / admin
  MinIO       http://localhost:9001         minioadmin / minioadmin
  Envoy admin http://localhost:9901
  Kafka       localhost:29092 39092 49092
  Redis       localhost:6379
  Postgres    user-tracking 15432 | emergency-ops 25432 | criminal-reports 35432

"@
    exit 0
}

# ── -Down ────────────────────────────────────────────────────────────────────

if ($Down) {
    Write-Step "Stopping and removing all containers"
    docker compose -f $composeFile down --remove-orphans
    Write-Ok "Stack stopped (volumes preserved)"
    exit 0
}

# ── -Status ──────────────────────────────────────────────────────────────────

if ($Status) {
    Write-Step "Container status"
    docker compose -f $composeFile ps
    exit 0
}

# ── -Rebuild <service> ───────────────────────────────────────────────────────

if ($Rebuild) {
    $validServices = @(
        "criminal_reports","emergency_ops","user_tracking",
        "keycloak","web","envoy","nginx"
    )
    if ($Rebuild -notin $validServices) {
        Write-Err "Unknown service '$Rebuild'. Valid: $($validServices -join ', ')"
        exit 1
    }

    Write-Step "Rebuilding image for '$Rebuild'"
    docker compose -f $composeFile build $Rebuild
    if ($LASTEXITCODE -ne 0) { Write-Err "Build failed"; exit 1 }

    Write-Step "Restarting '$Rebuild' (other services untouched)"
    docker compose -f $composeFile up -d --no-deps $Rebuild
    if ($LASTEXITCODE -ne 0) { Write-Err "Start failed"; exit 1 }

    Write-Ok "'$Rebuild' rebuilt and restarted"

    if ($Logs) {
        Write-Step "Following logs for '$Rebuild' (Ctrl+C to stop)"
        docker compose -f $composeFile logs -f $Rebuild
    }
    exit 0
}

# ── -Fresh ───────────────────────────────────────────────────────────────────

if ($Fresh) {
    Write-Step "Fresh start requested"
    Write-Warn "This will DELETE all database data, Keycloak config, and MinIO objects."
    Write-Warn "DB init SQL files only run on empty volumes — use this after schema changes."
    Write-Host ""
    $confirm = Read-Host "   Type 'yes' to continue, anything else to cancel"
    if ($confirm -ne "yes") {
        Write-Host "   Cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Step "Tearing down containers and wiping volumes"
    docker compose -f $composeFile down -v --remove-orphans
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to tear down stack"; exit 1 }
    Write-Ok "Volumes wiped"
}

# ── Build + start ─────────────────────────────────────────────────────────────

if ($NoBuild) {
    Write-Step "Starting all services (skipping image build)"
    docker compose -f $composeFile up -d
} else {
    Write-Step "Building images and starting all services"
    docker compose -f $composeFile up --build -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Err "docker compose up failed — check the output above"
    exit 1
}

Write-Ok "Stack started"

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Step "Container status"
docker compose -f $composeFile ps

Write-Host ""
Write-Info "Endpoints:"
Write-Info "  Web UI      →  http://localhost"
Write-Info "  Keycloak    →  http://localhost/auth         (admin / admin)"
Write-Info "  MinIO UI    →  http://localhost:9001         (minioadmin / minioadmin)"
Write-Info "  Envoy admin →  http://localhost:9901"
Write-Info "  Kafka       →  localhost:29092, 39092, 49092"
Write-Info "  Redis       →  localhost:6379"
Write-Info "  Postgres    →  user-tracking: 15432 | emergency-ops: 25432 | criminal-reports: 35432"
Write-Host ""
Write-Info "Tip: .\dev.ps1 -Logs to follow all logs, or -Rebuild <service> to hot-swap one service."
Write-Host ""

# ── Optional log tailing ──────────────────────────────────────────────────────

if ($Logs) {
    Write-Step "Following logs (Ctrl+C to stop)"
    docker compose -f $composeFile logs -f
}
