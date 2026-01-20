#!/bin/bash

# Build and load Docker images for Kubernetes
# สคริปต์นี้จะ build images และ load เข้า cluster

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Building and loading images for Kubernetes...${NC}"
echo ""

# Detect cluster type
CLUSTER_TYPE="unknown"
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    CLUSTER_TYPE="minikube"
    echo -e "${GREEN}Detected: Minikube${NC}"
elif command -v k3s &> /dev/null; then
    CLUSTER_TYPE="k3s"
    echo -e "${GREEN}Detected: K3s${NC}"
else
    CLUSTER_TYPE="standard"
    echo -e "${YELLOW}Detected: Standard Kubernetes${NC}"
    echo -e "${YELLOW}Note: You may need to push images to a registry${NC}"
fi
echo ""

# Build Backend
echo -e "${BLUE}1. Building Backend image...${NC}"
cd ../backend
if [ -f "Dockerfile" ]; then
    docker build -t backend:latest .
    echo -e "${GREEN}✓ Backend image built${NC}"
else
    echo -e "${RED}✗ Backend Dockerfile not found${NC}"
    exit 1
fi
cd ../k8s
echo ""

# Build Frontend
echo -e "${BLUE}2. Building Frontend image...${NC}"
cd ../frontend
if [ -f "Dockerfile" ]; then
    docker build -t frontend:latest .
    echo -e "${GREEN}✓ Frontend image built${NC}"
else
    echo -e "${RED}✗ Frontend Dockerfile not found${NC}"
    exit 1
fi
cd ../k8s
echo ""

# Load images to cluster
if [ "$CLUSTER_TYPE" == "minikube" ]; then
    echo -e "${BLUE}3. Loading images to Minikube...${NC}"
    minikube image load backend:latest
    echo -e "${GREEN}✓ Backend image loaded to Minikube${NC}"
    minikube image load frontend:latest
    echo -e "${GREEN}✓ Frontend image loaded to Minikube${NC}"
    echo ""
elif [ "$CLUSTER_TYPE" == "k3s" ]; then
    echo -e "${BLUE}3. Loading images to K3s...${NC}"
    docker save backend:latest | sudo k3s ctr images import -
    echo -e "${GREEN}✓ Backend image loaded to K3s${NC}"
    docker save frontend:latest | sudo k3s ctr images import -
    echo -e "${GREEN}✓ Frontend image loaded to K3s${NC}"
    echo ""
else
    echo -e "${YELLOW}3. Manual steps required:${NC}"
    echo "   For Docker Desktop Kubernetes: Images are already available"
    echo "   For remote cluster: Push to registry:"
    echo "     docker tag backend:latest your-registry/backend:latest"
    echo "     docker push your-registry/backend:latest"
    echo "     docker tag frontend:latest your-registry/frontend:latest"
    echo "     docker push your-registry/frontend:latest"
    echo ""
fi

# Restart deployments
echo -e "${BLUE}4. Restarting deployments...${NC}"
kubectl rollout restart deployment/backend -n go-fullstack
echo -e "${GREEN}✓ Backend deployment restarted${NC}"
kubectl rollout restart deployment/frontend -n go-fullstack
echo -e "${GREEN}✓ Frontend deployment restarted${NC}"
echo ""

# Wait and check status
echo -e "${BLUE}5. Waiting for pods to be ready...${NC}"
echo "Backend:"
kubectl rollout status deployment/backend -n go-fullstack --timeout=120s || echo -e "${YELLOW}Backend rollout timeout${NC}"
echo "Frontend:"
kubectl rollout status deployment/frontend -n go-fullstack --timeout=120s || echo -e "${YELLOW}Frontend rollout timeout${NC}"
echo ""

# Show final status
echo -e "${GREEN}=== Final Status ===${NC}"
kubectl get pods -n go-fullstack -l 'app in (backend,frontend)'
echo ""

echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo -e "${YELLOW}If pods are still in ImagePullBackOff:${NC}"
echo "  1. Check logs: kubectl describe pod <pod-name> -n go-fullstack"
echo "  2. Verify images: docker images | grep -E 'backend|frontend'"
echo "  3. For Minikube: eval \$(minikube docker-env) then rebuild"
echo ""
