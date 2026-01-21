# 🚀 START HERE - SSL Ingress Deployment Guide

> **📋 ต้องการ checklist ละเอียด?** → ดู **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)**  
> **🔧 มีปัญหา?** → ดู **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## เริ่มต้นใช้งานด่วน (5 นาที)

### ขั้นตอนที่ 1: ติดตั้ง NGINX Ingress Controller (ครั้งแรกเท่านั้น)

**เช็คว่าติดตั้งแล้วหรือยัง:**
```powershell
kubectl get namespace ingress-nginx
```

**ถ้าได้ `Error: namespaces "ingress-nginx" not found` แสดงว่ายังไม่ได้ติดตั้ง:**
```powershell
# ติดตั้ง NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# รอให้ติดตั้งเสร็จ (ประมาณ 1-2 นาที)
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=120s

# เช็คว่าทำงาน
kubectl get pods -n ingress-nginx
```

**ถ้าติดตั้งแล้ว:** ข้ามไปขั้นตอนที่ 2 เลย ✅

---

### ขั้นตอนที่ 2: Deploy Application
```powershell
cd k8s
.\scripts\apply-all.ps1
```

### ขั้นตอนที่ 3: เพิ่ม hosts file
เปิดไฟล์ `C:\Windows\System32\drivers\etc\hosts` (Run as Administrator) และเพิ่ม:
```
127.0.0.1 go-fullstack.local
```

### ขั้นตอนที่ 4: Port forward ingress

**วิธีที่ 1: Foreground (แนะนำสำหรับครั้งแรก)**
```powershell
# รันใน PowerShell ปกติ (ไม่ต้อง admin, ไม่ชนกับ IIS):
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443
```
**หมายเหตุ**: เปิด terminal ทิ้งไว้ กด Ctrl+C เพื่อหยุด

**วิธีที่ 2: Background (PowerShell) - ไม่ต้องเปิด terminal ทิ้งไว้**
```powershell
# เปิดแบบ background
Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 }

# ตรวจสอบสถานะ
Get-Job

# ดู logs (ถ้ามีปัญหา)
Receive-Job -Name ingress -Keep

# ปิดเมื่อเลิกใช้
Stop-Job -Name ingress
Remove-Job -Name ingress
```

**วิธีที่ 3: Background (Linux/Mac)**
```bash
# เปิดแบบ background
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 &

# ดู background jobs
jobs

# ปิดเมื่อเลิกใช้
killall kubectl
# หรือ
pkill -f "kubectl port-forward.*ingress-nginx"
```

**หรือถ้าต้องการใช้ port 443 (ต้องปิด IIS):**
```powershell
# ปิด IIS ก่อน
iisreset /stop

# PowerShell background
Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443 }
```

### ขั้นตอนที่ 5: เข้าใช้งาน

**ถ้าใช้ port 8443 (แนะนำ):**
```
https://127.0.0.1:8443/
```

**ถ้าใช้ port 443:**
```
https://127.0.0.1/
```

**หมายเหตุ**: ใช้ IP (127.0.0.1) แทน hostname เพื่อหลีกเลี่ยง Windows auth prompt

✅ **เสร็จแล้ว!**

---

## 🎯 ถัดไป

- **ตรวจสอบทุกอย่าง**: [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Checklist ครบถ้วน
- **เข้าใจ Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - ดู diagrams และโครงสร้าง  
- **มีปัญหา**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - แก้ปัญหาทั่วไป
- **คู่มือละเอียด**: [README.md](README.md) - เอกสารทั้งหมด

---

## 🔍 ตรวจสอบสถานะ

```powershell
# ดู pods ทั้งหมด
kubectl get pods -n go-fullstack

# ดู ingress
kubectl get ingress -n go-fullstack

# ดู TLS secret
kubectl get secret go-fullstack-tls -n go-fullstack
```

---

## 🧪 ทดสอบ

```powershell
# Frontend
curl -k https://go-fullstack.local/

# Backend API
curl -k https://go-fullstack.local/api/health
```

---

## ⚠️ Prerequisites (ต้องมีก่อน deploy)

- ✅ Kubernetes cluster running
- ✅ NGINX Ingress Controller installed
- ✅ Certificates ใน `../certs/` (dev.cert.pem, dev.cert.key)

### ติดตั้ง NGINX Ingress Controller:
```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

---

## 💡 Tips

- ใช้งานผ่าน HTTPS เท่านั้น: `https://go-fullstack.local/`
- Backend API: `https://go-fullstack.local/api/*`
- Self-signed certificate จะมี warning (ปกติในการพัฒนา)
- Port forward ต้องเปิดทิ้งไว้ตลอดเวลาที่ใช้งาน

---

## 🎯 What You Get

✅ **Frontend**: React app with Nginx  
✅ **Backend**: Go Fiber API  
✅ **SSL/TLS**: HTTPS encryption  
✅ **Auto Redirect**: HTTP → HTTPS  
✅ **Logging**: ELK Stack (Elasticsearch, Kibana, Fluent-bit)  
✅ **Storage**: MinIO, Redis, Vault  

---

## 📞 ติดปัญหา?

1. ดู [TROUBLESHOOTING.md](TROUBLESHOOTING.md) ก่อน
2. เช็ค logs: `kubectl logs -n go-fullstack -l app=backend --tail=50`
3. เช็ค ingress logs: `kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50`

---

**หมายเหตุ**: ไฟล์นี้ใช้สำหรับ quick start เท่านั้น หากต้องการรายละเอียด ดูไฟล์อื่นตามหัวข้อด้านบน
