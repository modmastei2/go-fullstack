# Kubernetes Deployment - Go Fullstack Application

> **🎯 ต้องการเริ่มต้นด่วน?** → อ่าน **[docs/START-HERE.md](docs/START-HERE.md)** (5 นาที)

Deploy Go Backend + React Frontend พร้อม Infrastructure Services บน Kubernetes with SSL/TLS Support

---

## 📋 Services

- **Backend** - Go Fiber API (Port 8080)
- **Frontend** - React + Nginx (Port 80)  
- **Ingress** - NGINX Ingress Controller with SSL/TLS
- **Redis** - Cache & Session Storage
- **MinIO** - Object Storage
- **Vault** - Secrets Management
- **Elasticsearch + Kibana** - Logging & Monitoring
- **Fluent-bit** - Log Collector

---

## 📖 Documentation

| ไฟล์ | จุดประสงค์ | เมื่อไหร่ใช้ |
|------|-----------|------------|
| **[docs/START-HERE.md](docs/START-HERE.md)** | 🚀 เริ่มต้นใช้งานด่วน 5 นาที | อ่านไฟล์นี้ก่อนเสมอ! |
| **[docs/DEPLOYMENT-CHECKLIST.md](docs/DEPLOYMENT-CHECKLIST.md)** | ✅ Checklist ครบถ้วนทุกขั้นตอน | Deploy production / ต้องการความละเอียด |
| **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | 🔧 แก้ปัญหาที่พบบ่อย | เมื่อติดปัญหา |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | 📊 Architecture diagrams | เมื่อต้องการเข้าใจโครงสร้าง |
| **README.md** (นี่) | 📚 คู่มือละเอียดทั้งหมด | Reference ทั่วไป |

---

## 🚀 Quick Start (Summary)

### 1. Prerequisites

- Kubernetes cluster (Docker Desktop / Minikube / K3s)
- kubectl configured
- Docker (สำหรับ build images)
- NGINX Ingress Controller installed
- SSL certificates (available in `../certs/`)

### 2. Install NGINX Ingress Controller (if not installed)

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

### 3. Build & Deploy

```powershell
# Build images
.\build-and-load.ps1

# Deploy everything
.\apply-all.ps1

# Configure hosts file (C:\Windows\System32\drivers\etc\hosts)
127.0.0.1 go-fullstack.local

# Port forward ingress
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443

# Access
# https://go-fullstack.local/
```

### 4. Check Status

```bash
kubectl get pods -n go-fullstack
```

ผลลัพธ์ที่ถูกต้อง:
```
NAME                             READY   STATUS      RESTARTS   AGE
backend-xxx                      1/1     Running     0          2m
frontend-xxx                     1/1     Running     0          2m
elasticsearch-xxx                1/1     Running     0          3m
kibana-xxx                       1/1     Running     0          3m
redis-xxx                        1/1     Running     0          3m
vault-xxx                        1/1     Running     0          3m
minio-xxx                        1/1     Running     0          3m
fluent-bit-xxx                   1/1     Running     0          2m
```

### 5. Setup SSL/TLS Access

#### Configure Hosts File:
Add to your hosts file:
- **Windows:** `C:\Windows\System32\drivers\etc\hosts`
- **Linux/Mac:** `/etc/hosts`

```
127.0.0.1 go-fullstack.local
```

#### Port Forward Ingress Controller:
```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443
```

#### Access via HTTPS:
```
https://go-fullstack.local/
```

**Note:** Accept the self-signed certificate warning for development.

📖 **For complete SSL setup instructions, see [SSL-SETUP.md](SSL-SETUP.md)**

### 6. Access Services (Alternative: Direct Port Forwarding)

#### Option 1: Foreground (รัน terminal แยก)

```bash
# Terminal 1 - Frontend via Ingress (HTTPS)
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443

# Terminal 2 - Backend (Direct)
kubectl port-forward -n go-fullstack svc/backend 8080:8080

# Terminal 3 - Kibana
kubectl port-forward -n go-fullstack svc/kibana 5601:5601

# Terminal 4 - MinIO
kubectl port-forward -n go-fullstack svc/minio 9000:9000 9001:9001

# Terminal 5 - Vault
kubectl port-forward -n go-fullstack svc/vault 8200:8200

# Terminal 6 - Elasticsearch (optional)
kubectl port-forward -n go-fullstack svc/elasticsearch 9200:9200
```

