# 🔧 Troubleshooting Guide

## ปัญหาที่พบบ่อย

### 1. ❌ ไม่สามารถเข้า https://go-fullstack.local/

#### เช็ค 1: Hosts file ถูกต้องหรือไม่?
```powershell
# Windows: เปิดไฟล์นี้ด้วย Notepad (Run as Admin)
C:\Windows\System32\drivers\etc\hosts

# ต้องมีบรรทัดนี้:
127.0.0.1 go-fullstack.local
```

#### เช็ค 2: Port forward ทำงานอยู่หรือไม่?
```powershell
# ดูว่า terminal ยังเปิดอยู่และรันคำสั่งนี้อยู่หรือไม่:
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443

# ถ้าไม่มี ให้รันใหม่
```

#### เช็ค 3: Ingress Controller ทำงานหรือไม่?
```powershell
kubectl get pods -n ingress-nginx

# ต้อง Running ทั้งหมด
# ถ้าไม่มี namespace นี้ แสดงว่ายังไม่ได้ติดตั้ง
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

---

### 2. ❌ Certificate Warning (NET::ERR_CERT_AUTHORITY_INVALID)

**สาเหตุ**: ใช้ self-signed certificate (ปกติสำหรับ development)

**วิธีแก้**:
1. คลิก "Advanced"
2. คลิก "Proceed to go-fullstack.local (unsafe)"
3. **หรือ** ignore ด้วย command:
   ```powershell
   curl -k https://go-fullstack.local/
   ```

**สำหรับ Production**: ใช้ certificate จาก CA (Let's Encrypt, etc.)

---

### 3. ❌ Backend API ไม่ทำงาน (404 Not Found)

#### สาเหตุที่ 1: Frontend/Backend pods ยังไม่ ready

```powershell
# เช็ค pods status
kubectl get pods -n go-fullstack

# ถ้าเห็น status: ContainerCreating, Pending, CrashLoopBackOff
# ให้รอหรือเช็ค logs
kubectl describe pod <pod-name> -n go-fullstack
```

#### สาเหตุที่ 2: Service ไม่มี endpoints

```powershell
# เช็ค endpoints
kubectl get endpoints -n go-fullstack

# ถ้า frontend หรือ backend endpoints = <none>
# แสดงว่า pods ไม่ ready หรือ selector ไม่ตรง
kubectl describe svc frontend -n go-fullstack
kubectl describe svc backend -n go-fullstack
```

#### สาเหตุที่ 3: Ingress routing ผิด

```powershell
# เช็ค ingress
kubectl describe ingress go-fullstack-ingress -n go-fullstack

# ดู backend configuration
kubectl get ingress go-fullstack-ingress -n go-fullstack -o yaml
```

**วิธีแก้:**

```powershell
# 1. เช็คว่า pods running หมดหรือยัง (รอ 2-3 นาที)
kubectl get pods -n go-fullstack -w

# 2. ถ้ายังไม่ได้ deploy ให้รัน
cd k8s
.\apply-all.ps1

# 3. ทดสอบ frontend โดยตรง (bypass ingress)
kubectl port-forward -n go-fullstack svc/frontend 8080:80
# เปิด browser: http://localhost:8080

# 4. ทดสอบ backend โดยตรง
kubectl port-forward -n go-fullstack svc/backend 8081:8080
# เปิด browser: http://localhost:8081/health
```

#### เช็ค Ingress Controller Logs
```powershell
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100

# มองหา errors เกี่ยวกับ:
# - upstream not found
# - no endpoints available
# - SSL/TLS errors
```

---

### 4. ❌ Frontend โหลดไม่ขึ้น (Blank Page)
```powershell
kubectl get pods -n go-fullstack | findstr backend

# ถ้า CrashLoopBackOff หรือ Error:
kubectl logs -n go-fullstack -l app=backend --tail=50
```

#### เช็ค 2: Service มี endpoints หรือไม่?
```powershell
kubectl get endpoints backend -n go-fullstack

# ต้องมี IP address (ถ้าเป็น <none> แสดงว่า pod ไม่ ready)
```

#### เช็ค 3: ทดสอบ backend โดยตรง
```powershell
kubectl port-forward -n go-fullstack svc/backend 8080:8080

