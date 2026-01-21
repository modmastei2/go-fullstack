# Apply all Kubernetes manifests for Go Fullstack Application
# สคริปต์นี้จะ deploy ทุกอย่างตามลำดับที่ถูกต้อง

Write-Host "Deploying Go Fullstack Application to Kubernetes..." -ForegroundColor Cyan

# Function to wait for pods to be ready
function Wait-ForPods {
    param(
        [string]$Namespace,
        [string]$Label,
        [int]$Timeout = 120
    )
    
    Write-Host "Waiting for pods with label $Label to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=ready pod -l $Label -n $Namespace --timeout="${Timeout}s" 2>$null
}

# 1. Create Namespace
Write-Host ""
Write-Host "Step 1: Creating namespace..." -ForegroundColor Blue
kubectl apply -f namespace.yaml
Write-Host "[OK] Namespace created" -ForegroundColor Green

# 2. Deploy Redis
Write-Host ""
Write-Host "Step 2: Deploying Redis..." -ForegroundColor Blue
kubectl apply -f redis/
Wait-ForPods -Namespace "go-fullstack" -Label "app=redis"
Write-Host "[OK] Redis deployed" -ForegroundColor Green

# 3. Deploy MinIO
Write-Host ""
Write-Host "Step 3: Deploying MinIO..." -ForegroundColor Blue
kubectl apply -f minio/
Wait-ForPods -Namespace "go-fullstack" -Label "app=minio"
Write-Host "[OK] MinIO deployed" -ForegroundColor Green

# 4. Deploy Vault
Write-Host ""
Write-Host "Step 4: Deploying Vault..." -ForegroundColor Blue
kubectl apply -f vault/vault-secret.yaml
kubectl apply -f vault/vault-deployment.yaml
kubectl apply -f vault/vault-service.yaml
Wait-ForPods -Namespace "go-fullstack" -Label "app=vault"
Write-Host "[OK] Vault deployed" -ForegroundColor Green

# 5. Initialize Vault secrets
Write-Host ""
Write-Host "Step 5: Initializing Vault secrets..." -ForegroundColor Blue
kubectl apply -f vault/vault-init-job.yaml
kubectl wait --for=condition=complete job/vault-init -n go-fullstack --timeout=60s
Write-Host "[OK] Vault secrets initialized" -ForegroundColor Green

# 6. Deploy ELK Stack
Write-Host ""
Write-Host "Step 6: Deploying ELK Stack..." -ForegroundColor Blue
kubectl apply -f elk/elasticsearch-pvc.yaml
kubectl apply -f elk/elasticsearch-deployment.yaml
kubectl apply -f elk/elasticsearch-service.yaml
Wait-ForPods -Namespace "go-fullstack" -Label "app=elasticsearch" -Timeout 300
Write-Host "[OK] Elasticsearch deployed" -ForegroundColor Green

kubectl apply -f elk/kibana-deployment.yaml
kubectl apply -f elk/kibana-service.yaml
Wait-ForPods -Namespace "go-fullstack" -Label "app=kibana" -Timeout 300
Write-Host "[OK] Kibana deployed" -ForegroundColor Green

kubectl apply -f elk/fluent-bit-rbac.yaml
kubectl apply -f elk/fluent-bit-configmap.yaml
kubectl apply -f elk/fluent-bit-daemonset.yaml
Write-Host "[OK] Fluent-bit deployed" -ForegroundColor Green

# Initialize Kibana data view
Write-Host ""
Write-Host "Step 6.1: Initializing Kibana data view..." -ForegroundColor Blue
kubectl apply -f elk/kibana-init-job.yaml
kubectl wait --for=condition=complete job/kibana-init -n go-fullstack --timeout=120s 2>$null
Write-Host "[OK] Kibana initialized" -ForegroundColor Green

# 7. Deploy Backend
Write-Host ""
Write-Host "Step 7: Deploying Backend..." -ForegroundColor Blue
kubectl apply -f backend/
Wait-ForPods -Namespace "go-fullstack" -Label "app=backend"
Write-Host "[OK] Backend deployed" -ForegroundColor Green

# 8. Deploy Frontend
Write-Host ""
Write-Host "Step 8: Deploying Frontend..." -ForegroundColor Blue
kubectl apply -f frontend/
Wait-ForPods -Namespace "go-fullstack" -Label "app=frontend"
Write-Host "[OK] Frontend deployed" -ForegroundColor Green

# 9. Create TLS Secret for Ingress
Write-Host ""
Write-Host "Step 9: Creating TLS secret for SSL..." -ForegroundColor Blue
if ((Test-Path "../certs/dev.cert.pem") -and (Test-Path "../certs/dev.cert.key")) {
    kubectl create secret tls go-fullstack-tls `
        --cert=../certs/dev.cert.pem `
        --key=../certs/dev.cert.key `
        -n go-fullstack `
        --dry-run=client -o yaml | kubectl apply -f -
    Write-Host "[OK] TLS secret created" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Certificate files not found in ../certs/" -ForegroundColor Yellow
    Write-Host "          Skipping TLS secret creation." -ForegroundColor Yellow
    Write-Host "          Ingress may not work without SSL certificates." -ForegroundColor Yellow
}

# 10. Deploy Ingress
if (Test-Path "ingress.yaml") {
    Write-Host ""
    Write-Host "Step 10: Deploying Ingress..." -ForegroundColor Blue
    kubectl apply -f ingress.yaml
    Write-Host "[OK] Ingress deployed" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor Blue
kubectl get pods -n go-fullstack
Write-Host ""
kubectl get svc -n go-fullstack

Write-Host ""
Write-Host "To access the services:" -ForegroundColor Yellow
Write-Host "  With Ingress (HTTPS): https://go-fullstack.local/ (requires hosts file entry)" -ForegroundColor Cyan
Write-Host "  Frontend:  kubectl port-forward -n go-fullstack svc/frontend 3000:80"
Write-Host "  Backend:   kubectl port-forward -n go-fullstack svc/backend 8080:8080"
Write-Host "  Kibana:    kubectl port-forward -n go-fullstack svc/kibana 5601:5601"
Write-Host "  MinIO:     kubectl port-forward -n go-fullstack svc/minio 9001:9001"
Write-Host ""
Write-Host "SSL/TLS Setup:" -ForegroundColor Yellow
Write-Host "  1. Add to hosts file: 127.0.0.1 go-fullstack.local"
Write-Host "  2. Port forward ingress (choose one method):" -ForegroundColor Cyan
Write-Host ""
Write-Host "     Foreground (simple):" -ForegroundColor White
Write-Host "       kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443"
Write-Host ""
Write-Host "     Background (recommended):" -ForegroundColor White
Write-Host "       Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 }"
Write-Host "       Get-Job                    # Check status"
Write-Host "       Stop-Job -Name ingress     # Stop when done"
Write-Host "       Remove-Job -Name ingress   # Clean up"
Write-Host ""
Write-Host "  3. Visit: https://127.0.0.1:8443/" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see START-HERE.md" -ForegroundColor Green
Write-Host ""
