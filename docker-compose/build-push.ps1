# ================================
# STRICT MODE (fail fast)
# ================================
$ErrorActionPreference = "Stop"

# ================================
# CONFIG
# ================================
$dockerRepo = "nguyenvu04/tracknest"
$composeFile = "docker-compose.prod.yaml"

# 🔴 SINGLE SOURCE OF TRUTH
$version = "v1.2.6"

if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Version must be explicitly defined."
}

Write-Host "Using version: $version"

$services = @(
    "criminal_reports",
    "emergency_ops",
    "keycloak",
    "user_tracking",
    "web"
)

# ================================
# BUILD (NO CONTAINERS)
# ================================
Write-Host "Building images..."
docker compose -f $composeFile build

# ================================
# TAG + PUSH
# ================================
foreach ($service in $services) {
    $sourceImage = "docker-compose-$service`:latest"
    $normalized = $service -replace '_',''

    # Use format operator to avoid parsing bugs
    $targetImage = "{0}-{1}:{2}" -f $dockerRepo, $normalized, $version

    Write-Host "Tagging $sourceImage -> $targetImage"
    docker tag $sourceImage $targetImage

    Write-Host "Pushing $targetImage"
    docker push $targetImage
}

Write-Host "Build and push completed."