# Terminal อื่น:
curl http://localhost:8080/health
```

---

### 4. ❌ Frontend โหลดไม่ขึ้น (Blank Page)

#### เช็ค 1: Frontend pod logs
```powershell
kubectl logs -n go-fullstack -l app=frontend --tail=50
```

#### เช็ค 2: Browser console (F12)
- ดู errors ใน Console tab
- ดู network requests ที่ fail

#### เช็ค 3: Nginx configuration
```powershell
kubectl describe configmap frontend-nginx-config -n go-fullstack
```

---

### 5. ❌ TLS Secret ไม่มี

```powershell
# สร้างใหม่
kubectl create secret tls go-fullstack-tls \
  --cert=../certs/dev.cert.pem \
  --key=../certs/dev.cert.key \
  -n go-fullstack

# ตรวจสอบ
kubectl get secret go-fullstack-tls -n go-fullstack
```

---

### 6. ❌ Port 443 Access Denied (bind: An attempt was made to access a socket...)

**สาเหตุหลัก**:
1. Port 443 ต้องใช้ admin privileges
2. **IIS (Internet Information Services) ใช้ port 443 อยู่แล้ว** (พบบ่อยบน Windows)
3. โปรแกรมอื่นใช้ port 443 อยู่

**เช็คว่าใครใช้ port 443:**
```powershell
netstat -ano | findstr :443
```

**วิธีแก้ที่ 1: ใช้ port 8443 แทน (แนะนำ - ไม่ต้องปิด IIS)**
```powershell
# ใช้ port 8443 แทน 443
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443

# เข้าใช้งานด้วย:
# https://127.0.0.1:8443/
```

**วิธีแก้ที่ 2: ปิด IIS ชั่วคราว (ถ้าไม่ใช้งาน)**
```powershell
# Run as Administrator
iisreset /stop

# แล้วค่อย port forward
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443

# เข้าใช้งาน: https://127.0.0.1/

# เมื่อเสร็จแล้วเปิด IIS คืน:
iisreset /start
```

**วิธีแก้ที่ 3: หยุด process ที่ใช้ port 443**
```powershell
# หา PID
netstat -ano | findstr :443

# Stop process (ระวัง! อาจเป็น system service)
Stop-Process -Id <PID> -Force
```

### 7. ❌ Namespace "ingress-nginx" not found

**สาเหตุ**: ยังไม่ได้ติดตั้ง NGINX Ingress Controller

**วิธีแก้**:
```powershell
# ติดตั้ง NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# รอให้พร้อม
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=120s

# ตรวจสอบ
kubectl get pods -n ingress-nginx

# ถ้าพร้อมแล้ว ลอง port forward ใหม่
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443
```

### 8. ❌ Ingress ไม่มี Address

```powershell
kubectl get ingress -n go-fullstack

# ถ้า ADDRESS column ว่าง:
# 1. เช็คว่า ingress controller ทำงาน
kubectl get pods -n ingress-nginx

# 2. เช็ค ingress class
kubectl get ingressclass

# 3. ดู ingress events
kubectl describe ingress go-fullstack-ingress -n go-fullstack
```

---

### 9. ❌ CORS Errors

**Symptoms**: Browser console แสดง "CORS policy" error

**วิธีแก้**:
```powershell
# เช็ค ingress annotations
kubectl get ingress go-fullstack-ingress -n go-fullstack -o yaml

# ต้องมี:
# nginx.ingress.kubernetes.io/enable-cors: "true"
# nginx.ingress.kubernetes.io/cors-allow-origin: "https://go-fullstack.local"
```

---

### 10. ❌ Request Timeout

**Symptoms**: Request ใช้เวลานาน แล้ว timeout

**วิธีแก้**:
```powershell
# Timeout ถูกตั้งไว้ที่ 600 วินาที แล้ว
# เช็คว่า backend ทำงานหรือไม่
kubectl logs -n go-fullstack -l app=backend --tail=50

# เช็ค resource usage
kubectl top pods -n go-fullstack
```

---

### 11. ❌ File Upload ใหญ่เกินไม่ได้ (413 Payload Too Large)

**วิธีแก้**: ปรับ body size ใน ingress (ตั้งไว้ 100MB แล้ว)

```powershell
# เช็คว่ามี annotation นี้หรือไม่
kubectl get ingress go-fullstack-ingress -n go-fullstack -o yaml | findstr "body-size"