> **หมายเหตุ:** Ctrl+C จะหยุด port-forward แต่ไม่กระทบ pods

#### Option 2: Background (PowerShell)

```powershell
# เปิดทุก service แบบ background
Start-Job -Name backend { kubectl port-forward -n go-fullstack svc/backend 8080:8080 }
Start-Job -Name frontend { kubectl port-forward -n go-fullstack svc/frontend 3000:80 }
Start-Job -Name kibana { kubectl port-forward -n go-fullstack svc/kibana 5601:5601 }
Start-Job -Name minio { kubectl port-forward -n go-fullstack svc/minio 9000:9000 9001:9001 }
Start-Job -Name vault { kubectl port-forward -n go-fullstack svc/vault 8200:8200 }
Start-Job -Name elasticsearch { kubectl port-forward -n go-fullstack svc/elasticsearch 9200:9200 }
Start-Job -Name redis { kubectl port-forward -n go-fullstack svc/redis 6379:6379 }

# ตรวจสอบสถานะ
Get-Job

# ดู logs ของ job
Receive-Job -Name backend -Keep

# ปิดเมื่อเลิกใช้
Get-Job | Stop-Job
Get-Job | Remove-Job
```

#### Option 3: Background (Bash/Linux/Mac)

```bash
# เปิดทุก service แบบ background
kubectl port-forward -n go-fullstack svc/backend 8080:8080 &
kubectl port-forward -n go-fullstack svc/frontend 3000:80 &
kubectl port-forward -n go-fullstack svc/kibana 5601:5601 &
kubectl port-forward -n go-fullstack svc/minio 9000:9000 9001:9001 &
kubectl port-forward -n go-fullstack svc/vault 8200:8200 &
kubectl port-forward -n go-fullstack svc/elasticsearch 9200:9200 &

# ดู background jobs
jobs

# ปิดทั้งหมด
killall kubectl
# หรือ
pkill -f "kubectl port-forward"
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1/health
- Swagger Docs: http://localhost:8080/swagger/index.html
- Kibana (Logs): http://localhost:5601
- MinIO Console: http://localhost:9001 (admin/minioadmin)
- MinIO API: http://localhost:9000
- Vault UI: http://localhost:8200 (token: toor)
- Elasticsearch: http://localhost:9200

---

## 📁 Project Structure

```
k8s/
├── README.md                   # คู่มือหลัก
├── manifests/                 # Core Kubernetes manifests
│   ├── namespace.yaml
│   ├── ingress.yaml
│   ├── network-policy.yaml
│   └── tls-secret.yaml
├── scripts/                  # Automation scripts
│   ├── apply-all.ps1/sh      # Deploy all services
│   ├── build-and-load.ps1/sh # Build and load images
│   ├── delete-all.ps1/sh     # Delete all resources
│   └── troubleshoot.ps1/sh   # Diagnostic tool
├── docs/                     # Documentation
│   ├── START-HERE.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT-CHECKLIST.md
│   ├── SECURITY.md
│   └── TROUBLESHOOTING.md
├── redis/                    # Redis manifests
├── minio/                    # MinIO manifests
├── vault/                    # Vault + init job
├── elk/                      # Elasticsearch, Kibana, Fluent-bit
│   └── MEMORY-CONFIG.md      # Memory optimization guide
├── backend/                  # Backend deployment
└── frontend/                 # Frontend deployment
```

---

## ⚙️ Configuration

### Resource Limits

Default settings:
- Backend: 512Mi memory, 500m CPU
- Frontend: 128Mi memory, 200m CPU
- Elasticsearch: 1Gi memory (512Mi heap)
- Kibana: 768Mi memory
- Redis: 128Mi memory
- MinIO: 256Mi memory
- Vault: 128Mi memory

ปรับได้ที่ `<service>/deployment.yaml`

### Secrets

Secrets ใช้ base64 encoding:
- Vault token: `toor` (dev mode)
- MinIO: `minioadmin` / `minioadmin`
- Redis: no password

**Production:** ใช้ Sealed Secrets หรือ External Secrets Operator

### Vault Secrets

Backend ดึง secrets จาก Vault path `fiber-app/`:
- `jwt_secret` - JWT signing key
- `db_password` - Database password
- `redis_password` - Redis password (ถ้ามี)
- `minio_root_user` - MinIO access key
- `minio_root_password` - MinIO secret key

Secrets ถูกสร้างโดย `vault/vault-init-job.yaml`

---

## 🔧 Common Tasks

### View Logs

```bash
# All services
kubectl logs -f -n go-fullstack -l app=backend

