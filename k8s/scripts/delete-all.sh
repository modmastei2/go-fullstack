#!/bin/bash

# Delete all Kubernetes resources for Go Fullstack Application
# สคริปต์นี้จะลบทุกอย่างตามลำดับที่ถูกต้อง (reverse order)

set -e  # Exit on error

echo "🗑️  Deleting Go Fullstack Application from Kubernetes..."

# สีสำหรับ output
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Delete Ingress (if exists)
if [ -f "../manifests/ingress.yaml" ]; then
    echo -e "\n${BLUE}🗑️  Step 1: Deleting Ingress...${NC}"
    kubectl delete -f ../manifests/ingress.yaml --ignore-not-found=true
    echo -e "${RED}✓ Ingress deleted${NC}"
fi

# 2. Delete Frontend
echo -e "\n${BLUE}🗑️  Step 2: Deleting Frontend...${NC}"
kubectl delete -f ../frontend/ --ignore-not-found=true
echo -e "${RED}✓ Frontend deleted${NC}"

# 3. Delete Backend
echo -e "\n${BLUE}🗑️  Step 3: Deleting Backend...${NC}"
kubectl delete -f ../backend/ --ignore-not-found=true
echo -e "${RED}✓ Backend deleted${NC}"

# 4. Delete ELK Stack
echo -e "\n${BLUE}🗑️  Step 4: Deleting ELK Stack...${NC}"
kubectl delete -f ../elk/kibana-init-job.yaml --ignore-not-found=true
kubectl delete -f ../elk/fluent-bit-daemonset.yaml --ignore-not-found=true
kubectl delete -f ../elk/fluent-bit-configmap.yaml --ignore-not-found=true
kubectl delete -f ../elk/fluent-bit-rbac.yaml --ignore-not-found=true
kubectl delete -f ../elk/kibana-deployment.yaml --ignore-not-found=true
kubectl delete -f ../elk/kibana-service.yaml --ignore-not-found=true
kubectl delete -f ../elk/elasticsearch-deployment.yaml --ignore-not-found=true
kubectl delete -f ../elk/elasticsearch-service.yaml --ignore-not-found=true
kubectl delete -f ../elk/elasticsearch-pvc.yaml --ignore-not-found=true
echo -e "${RED}✓ ELK Stack deleted${NC}"

# 5. Delete Vault
echo -e "\n${BLUE}🗑️  Step 5: Deleting Vault...${NC}"
kubectl delete -f ../vault/vault-init-job.yaml --ignore-not-found=true
kubectl delete -f ../vault/ --ignore-not-found=true
echo -e "${RED}✓ Vault deleted${NC}"

# 6. Delete MinIO
echo -e "\n${BLUE}🗑️  Step 6: Deleting MinIO...${NC}"
kubectl delete -f ../minio/ --ignore-not-found=true
echo -e "${RED}✓ MinIO deleted${NC}"

# 7. Delete Redis
echo -e "\n${BLUE}🗑️  Step 7: Deleting Redis...${NC}"
kubectl delete -f ../redis/ --ignore-not-found=true
echo -e "${RED}✓ Redis deleted${NC}"

# 8. Delete Namespace (this will delete everything remaining)
echo -e "\n${BLUE}🗑️  Step 8: Deleting namespace...${NC}"
echo -e "${YELLOW}⚠️  This will permanently delete all data. Continue? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    kubectl delete -f ../manifests/namespace.yaml --ignore-not-found=true
    echo -e "${RED}✓ Namespace deleted${NC}"
else
    echo -e "${YELLOW}Skipped namespace deletion${NC}"
fi

echo -e "\n${RED}✅ Cleanup completed!${NC}"
echo -e "\n${BLUE}📊 Remaining resources in namespace:${NC}"
kubectl get all -n go-fullstack 2>/dev/null || echo "Namespace has been deleted"
echo ""
