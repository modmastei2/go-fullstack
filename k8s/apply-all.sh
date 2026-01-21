#!/bin/bash

# Apply all Kubernetes manifests for Go Fullstack Application
# สคริปต์นี้จะ deploy ทุกอย่างตามลำดับที่ถูกต้อง

set -e  # Exit on error

echo "🚀 Deploying Go Fullstack Application to Kubernetes..."

# สี่สำหรับ output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait for pods to be ready
wait_for_pods() {
    local namespace=$1
    local label=$2
    local timeout=${3:-120}
    
    echo -e "${YELLOW}⏳ Waiting for pods with label $label to be ready...${NC}"
    kubectl wait --for=condition=ready pod \
        -l "$label" \
        -n "$namespace" \
        --timeout="${timeout}s" 2>/dev/null || true
}

# 1. Create Namespace
echo -e "\n${BLUE}📦 Step 1: Creating namespace...${NC}"
kubectl apply -f namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"

# 2. Deploy Redis
echo -e "\n${BLUE}📦 Step 2: Deploying Redis...${NC}"
kubectl apply -f redis/
wait_for_pods "go-fullstack" "app=redis"
echo -e "${GREEN}✓ Redis deployed${NC}"

# 3. Deploy MinIO
echo -e "\n${BLUE}📦 Step 3: Deploying MinIO...${NC}"
kubectl apply -f minio/
wait_for_pods "go-fullstack" "app=minio"
echo -e "${GREEN}✓ MinIO deployed${NC}"

# 4. Deploy Vault
echo -e "\n${BLUE}📦 Step 4: Deploying Vault...${NC}"
kubectl apply -f vault/vault-secret.yaml
kubectl apply -f vault/vault-deployment.yaml
kubectl apply -f vault/vault-service.yaml
wait_for_pods "go-fullstack" "app=vault"
echo -e "${GREEN}✓ Vault deployed${NC}"

# 5. Initialize Vault secrets
echo -e "\n${BLUE}📦 Step 5: Initializing Vault secrets...${NC}"
kubectl apply -f vault/vault-init-job.yaml
kubectl wait --for=condition=complete job/vault-init -n go-fullstack --timeout=60s
echo -e "${GREEN}✓ Vault secrets initialized${NC}"

# 6. Deploy ELK Stack
echo -e "\n${BLUE}📦 Step 6: Deploying ELK Stack...${NC}"
kubectl apply -f elk/elasticsearch-pvc.yaml
kubectl apply -f elk/elasticsearch-deployment.yaml
kubectl apply -f elk/elasticsearch-service.yaml
wait_for_pods "go-fullstack" "app=elasticsearch" 300
echo -e "${GREEN}✓ Elasticsearch deployed${NC}"

kubectl apply -f elk/kibana-deployment.yaml
kubectl apply -f elk/kibana-service.yaml
wait_for_pods "go-fullstack" "app=kibana" 300
echo -e "${GREEN}✓ Kibana deployed${NC}"

kubectl apply -f elk/fluent-bit-rbac.yaml
kubectl apply -f elk/fluent-bit-configmap.yaml
kubectl apply -f elk/fluent-bit-daemonset.yaml
echo -e "${GREEN}✓ Fluent-bit deployed${NC}"

# Initialize Kibana data view
echo -e "\n${BLUE}📦 Step 6.1: Initializing Kibana data view...${NC}"
kubectl apply -f elk/kibana-init-job.yaml
kubectl wait --for=condition=complete job/kibana-init -n go-fullstack --timeout=120s || echo "Kibana init job may still be running"
echo -e "${GREEN}✓ Kibana initialized${NC}"

# 7. Deploy Backend
echo -e "\n${BLUE}📦 Step 7: Deploying Backend...${NC}"
kubectl apply -f backend/
wait_for_pods "go-fullstack" "app=backend"
echo -e "${GREEN}✓ Backend deployed${NC}"

# 8. Deploy Frontend
echo -e "\n${BLUE}📦 Step 8: Deploying Frontend...${NC}"
kubectl apply -f frontend/
wait_for_pods "go-fullstack" "app=frontend"
echo -e "${GREEN}✓ Frontend deployed${NC}"

# 9. Create TLS Secret for Ingress
echo -e "\n${BLUE}📦 Step 9: Creating TLS secret for SSL...${NC}"
if [ -f "../certs/dev.cert.pem" ] && [ -f "../certs/dev.cert.key" ]; then
    kubectl create secret tls go-fullstack-tls \
        --cert=../certs/dev.cert.pem \
        --key=../certs/dev.cert.key \
        -n go-fullstack \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✓ TLS secret created${NC}"
else
    echo -e "${YELLOW}⚠️  Certificate files not found in ../certs/${NC}"
    echo -e "${YELLOW}   Skipping TLS secret creation.${NC}"
    echo -e "${YELLOW}   Ingress may not work without SSL certificates.${NC}"
fi

# 10. Deploy Ingress
if [ -f "ingress.yaml" ]; then
    echo -e "\n${BLUE}📦 Step 10: Deploying Ingress...${NC}"
    kubectl apply -f ingress.yaml
    echo -e "${GREEN}✓ Ingress deployed${NC}"
fi

# Summary
echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "\n${BLUE}📊 Deployment Summary:${NC}"
kubectl get pods -n go-fullstack
echo ""
kubectl get svc -n go-fullstack

echo -e "\n${YELLOW}💡 To access the services:${NC}"
echo -e "  ${GREEN}With Ingress (HTTPS):${NC} https://go-fullstack.local/ (requires hosts file entry)"
echo "  Frontend:  kubectl port-forward -n go-fullstack svc/frontend 3000:80"
echo "  Backend:   kubectl port-forward -n go-fullstack svc/backend 8080:8080"
echo "  Kibana:    kubectl port-forward -n go-fullstack svc/kibana 5601:5601"
echo "  MinIO:     kubectl port-forward -n go-fullstack svc/minio 9001:9001"
echo ""
echo -e "${YELLOW}🔒 SSL/TLS Setup:${NC}"
echo "  1. Add to /etc/hosts: 127.0.0.1 go-fullstack.local"
echo -e "  2. Port forward ingress (choose one method):"
echo ""
echo -e "     ${GREEN}Foreground (simple):${NC}"
echo "       kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443"
echo ""
echo -e "     ${GREEN}Background (recommended):${NC}"
echo "       kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 &"
echo "       jobs                  # Check background jobs"
echo "       killall kubectl       # Stop when done"
echo ""
echo -e "  3. Visit: ${GREEN}https://127.0.0.1:8443/${NC}"
echo ""
echo -e "${GREEN}For detailed instructions, see START-HERE.md${NC}"
echo ""
