#!/bin/bash
# Troubleshoot Script - Go Fullstack
# สคริปต์ตรวจสอบและแก้ปัญหา K8s deployment

NAMESPACE="go-fullstack"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  Go Fullstack - Troubleshooting${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# 1. Check namespace
echo -e "${BLUE}[1] Checking namespace...${NC}"
if kubectl get namespace $NAMESPACE &>/dev/null; then
    echo -e "    Namespace: $NAMESPACE ${GREEN}[EXISTS]${NC}"
else
    echo -e "    Namespace: $NAMESPACE ${RED}[NOT FOUND]${NC}"
    echo ""
    echo -e "${YELLOW}Run: ./apply-all.sh${NC}"
    exit 1
fi
echo ""

# 2. Pods Status
echo -e "${BLUE}[2] Pods Status${NC}"
kubectl get pods -n $NAMESPACE -o wide
echo ""

total=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
running=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | grep -c Running)
pending=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | grep -c Pending)
failed=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | grep -c Failed)

echo -n "    Summary: "
echo -n "Total=$total "
echo -ne "${GREEN}Running=$running${NC} "
if [ $pending -gt 0 ]; then
    echo -ne "${YELLOW}Pending=$pending${NC} "
fi
if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed=$failed${NC}"
else
    echo ""
fi
echo ""

# 3. Failed/Pending Pods
echo -e "${BLUE}[3] Failed/Pending Pods${NC}"
problem_pods=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running,status.phase!=Succeeded 2>/dev/null)
if [ -z "$problem_pods" ] || echo "$problem_pods" | grep -q "No resources found"; then
    echo -e "    ${GREEN}No failed or pending pods${NC}"
else
    echo "$problem_pods"
fi
echo ""

# 4. Services
echo -e "${BLUE}[4] Services${NC}"
kubectl get svc -n $NAMESPACE
echo ""

# 5. PVCs
echo -e "${BLUE}[5] Persistent Volume Claims${NC}"
kubectl get pvc -n $NAMESPACE
echo ""

# 6. Recent Events
echo -e "${BLUE}[6] Recent Events (Last 10)${NC}"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10
echo ""

# Function to check specific service
check_service() {
    local service=$1
    
    echo ""
    echo -e "${YELLOW}=== Checking $service ===${NC}"
    echo ""
    
    # Get pod name
    POD=$(kubectl get pods -n $NAMESPACE -l app=$service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$POD" ]; then
        echo -e "${RED}No pod found for $service${NC}"
        return
    fi
    
    echo -e "${CYAN}Pod: $POD${NC}"
    
    # Check pod status
    STATUS=$(kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.phase}')
    if [ "$STATUS" = "Running" ]; then
        echo -e "Status: ${GREEN}$STATUS${NC}"
    else
        echo -e "Status: ${RED}$STATUS${NC}"
    fi
    
    # Check if pod is ready
    READY=$(kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$READY" = "True" ]; then
        echo -e "Ready: ${GREEN}$READY${NC}"
    else
        echo -e "Ready: ${RED}$READY${NC}"
    fi
    
    # Check restart count
    RESTARTS=$(kubectl get pod $POD -n $NAMESPACE -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null)
    if [ -z "$RESTARTS" ]; then
        RESTARTS=0
    fi
    if [ $RESTARTS -gt 0 ]; then
        echo -e "Restart Count: ${YELLOW}$RESTARTS${NC}"
    else
        echo -e "Restart Count: ${GREEN}$RESTARTS${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Last 30 lines of logs:${NC}"
    kubectl logs $POD -n $NAMESPACE --tail=30
    
    # If there are restarts, show previous logs
    if [ $RESTARTS -gt 0 ]; then
        echo ""
        echo -e "${CYAN}Previous logs (before restart):${NC}"
        kubectl logs $POD -n $NAMESPACE --previous --tail=20 2>/dev/null
    fi
    
    echo ""
    echo -e "${GRAY}Press Enter to continue...${NC}"
    read
}

# Menu for detailed checks
echo -e "${BLUE}[7] Detailed Service Checks${NC}"
echo -e "${GRAY}-----------------------------------${NC}"
echo -e "${WHITE}   1) Backend${NC}"
echo -e "${WHITE}   2) Frontend${NC}"
echo -e "${WHITE}   3) Elasticsearch${NC}"
echo -e "${WHITE}   4) Kibana${NC}"
echo -e "${WHITE}   5) Redis${NC}"
echo -e "${WHITE}   6) Vault${NC}"
echo -e "${WHITE}   7) MinIO${NC}"
echo -e "${WHITE}   8) Fluent-bit${NC}"
echo -e "${YELLOW}   A) All services${NC}"
echo -e "${GRAY}   Q) Skip${NC}"
echo ""
read -p "Select service to check (1-8/A/Q): " choice

case ${choice^^} in
    1) check_service "backend" ;;
    2) check_service "frontend" ;;
    3) check_service "elasticsearch" ;;
    4) check_service "kibana" ;;
    5) check_service "redis" ;;
    6) check_service "vault" ;;
    7) check_service "minio" ;;
    8) check_service "fluent-bit" ;;
    A)
        check_service "backend"
        check_service "frontend"
        check_service "elasticsearch"
        check_service "kibana"
        check_service "redis"
        check_service "vault"
        check_service "minio"
        check_service "fluent-bit"
        ;;
    Q) echo -e "${GRAY}Skipped detailed checks${NC}" ;;
    *) echo -e "${RED}Invalid choice${NC}" ;;
esac

echo ""
echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  Troubleshooting Complete${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

echo -e "${YELLOW}Common Commands:${NC}"
echo -e "  View pod logs:      ${GRAY}kubectl logs -n $NAMESPACE <pod-name>${NC}"
echo -e "  View live logs:     ${GRAY}kubectl logs -f -n $NAMESPACE <pod-name>${NC}"
echo -e "  Describe pod:       ${GRAY}kubectl describe pod -n $NAMESPACE <pod-name>${NC}"
echo -e "  Get pod shell:      ${GRAY}kubectl exec -it -n $NAMESPACE <pod-name> -- sh${NC}"
echo -e "  Port forward:       ${GRAY}kubectl port-forward -n $NAMESPACE svc/<service> <port>:<port>${NC}"
echo -e "  Restart deployment: ${GRAY}kubectl rollout restart deployment/<name> -n $NAMESPACE${NC}"
echo ""