# Specific pod
kubectl logs -f -n go-fullstack <pod-name>

# Previous container (after crash)
kubectl logs -n go-fullstack <pod-name> --previous
```

### Restart Service

```bash
kubectl rollout restart deployment/backend -n go-fullstack
```

### Update Image

```bash
# Build new image
.\build-and-load.ps1

# Restart deployment
kubectl rollout restart deployment/backend -n go-fullstack

# Watch rollout
kubectl rollout status deployment/backend -n go-fullstack
```

### Scale Service

```bash
kubectl scale deployment/backend -n go-fullstack --replicas=3
```

### Shell Access

```bash
kubectl exec -it -n go-fullstack deployment/backend -- sh
```

### Delete Everything

```bash
# PowerShell
.\delete-all.ps1

# Bash
./delete-all.sh
```

**คำเตือน:** จะลบทั้ง namespace และ PVCs (data จะหาย!)

---

## 🐛 Troubleshooting

### Quick Diagnostics

รัน troubleshoot script เพื่อดูข้อมูล debug ครบถ้วน:

```bash
# PowerShell
.\troubleshoot.ps1

# Bash
./troubleshoot.sh
```

Script จะแสดง:
- ✅ Cluster และ namespace info
- ✅ สถานะ pods ทั้งหมด
- ✅ Events ล่าสุด
- ✅ Logs จาก pods ที่มีปัญหา
- ✅ Resource usage
- ✅ Common issues check
- ✅ Quick action commands

### Pods ไม่ Running

```bash
# ดู events
kubectl describe pod -n go-fullstack <pod-name>

# ดู logs
kubectl logs -n go-fullstack <pod-name>

# ดูทุก events
kubectl get events -n go-fullstack --sort-by='.lastTimestamp'
```

### ImagePullBackOff

**สาเหตุ:** Local images ไม่ถูก load เข้า cluster

**แก้ไข:**
```bash
.\build-and-load.ps1
```

Script รองรับ:
- Docker Desktop Kubernetes (docker save/load)
- Minikube (minikube image load)
- K3s (k3s ctr images import)

### Backend Restart Loop

**ตรวจสอบ:**

1. **Health check path ถูกต้องหรือไม่**
   ```bash
   kubectl logs -n go-fullstack -l app=backend | grep health
   ```
   Path ต้องเป็น `/api/v1/health` ไม่ใช่ `/health`

2. **Vault secrets ครบหรือไม่**
   ```bash
   kubectl logs -n go-fullstack -l job-name=vault-init
   ```

3. **Memory เพียงพอหรือไม่**
   ```bash
   kubectl top pod -n go-fullstack
   ```
   ถ้า memory ใกล้เต็ม ให้เพิ่มใน `backend/deployment.yaml`

### Elasticsearch OOM (Exit 137)

**สาเหตุ:** Memory ไม่พอ

**แก้ไข Option 1 - เพิ่ม memory:**
```yaml
# elk/elasticsearch-deployment.yaml
resources:
  limits:
    memory: "2Gi"  # เพิ่มจาก 1Gi
  requests:
    memory: "1Gi"
```

**แก้ไข Option 2 - ใช้ lite version:**
```bash
kubectl apply -f elk/elasticsearch-deployment-lite.yaml
```

ดูรายละเอียดใน `elk/MEMORY-CONFIG.md`

### Service เชื่อมต่อกันไม่ได้

**ทดสอบ DNS:**
```bash
kubectl run -it --rm debug --image=busybox --restart=Never -n go-fullstack -- nslookup redis
```

**ทดสอบ HTTP:**
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n go-fullstack -- curl http://backend:8080/api/v1/health
```

