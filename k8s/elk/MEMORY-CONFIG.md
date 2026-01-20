# Memory Configuration Guide

## Elasticsearch Memory Requirements

Exit code 137 = Out of Memory (OOM) - Elasticsearch ถูก kill เพราะใช้ memory เกินที่กำหนด

### Default Configuration (Recommended)
- **Memory Limit:** 1Gi
- **Memory Request:** 768Mi
- **Java Heap:** 512m
- **File:** elasticsearch-deployment.yaml

เหมาะสำหรับ:
- Development environment ปกติ
- เครื่องที่มี RAM >= 8GB

### Lightweight Configuration
- **Memory Limit:** 768Mi
- **Memory Request:** 512Mi
- **Java Heap:** 256m
- **File:** elasticsearch-deployment-lite.yaml

เหมาะสำหรับ:
- เครื่องที่มี RAM จำกัด (< 8GB)
- Development environment ที่ต้องการประหยัด resources
- ปิด features ที่ไม่จำเป็น (ML, monitoring, watcher)

⚠️ **หมายเหตุ:** Elasticsearch ต้องการ memory อย่างน้อย 768Mi เพื่อทำงานได้เสถียร

## วิธีเปลี่ยนไปใช้ Lightweight Version

```bash
# ลบ deployment เดิม
kubectl delete -f elk/elasticsearch-deployment.yaml

# Deploy lightweight version
kubectl apply -f elk/elasticsearch-deployment-lite.yaml

# ตรวจสอบ
kubectl get pods -n go-fullstack -l app=elasticsearch
kubectl logs -n go-fullstack -l app=elasticsearch
```

## วิธีเช็คว่าเครื่องมี memory พอ

### ใน Kubernetes:
```bash
# ดู available memory ของ nodes
kubectl describe nodes | grep -A 5 "Allocated resources"

# ดู memory usage
kubectl top nodes
kubectl top pods -n go-fullstack
```

### ใน Minikube:
```bash
# เช็ค memory ที่ตั้งไว้
minikube config get memory

# เพิ่ม memory ให้ minikube (ต้อง restart)
minikube stop
minikube start --memory=8192
```

## Resource Limits สำหรับ Services อื่น

### ปรับให้เหมาะกับเครื่อง

**Kibana:**
```yaml
resources:
  limits:
    memory: "1Gi"    # เดิม 768Mi
    cpu: "1000m"
  requests:
    memory: "512Mi"
    cpu: "200m"
```

**Backend:**
```yaml
resources:
  limits:
    memory: "256Mi"  # เพียงพอแล้ว
    cpu: "500m"
  requests:
    memory: "128Mi"
    cpu: "100m"
```

**Frontend:**
```yaml
resources:
  limits:
    memory: "128Mi"  # เพียงพอแล้ว
    cpu: "300m"
  requests:
    memory: "64Mi"
    cpu: "50m"
```

## Total Memory Requirements

### Standard Setup:
- Elasticsearch: 1Gi
- Kibana: 768Mi
- Redis: 128Mi
- MinIO: 256Mi
- Vault: 128Mi
- Backend: 256Mi
- Frontend: 128Mi
- Fluent-bit: 128Mi
- **Total: ~2.8Gi**

### Lightweight Setup:
- Elasticsearch: 768Mi
- Kibana: 512Mi (ใช้ node options ลด)
- Redis: 128Mi
- MinIO: 256Mi
- Vault: 128Mi
- Backend: 256Mi
- Frontend: 128Mi
- Fluent-bit: 128Mi
- **Total: ~2.3Gi**

### Minimal Setup (ถ้า RAM น้อยมาก):
ปิด ELK Stack:
```bash
# Skip ELK when deploying
kubectl apply -f namespace.yaml
kubectl apply -f redis/
kubectl apply -f minio/
kubectl apply -f vault/
# Skip elk/
kubectl apply -f backend/
kubectl apply -f frontend/
```
**Total: ~1Gi**

## Tips สำหรับลด Memory Usage

1. **ใช้ minikube ที่เล็กลง:**
   ```bash
   minikube start --memory=4096 --cpus=2
   ```

2. **Deploy เฉพาะที่จำเป็น:**
   - ข้าม ELK Stack ถ้าไม่ใช้
   - ข้าม MinIO ถ้าไม่ใช้ object storage

3. **ลด replicas:**
   ```bash
   kubectl scale deployment elasticsearch -n go-fullstack --replicas=0
   ```

4. **Restart pods ที่ใช้ memory มาก:**
   ```bash
   kubectl rollout restart deployment/elasticsearch -n go-fullstack
   ```

5. **Monitor memory usage:**
   ```bash
   watch kubectl top pods -n go-fullstack
   ```

## แก้ปัญหา OOM

หาก pod ยัง OOM อยู่:

1. **เพิ่ม memory limit:**
   ```yaml
   resources:
     limits:
       memory: "2Gi"  # เพิ่มเป็น 2Gi
   ```

2. **ลด Java heap size:**
   ```yaml
   env:
   - name: ES_JAVA_OPTS
     value: "-Xms128m -Xmx128m"  # ลดลง แต่อาจช้า
   ```

3. **เช็ค system limits:**
   ```bash
   kubectl describe node | grep -i memory
   ```

4. **ดู OOM events:**
   ```bash
   kubectl get events -n go-fullstack --sort-by='.lastTimestamp' | grep OOM
   ```
