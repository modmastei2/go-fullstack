# Troubleshoot Script - Go Fullstack
# สคริปต์ตรวจสอบและแก้ปัญหา K8s deployment

$NAMESPACE = "go-fullstack"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Go Fullstack - Troubleshooting" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check namespace
Write-Host "[1] Checking namespace..." -ForegroundColor Blue
$namespaceExists = kubectl get namespace $NAMESPACE 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Namespace: $NAMESPACE" -ForegroundColor Green -NoNewline
    Write-Host " [EXISTS]" -ForegroundColor Green
} else {
    Write-Host "    Namespace: $NAMESPACE" -ForegroundColor Red -NoNewline
    Write-Host " [NOT FOUND]" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: .\apply-all.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Pods Status
Write-Host "[2] Pods Status" -ForegroundColor Blue
kubectl get pods -n $NAMESPACE -o wide
Write-Host ""

$pods = kubectl get pods -n $NAMESPACE -o json | ConvertFrom-Json
$totalPods = $pods.items.Count
$runningPods = ($pods.items | Where-Object { $_.status.phase -eq "Running" }).Count
$pendingPods = ($pods.items | Where-Object { $_.status.phase -eq "Pending" }).Count
$failedPods = ($pods.items | Where-Object { $_.status.phase -eq "Failed" }).Count

Write-Host "    Summary: " -NoNewline
Write-Host "Total=$totalPods " -ForegroundColor White -NoNewline
Write-Host "Running=$runningPods " -ForegroundColor Green -NoNewline
if ($pendingPods -gt 0) {
    Write-Host "Pending=$pendingPods " -ForegroundColor Yellow -NoNewline
}
if ($failedPods -gt 0) {
    Write-Host "Failed=$failedPods" -ForegroundColor Red
} else {
    Write-Host ""
}
Write-Host ""

# 3. Failed/Pending Pods
Write-Host "[3] Failed/Pending Pods" -ForegroundColor Blue
$problemPods = kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running,status.phase!=Succeeded 2>$null
if ([string]::IsNullOrEmpty($problemPods) -or $problemPods -match "No resources found") {
    Write-Host "    No failed or pending pods" -ForegroundColor Green
} else {
    $problemPods
}
Write-Host ""

# 4. Services
Write-Host "[4] Services" -ForegroundColor Blue
kubectl get svc -n $NAMESPACE
Write-Host ""

# 5. PVCs
Write-Host "[5] Persistent Volume Claims" -ForegroundColor Blue
kubectl get pvc -n $NAMESPACE
Write-Host ""

# 6. Recent Events
Write-Host "[6] Recent Events (Last 10)" -ForegroundColor Blue
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | Select-Object -Last 10
Write-Host ""

# Function to check specific service
function Check-Service {
    param([string]$ServiceName)
    
    Write-Host ""
    Write-Host "=== Checking $ServiceName ===" -ForegroundColor Yellow
    Write-Host ""
    
    # Get pod name
    $POD = kubectl get pods -n $NAMESPACE -l app=$ServiceName -o jsonpath='{.items[0].metadata.name}' 2>$null
    
    if ([string]::IsNullOrEmpty($POD)) {
        Write-Host "No pod found for $ServiceName" -ForegroundColor Red
        return
    }
    
    Write-Host "Pod: $POD" -ForegroundColor Cyan
    
    # Check pod status
    $STATUS = kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.phase}'
    Write-Host "Status: $STATUS" -ForegroundColor $(if ($STATUS -eq "Running") { "Green" } else { "Red" })
    
    # Check if pod is ready
    $READY = kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
    Write-Host "Ready: $READY" -ForegroundColor $(if ($READY -eq "True") { "Green" } else { "Red" })
    
    # Check restart count
    $RESTARTS = kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.containerStatuses[0].restartCount}'
    Write-Host "Restart Count: $RESTARTS" -ForegroundColor $(if ([int]$RESTARTS -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host ""
    Write-Host "Last 30 lines of logs:" -ForegroundColor Cyan
    kubectl logs $POD -n $NAMESPACE --tail=30
    
    # If there are restarts, show previous logs
    if ([int]$RESTARTS -gt 0) {
        Write-Host ""
        Write-Host "Previous logs (before restart):" -ForegroundColor Cyan
        kubectl logs $POD -n $NAMESPACE --previous --tail=20 2>$null
    }
    
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Menu for detailed checks
Write-Host "[7] Detailed Service Checks" -ForegroundColor Blue
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host "   1) Backend" -ForegroundColor White
Write-Host "   2) Frontend" -ForegroundColor White
Write-Host "   3) Elasticsearch" -ForegroundColor White
Write-Host "   4) Kibana" -ForegroundColor White
Write-Host "   5) Redis" -ForegroundColor White
Write-Host "   6) Vault" -ForegroundColor White
Write-Host "   7) MinIO" -ForegroundColor White
Write-Host "   8) Fluent-bit" -ForegroundColor White
Write-Host "   A) All services" -ForegroundColor Yellow
Write-Host "   Q) Skip" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Select service to check (1-8/A/Q)"

switch ($choice.ToUpper()) {
    "1" { Check-Service "backend" }
    "2" { Check-Service "frontend" }
    "3" { Check-Service "elasticsearch" }
    "4" { Check-Service "kibana" }
    "5" { Check-Service "redis" }
    "6" { Check-Service "vault" }
    "7" { Check-Service "minio" }
    "8" { Check-Service "fluent-bit" }
    "A" {
        Check-Service "backend"
        Check-Service "frontend"
        Check-Service "elasticsearch"
        Check-Service "kibana"
        Check-Service "redis"
        Check-Service "vault"
        Check-Service "minio"
        Check-Service "fluent-bit"
    }
    "Q" { Write-Host "Skipped detailed checks" -ForegroundColor Gray }
    default { Write-Host "Invalid choice" -ForegroundColor Red }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Troubleshooting Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Common Commands:" -ForegroundColor Yellow
Write-Host "  View pod logs:      " -NoNewline; Write-Host "kubectl logs -n $NAMESPACE <pod-name>" -ForegroundColor Gray
Write-Host "  View live logs:     " -NoNewline; Write-Host "kubectl logs -f -n $NAMESPACE <pod-name>" -ForegroundColor Gray
Write-Host "  Describe pod:       " -NoNewline; Write-Host "kubectl describe pod -n $NAMESPACE <pod-name>" -ForegroundColor Gray
Write-Host "  Get pod shell:      " -NoNewline; Write-Host "kubectl exec -it -n $NAMESPACE <pod-name> -- sh" -ForegroundColor Gray
Write-Host "  Port forward:       " -NoNewline; Write-Host "kubectl port-forward -n $NAMESPACE svc/<service> <port>:<port>" -ForegroundColor Gray
Write-Host "  Restart deployment: " -NoNewline; Write-Host "kubectl rollout restart deployment/<name> -n $NAMESPACE" -ForegroundColor Gray
Write-Host ""