### PVC ไม่ Bind

```bash
# ดู PVC status
kubectl get pvc -n go-fullstack

# ตรวจสอบ StorageClass
kubectl get storageclass

# ดู PV
kubectl get pv
```

**แก้ไข:** ตรวจสอบว่า cluster มี StorageClass default หรือกำหนดใน PVC

---

## �️ Alternative: Using Lens IDE (Recommended for Beginners)

**Lens** เป็น Kubernetes IDE ที่ทำให้การจัดการ K8s ง่ายขึ้นด้วย GUI

### ติดตั้ง Lens

**Download:** https://k8slens.dev/ (ฟรี)

```bash
# Windows (Chocolatey)
choco install lens

# macOS (Homebrew)
brew install --cask lens

# หรือ Download installer จาก website
```

### เชื่อมต่อกับ Cluster

1. เปิด Lens
2. Lens จะ detect cluster จาก `~/.kube/config` อัตโนมัติ
3. เลือก cluster (Docker Desktop / Minikube / K3s)
4. เข้าสู่ cluster

### เลือก Namespace: go-fullstack

**วิธีที่ 1: ใช้ Dropdown (ด้านบนซ้าย)**
1. ดูที่มุมบนซ้ายของหน้าจอ จะเห็น dropdown แสดง namespace ปัจจุบัน (เช่น `default`)
2. คลิกที่ dropdown นั้น
3. เลือก **go-fullstack** จากรายการ
4. ทุก view (Pods, Services, etc.) จะแสดงเฉพาะ resources ใน namespace นี้

**วิธีที่ 2: ใช้ Search Bar**
1. กด `Ctrl+K` (Windows/Linux) หรือ `Cmd+K` (Mac)
2. พิมพ์ `go-fullstack`
3. เลือก namespace จากผลลัพธ์

**วิธีที่ 3: ตั้งค่า Default Namespace**
1. ไปที่ **File → Preferences → Kubernetes**
2. ตั้ง default namespace เป็น `go-fullstack`
3. ทุกครั้งที่เปิด Lens จะเข้า namespace นี้อัตโนมัติ

> 💡 **Tip:** Lens จำ namespace ที่เลือกไว้ เมื่อเปิดครั้งต่อไปจะเข้า namespace เดิม

### ใช้งาน go-fullstack ผ่าน Lens

#### 1. ดู Pods Status (แทน `kubectl get pods`)

- ไปที่ **Workloads → Pods**
- เลือก namespace: **go-fullstack**
- เห็น pods ทั้งหมดพร้อม status สี (🟢 Running, 🔴 Failed)
- คลิกดู details, metrics, events ได้ทันที

#### 2. ดู Logs (แทน `kubectl logs -f`)

- คลิกที่ pod → **Logs** tab
- ✅ Auto-refresh (live logs)
- ✅ Search/Filter logs
- ✅ ดูหลาย container ใน pod เดียว
- ✅ Download logs

**Example:** ดู backend logs
- คลิก `backend-xxx` pod
- เลือก tab **Logs**
- เห็น logs real-time ไหลมา

#### 3. Port Forwarding (แทน `kubectl port-forward`)

