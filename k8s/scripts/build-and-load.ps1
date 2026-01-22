# Build and load Docker images for Kubernetes
# สคริปต์นี้จะ build images และ load เข้า cluster

Write-Host "Building and loading images for Kubernetes..." -ForegroundColor Cyan
Write-Host ""

# Detect cluster type
$CLUSTER_TYPE = "unknown"
$minikubeRunning = $false
try {
    minikube status 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $CLUSTER_TYPE = "minikube"
        $minikubeRunning = $true
        Write-Host "Detected: Minikube" -ForegroundColor Green
    }
} catch {
    # Minikube not found or not running
}

if (-not $minikubeRunning) {
    $k3sExists = Get-Command k3s -ErrorAction SilentlyContinue
    if ($k3sExists) {
        $CLUSTER_TYPE = "k3s"
        Write-Host "Detected: K3s" -ForegroundColor Green
    } else {
        $CLUSTER_TYPE = "standard"
        Write-Host "Detected: Standard Kubernetes (Docker Desktop)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Build Backend
Write-Host "1. Building Backend image..." -ForegroundColor Blue
Push-Location ..\backend
if (Test-Path "Dockerfile") {
    docker build -t backend:latest .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Backend image built" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Backend build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host "[ERROR] Backend Dockerfile not found" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Build Frontend
Write-Host "2. Building Frontend image..." -ForegroundColor Blue
Push-Location ..\frontend
if (Test-Path "Dockerfile") {
    docker build -t frontend:latest .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Frontend image built" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host "[ERROR] Frontend Dockerfile not found" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Load images to cluster
if ($CLUSTER_TYPE -eq "minikube") {
    Write-Host "3. Loading images to Minikube..." -ForegroundColor Blue
    minikube image load backend:latest
    Write-Host "[OK] Backend image loaded to Minikube" -ForegroundColor Green
    minikube image load frontend:latest
    Write-Host "[OK] Frontend image loaded to Minikube" -ForegroundColor Green
    Write-Host ""
} elseif ($CLUSTER_TYPE -eq "k3s") {
    Write-Host "3. Loading images to K3s..." -ForegroundColor Blue
    docker save backend:latest | k3s ctr images import -
    Write-Host "[OK] Backend image loaded to K3s" -ForegroundColor Green
    docker save frontend:latest | k3s ctr images import -
    Write-Host "[OK] Frontend image loaded to K3s" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "3. Images ready for Docker Desktop Kubernetes" -ForegroundColor Yellow
    Write-Host "   Images are already available in Docker Desktop" -ForegroundColor Green
    Write-Host ""
    Write-Host "   For remote cluster, push to registry:" -ForegroundColor Yellow
    Write-Host "     docker tag backend:latest your-registry/backend:latest"
    Write-Host "     docker push your-registry/backend:latest"
    Write-Host "     docker tag frontend:latest your-registry/frontend:latest"
    Write-Host "     docker push your-registry/frontend:latest"
    Write-Host ""
}

# Restart deployments
Write-Host "4. Restarting deployments..." -ForegroundColor Blue
kubectl rollout restart deployment/backend -n go-fullstack
Write-Host "[OK] Backend deployment restarted" -ForegroundColor Green
kubectl rollout restart deployment/frontend -n go-fullstack
Write-Host "[OK] Frontend deployment restarted" -ForegroundColor Green
Write-Host ""

# Wait and check status
Write-Host "5. Waiting for pods to be ready..." -ForegroundColor Blue
Write-Host "Backend:" -ForegroundColor Yellow
kubectl rollout status deployment/backend -n go-fullstack --timeout=120s
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend rollout timeout or failed" -ForegroundColor Yellow
}
Write-Host "Frontend:" -ForegroundColor Yellow
kubectl rollout status deployment/frontend -n go-fullstack --timeout=120s
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend rollout timeout or failed" -ForegroundColor Yellow
}
Write-Host ""

# Show final status
Write-Host "=== Final Status ===" -ForegroundColor Green
kubectl get pods -n go-fullstack -l 'app in (backend,frontend)'
Write-Host ""

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "If pods are still in ImagePullBackOff:" -ForegroundColor Yellow
Write-Host "  1. Check logs: kubectl describe pod <pod-name> -n go-fullstack"
Write-Host "  2. Verify images: docker images | Select-String -Pattern 'backend|frontend'"
Write-Host "  3. Check image pull policy in deployments"
Write-Host ""
