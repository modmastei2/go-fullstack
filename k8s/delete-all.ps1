# Delete all Kubernetes resources for Go Fullstack Application
# สคริปต์นี้จะลบทุกอย่างตามลำดับที่ถูกต้อง (reverse order)

Write-Host "Deleting Go Fullstack Application from Kubernetes..." -ForegroundColor Cyan

# 1. Delete Ingress (if exists)
if (Test-Path "ingress.yaml") {
    Write-Host ""
    Write-Host "Step 1: Deleting Ingress..." -ForegroundColor Blue
    kubectl delete -f ingress.yaml --ignore-not-found=true
    Write-Host "[OK] Ingress deleted" -ForegroundColor Red
}

# 2. Delete Frontend
Write-Host ""
Write-Host "Step 2: Deleting Frontend..." -ForegroundColor Blue
kubectl delete -f frontend/ --ignore-not-found=true
Write-Host "[OK] Frontend deleted" -ForegroundColor Red

# 3. Delete Backend
Write-Host ""
Write-Host "Step 3: Deleting Backend..." -ForegroundColor Blue
kubectl delete -f backend/ --ignore-not-found=true
Write-Host "[OK] Backend deleted" -ForegroundColor Red

# 4. Delete ELK Stack
Write-Host ""
Write-Host "Step 4: Deleting ELK Stack..." -ForegroundColor Blue
kubectl delete -f elk/kibana-init-job.yaml --ignore-not-found=true
kubectl delete -f elk/fluent-bit-daemonset.yaml --ignore-not-found=true
kubectl delete -f elk/fluent-bit-configmap.yaml --ignore-not-found=true
kubectl delete -f elk/fluent-bit-rbac.yaml --ignore-not-found=true
kubectl delete -f elk/kibana-deployment.yaml --ignore-not-found=true
kubectl delete -f elk/kibana-service.yaml --ignore-not-found=true
kubectl delete -f elk/elasticsearch-deployment.yaml --ignore-not-found=true
kubectl delete -f elk/elasticsearch-service.yaml --ignore-not-found=true
kubectl delete -f elk/elasticsearch-pvc.yaml --ignore-not-found=true
Write-Host "[OK] ELK Stack deleted" -ForegroundColor Red

# 5. Delete Vault
Write-Host ""
Write-Host "Step 5: Deleting Vault..." -ForegroundColor Blue
kubectl delete -f vault/vault-init-job.yaml --ignore-not-found=true
kubectl delete -f vault/ --ignore-not-found=true
Write-Host "[OK] Vault deleted" -ForegroundColor Red

# 6. Delete MinIO
Write-Host ""
Write-Host "Step 6: Deleting MinIO..." -ForegroundColor Blue
kubectl delete -f minio/ --ignore-not-found=true
Write-Host "[OK] MinIO deleted" -ForegroundColor Red

# 7. Delete Redis
Write-Host ""
Write-Host "Step 7: Deleting Redis..." -ForegroundColor Blue
kubectl delete -f redis/ --ignore-not-found=true
Write-Host "[OK] Redis deleted" -ForegroundColor Red

# 8. Delete Namespace
Write-Host ""
Write-Host "Step 8: Deleting namespace..." -ForegroundColor Blue
Write-Host "WARNING: This will permanently delete all data. Continue? (y/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -match "^[yY](es)?$") {
    kubectl delete -f namespace.yaml --ignore-not-found=true
    Write-Host "[OK] Namespace deleted" -ForegroundColor Red
} else {
    Write-Host "Skipped namespace deletion" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Red
Write-Host ""
Write-Host "Remaining resources in namespace:" -ForegroundColor Blue
kubectl get all -n go-fullstack 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Namespace has been deleted"
}
Write-Host ""