- คลิกที่ pod → **Forward** button
- เลือก port ที่ต้องการ
- Lens จะเปิด port-forward อัตโนมัติ
- แสดง URL ที่เข้าได้เลย (เช่น http://localhost:8080)

**Example:** เปิด Backend API
1. คลิก `backend-xxx` pod
2. คลิก **Forward** → Port **8080**
3. เปิด browser: http://localhost:8080/api/v1/health

**Example:** เปิด Frontend
1. คลิก `frontend-xxx` pod
2. คลิก **Forward** → Port **80** → Local port **3000**
3. เปิด browser: http://localhost:3000

#### 4. Shell Access (แทน `kubectl exec -it`)

- คลิกที่ pod → **Pod Shell** icon
- เข้า terminal ของ pod ได้ทันที
- รัน command ปกติได้เลย

**Example:** Debug Backend
```bash
# ใน Lens shell
cd /app
ls -la
wget -q -O- http://localhost:8080/api/v1/health
```

#### 5. Resource Monitoring

- เห็น **CPU/Memory graphs** real-time
- ไปที่ pod → **Metrics** tab
- ดูว่า service ไหนใช้ resource เยอะ

#### 6. Edit YAML

- คลิกที่ resource (Deployment/Service/ConfigMap)
- คลิก **Edit** button
- แก้ไข YAML ได้ทันที
- Lens validate syntax ให้อัตโนมัติ
- Save → Apply ได้เลย

#### 7. ดู Events (แทน `kubectl get events`)

- ไปที่ cluster → **Events**
- เห็น events ทั้งหมดเรียงตามเวลา
- Filter ตาม namespace/pod ได้

### Lens vs kubectl Commands

| Task | kubectl Command | Lens |
|------|-----------------|------|
| ดู pods | `kubectl get pods -n go-fullstack` | Workloads → Pods (GUI) |
| ดู logs | `kubectl logs -f pod-name` | คลิก pod → Logs tab |
| Port forward | `kubectl port-forward svc/backend 8080:8080` | คลิก pod → Forward button |
| Shell access | `kubectl exec -it pod-name -- sh` | คลิก pod → Shell icon |
| Resource usage | `kubectl top pods` | Pod → Metrics tab |
| Edit resource | `kubectl edit deployment/backend` | คลิก → Edit button |
| Restart pod | `kubectl rollout restart deployment/backend` | คลิก deployment → คลิกขวา → Restart |

### ข้อดีของ Lens

✅ **ไม่ต้องจำคำสั่ง** - ทุกอย่างเป็น GUI  
✅ **Real-time monitoring** - เห็น metrics แบบ live  
✅ **Multi-window** - เปิดดูหลาย pods พร้อมกัน  
✅ **Log management** - Search, filter, download logs ง่าย  
✅ **Port forward ง่าย** - คลิกเดียวเสร็จ ไม่ต้อง keep terminal  
✅ **Visual debugging** - เห็นความสัมพันธ์ของ resources  
✅ **Extensions** - ติดตั้ง plugins เพิ่มได้

### เมื่อไหร่ควรใช้ Lens

✅ **Beginners** - ใหม่กับ K8s ยังไม่คุ้นกับ kubectl  
✅ **Visual learners** - ชอบเห็นภาพมากกว่า command line  
✅ **Debugging** - ต้องดู logs หลาย pods พร้อมกัน  
✅ **Port forwarding** - ต้องเปิด ports หลายตัว  
✅ **Multi-cluster** - จัดการหลาย clusters  

### เมื่อไหร่ควรใช้ kubectl/scripts

✅ **Automation** - CI/CD, scripts  
✅ **Remote servers** - SSH เข้า server ที่ไม่มี GUI  
✅ **Quick tasks** - งานเร็วๆ ที่คุ้นเคยกับ command  
✅ **Scripting** - ต้องเขียน script automation  

---

## �💡 Best Practices

### Development

1. **ใช้ port-forward แทน LoadBalancer/Ingress**
   ```bash
   kubectl port-forward -n go-fullstack svc/backend 8080:8080
   ```

2. **ดู logs realtime ขณะ develop**
   ```bash
   kubectl logs -f -n go-fullstack -l app=backend
   ```

3. **Hot reload code**
   ```bash
   .\build-and-load.ps1
   kubectl rollout restart deployment/backend -n go-fullstack
   ```

### Production

1. **ใช้ Helm Charts แทน plain YAML**
2. **Setup Ingress Controller**
3. **Enable Horizontal Pod Autoscaler**
4. **Configure Resource Quotas**
5. **Use External Secrets Operator**
6. **Setup Monitoring (Prometheus/Grafana)**
7. **Enable Pod Disruption Budgets**
8. **Use Network Policies**

---

## 📝 Notes

- Health check endpoint: `/api/v1/health` (ไม่ใช่ `/health`)
- Vault รัน dev mode (ไม่ควรใช้ production)
- Redis ไม่มี password (ควรเพิ่มใน production)
- PVCs ใช้ default StorageClass
- Elasticsearch ใช้ single node (production ควรเป็น cluster)

---

## 🔗 Useful Commands

```bash
# ดูทุกอย่าง
kubectl get all -n go-fullstack

# Resource usage
kubectl top pods -n go-fullstack
kubectl top nodes
Watch pods
kubectl get pods -n go-fullstack -w

# Restart all
kubectl rollout restart deployment -n go-fullstack

# Run diagnostics
.\troubleshoot.ps1  # PowerShell
./troubleshoot.sh   # Bash
```

### Port Forward Commands

#### Ingress Controller (SSL/TLS Access)

```powershell
# PowerShell - Foreground (ง่ายที่สุด)
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443
# Access: https://127.0.0.1:8443/

# PowerShell - Background
Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 }

# Bash/Linux/Mac - Background
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 &
```

#### Application Services

```bash
# PowerShell - Background mode (ทุก service)
Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 }
Start-Job -Name frontend { kubectl port-forward -n go-fullstack svc/frontend 3000:80 }
Start-Job -Name kibana { kubectl port-forward -n go-fullstack svc/kibana 5601:5601 }
Start-Job -Name minio { kubectl port-forward -n go-fullstack svc/minio 9000:9000 9001:9001 }
Start-Job -Name vault { kubectl port-forward -n go-fullstack svc/vault 8200:8200 }
Start-Job -Name elasticsearch { kubectl port-forward -n go-fullstack svc/elasticsearch 9200:9200 }

# Bash - Background mode (ทุก service)
kubectl port-forward -n go-fullstack svc/backend 8080:8080 &
kubectl port-forward -n go-fullstack svc/frontend 3000:80 &
kubectl port-forward -n go-fullstack svc/kibana 5601:5601 &
kubectl port-forward -n go-fullstack svc/minio 9000:9000 9001:9001 &
kubectl port-forward -n go-fullstack svc/vault 8200:8200 &
kubectl port-forward -n go-fullstack svc/elasticsearch 9200:9200 &

# Stop all port-forwards
# PowerShell
Get-Job | Stop-Job
Get-Job | Remove-Job

# หรือเฉพาะ ingress
Stop-Job -Name ingress
Remove-Job -Name ingress

# Bash
killall kubectl
# หรือ
pkill -f "kubectl port-forward"
```

---

## 🆘 Need Help?

**Common Issues:**

| Issue | Solution | Command |
|-------|----------|---------|
| ไม่รู้จะเริ่มจากไหน | รัน troubleshoot script | `.\scripts\troubleshoot.ps1` |
| ImagePullBackOff | Build และ load images | `.\build-and-load.ps1` |
| Backend restart loop | Check health path, vault secrets, memory | `.\troubleshoot.ps1` |
| Elasticsearch OOM | Use lite version or increase memory | See `elk/MEMORY-CONFIG.md` |
| Port-forward fails | Check if port already in use | `netstat -ano \| findstr :8080` |
| PVC pending | Verify StorageClass exists | `kubectl get storageclass` |

**Debug Steps:**
1. `.\troubleshoot.ps1` - รัน diagnostic script (แนะนำ!)
2. `kubectl get pods -n go-fullstack` - Check pod status
3. `kubectl describe pod -n go-fullstack <pod-name>` - See events
4. `kubectl logs -n go-fullstack <pod-name>` - Read logs
5. `kubectl get events -n go-fullstack` - Check recent events

---

**Version:** 1.0  
**Last Updated:** January 2026

## 🆘 Need Help?

**Common Issues:**

| Issue | Solution |
|-------|----------|
| ImagePullBackOff | `.\build-and-load.ps1` |
| Backend restart loop | Check health path, vault secrets, memory |
| Elasticsearch OOM | Use lite version or increase memory |
| Port-forward fails | Check if port already in use |
| PVC pending | Verify StorageClass exists |

**Debug Steps:**
1. `kubectl get pods -n go-fullstack` - Check pod status
2. `kubectl describe pod -n go-fullstack <pod-name>` - See events
3. `kubectl logs -n go-fullstack <pod-name>` - Read logs
4. `kubectl get events -n go-fullstack` - Check recent events

---

**Version:** 1.0  
**Last Updated:** January 2026