# ต้องเห็น:
# nginx.ingress.kubernetes.io/proxy-body-size: "100m"
```

---
### 12. ❌ Browser เด้งให้ใส่ Username/Password (Windows Security)

**อาการ**: เห็น dialog "Sign in to access this site" พร้อม Domain: BCONNEX หรือชื่อ domain อื่น

**สาเหตุ**: Browser พยายามใช้ Windows Integrated Authentication (NTLM/Kerberos) กับเว็บไซต์

**วิธีแก้ที่ 1: ใช้ IP แทน hostname (ง่ายที่สุด)**
```
# แทนที่จะใช้:
https://go-fullstack.local/

# ให้ใช้:
https://127.0.0.1/

# หรือ (ถ้าใช้ port 8443):
https://127.0.0.1:8443/
```

**วิธีแก้ที่ 2: ใช้ Incognito/InPrivate Mode**
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Edge/IE)
```

**วิธีแก้ที่ 3: เพิ่มใน hosts เป็น 127.0.0.1 และ disable Windows Auth**

Chrome/Edge Settings:
```
chrome://settings/security
# ค้นหา "Automatically sign in to sites" 
# ปิดการใช้งาน
```

**วิธีแก้ที่ 4: ใช้ Firefox แทน**
```
# Firefox ไม่ใช้ Windows Integrated Authentication โดยค่าเริ่มต้น
```

**วิธีแก้ที่ 5: เช็คว่า Ingress มี Basic Auth หรือไม่**
```powershell
# เช็ค ingress annotations
kubectl get ingress go-fullstack-ingress -n go-fullstack -o yaml | findstr "auth"

# ถ้าเจอ nginx.ingress.kubernetes.io/auth-type: basic
# แสดงว่ามี basic auth เปิดอยู่
```

**วิธีแก้**: ลบ basic auth annotations
```powershell
# แก้ไข ingress.yaml ลบบรรทัดนี้ออก (ถ้ามี):
# nginx.ingress.kubernetes.io/auth-type: basic
# nginx.ingress.kubernetes.io/auth-secret: ...
# nginx.ingress.kubernetes.io/auth-realm: ...

# Apply ใหม่
kubectl apply -f ingress.yaml
```

#### 2. Backend ต้องการ authentication
```powershell
# ทดสอบ backend โดยตรง
kubectl port-forward -n go-fullstack svc/backend 8080:8080

# Terminal อื่น:
curl http://localhost:8080/health

# ถ้าได้ผลลัพธ์ปกติ แสดงว่า backend ไม่มี auth
# ถ้ามี 401 Unauthorized แสดงว่า backend ต้องการ auth
```

#### 3. เช็คว่าเป็นหน้าไหน
```powershell
# ใช้ curl ดูว่าได้ response อะไร
curl -kv https://go-fullstack.local/ 2>&1 | findstr "401\|403\|WWW-Authenticate"

# ถ้าเห็น "WWW-Authenticate: Basic" แสดงว่ามี basic auth
# ถ้าเห็น 401 หรือ 403 แสดงว่า backend ต้องการ authentication
```

#### 4. ลองเข้าผ่าน frontend โดยตรง
```powershell
# Port forward ตรงไป frontend (bypass ingress)
kubectl port-forward -n go-fullstack svc/frontend 8080:80

# เปิด browser: http://localhost:8080
# ถ้าเข้าได้ แสดงว่าปัญหาอยู่ที่ ingress
# ถ้ายังเด้งให้ใส่รหัส แสดงว่าปัญหาอยู่ที่ frontend/backend
```

**วิธีแก้ชั่วคราว**: Skip authentication
```powershell
# ถ้า backend ต้องการ token หรือ auth
# ตรวจสอบ backend configuration
kubectl get configmap -n go-fullstack
kubectl describe configmap backend-config -n go-fullstack

# ดู environment variables
kubectl describe deployment backend -n go-fullstack | findstr "Environment"
```

---
## 🔍 คำสั่งวินิจฉัยปัญหา

### ดู Logs ทั้งหมด
```powershell
# Backend
kubectl logs -n go-fullstack -l app=backend --tail=100

# Frontend
kubectl logs -n go-fullstack -l app=frontend --tail=100

# Ingress Controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100
```

### ดูสถานะ Resources
```powershell
# Pods
kubectl get pods -n go-fullstack

# Services
kubectl get svc -n go-fullstack

# Ingress
kubectl get ingress -n go-fullstack

# Secrets
kubectl get secrets -n go-fullstack

# Endpoints
kubectl get endpoints -n go-fullstack
```

### ดูรายละเอียด
```powershell
# Pod details
kubectl describe pod <pod-name> -n go-fullstack

# Ingress details
kubectl describe ingress go-fullstack-ingress -n go-fullstack

# Service details
kubectl describe svc backend -n go-fullstack
```

### ทดสอบ Network
```powershell
# เข้าไปใน pod แล้วทดสอบ
kubectl exec -it <backend-pod> -n go-fullstack -- sh

# ใน pod:
curl http://localhost:8080/health
```

---

## 🔄 การแก้ปัญหาแบบ Reset

### รัน Deploy ใหม่
```powershell
# ลบทิ้ง
.\delete-all.ps1

# Deploy ใหม่
.\apply-all.ps1
```

### ลบแล้วสร้าง TLS Secret ใหม่
```powershell
kubectl delete secret go-fullstack-tls -n go-fullstack

kubectl create secret tls go-fullstack-tls \
  --cert=../certs/dev.cert.pem \
  --key=../certs/dev.cert.key \
  -n go-fullstack
```

### Restart Specific Pod
```powershell
# Backend
kubectl rollout restart deployment backend -n go-fullstack

# Frontend
kubectl rollout restart deployment frontend -n go-fullstack
```

---

## 📞 ติดปัญหาที่แก้ไม่ได้?

1. Run troubleshoot script:
   ```powershell
   .\troubleshoot.ps1
   ```

2. Collect logs:
   ```powershell
   kubectl logs -n go-fullstack --all-containers --tail=100 > debug-logs.txt
   kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100 >> debug-logs.txt
   ```

3. เช็ค events:
   ```powershell
   kubectl get events -n go-fullstack --sort-by='.lastTimestamp'
   ```

4. ดู cluster info:
   ```powershell
   kubectl cluster-info
   kubectl get nodes
   kubectl version
   ```

---

## 🔍 Common Issues (ปัญหาที่พบบ่อย)

### 13. ❌ เข้า https://127.0.0.1:8443/ ได้ 404 Not Found แต่ http://localhost:8080 (port-forward ตรง) เข้าได้

**สาเหตุ**: Ingress ถูก config ให้รับเฉพาะ `host: go-fullstack.local` แต่เข้าผ่าน IP (`127.0.0.1`) ทำให้ host header ไม่ match

**ตรวจสอบ**:
```powershell
kubectl describe ingress go-fullstack-ingress -n go-fullstack
# ดูที่ Rules -> Host: go-fullstack.local
```

**วิธีแก้ที่ 1: ใช้ Hostname (แนะนำ)**
```
https://go-fullstack.local:8443/
```

ถ้าเจอ Windows auth prompt:
- กด Cancel
- หรือใช้ Incognito mode (Ctrl+Shift+N)
- หรือใช้ Firefox (ไม่มี Windows auth ค่าเริ่มต้น)

**วิธีแก้ที่ 2: ทดสอบด้วย curl + Host header**
```powershell
curl -k -H "Host: go-fullstack.local" https://127.0.0.1:8443/
```

**วิธีแก้ที่ 3: แก้ Ingress รองรับ IP (ไม่แนะนำ - ทำ CORS/SSL ยุ่งยาก)**

ถ้าจำเป็นต้องเข้าผ่าน IP เท่านั้น ให้ลบ `host:` ออกจาก ingress.yaml:
```yaml
# แก้ไข k8s/ingress.yaml
spec:
  rules:
  - # ลบบรรทัด "host: go-fullstack.local" ออก
    http:
      paths:
      - path: /api(/|$)(.*)
        # ... rest of config
```

หลังแก้ต้อง apply ใหม่:
```powershell
kubectl apply -f ingress.yaml
```

---
