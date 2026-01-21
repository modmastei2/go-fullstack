# SSL Ingress Deployment Checklist

> **� ต้องการเริ่มต้นด่วน?** → อ่าน **[START-HERE.md](START-HERE.md)** (5 นาที)  
> **💡 Tip**: Checklist นี้ใช้สำหรับการ deploy แบบละเอียดและตรวจสอบทุกขั้นตอน

---

## ✅ Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Kubernetes cluster is running
- [ ] `kubectl` is configured and connected
- [ ] Docker is running (for building images)
- [ ] SSL certificates exist in `../certs/` directory
  - [ ] `dev.cert.pem` 
  - [ ] `dev.cert.key`

### 2. NGINX Ingress Controller
- [ ] NGINX Ingress Controller is installed
  ```powershell
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
  ```
- [ ] Ingress controller pods are running
  ```powershell
  kubectl get pods -n ingress-nginx
  ```

## 🚀 Deployment Steps

### Step 1: Build Images
- [ ] Run build script
  ```powershell
  .\build-and-load.ps1
  ```
- [ ] Verify images are loaded
  ```powershell
  # For Docker Desktop/Minikube
  docker images | grep go-fullstack
  ```

### Step 2: Deploy Application
- [ ] Run deployment script
  ```powershell
  .\apply-all.ps1
  ```
- [ ] Wait for all pods to be ready (2-3 minutes)

### Step 3: Verify Deployment
- [ ] Check all pods are running
  ```powershell
  kubectl get pods -n go-fullstack
  ```
- [ ] Check TLS secret is created
  ```powershell
  kubectl get secret go-fullstack-tls -n go-fullstack
  ```
- [ ] Check ingress is created
  ```powershell
  kubectl get ingress -n go-fullstack
  ```
- [ ] Check services are ready
  ```powershell
  kubectl get svc -n go-fullstack
  ```

### Step 4: Configure Local Access
- [ ] Add to hosts file (`C:\Windows\System32\drivers\etc\hosts`):
  ```
  127.0.0.1 go-fullstack.local
  ```
- [ ] Port forward ingress controller (เลือก 1 วิธี)
  
  **Foreground (ง่ายที่สุด):**
  ```powershell
  # Port 8443 (ไม่ต้อง admin, ไม่ชนกับ IIS)
  kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443
  # เข้าใช้งาน: https://127.0.0.1:8443/
  
  # Port 443 (ต้อง Run as Administrator และปิด IIS)
  kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 443:443
  # เข้าใช้งาน: https://127.0.0.1/
  ```
  
  **Background (แนะนำ - ไม่ต้องทิ้ง terminal):**
  ```powershell
  # PowerShell - Background mode
  Start-Job -Name ingress { kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 }
  
  # ตรวจสอบสถานะ
  Get-Job
  
  # ดู logs (ถ้ามีปัญหา)
  Receive-Job -Name ingress -Keep
  
  # ปิดเมื่อเลิกใช้
  Stop-Job -Name ingress
  Remove-Job -Name ingress
  ```
  
  **Linux/Mac - Background:**
  ```bash
  kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443 &
  jobs              # ดู background jobs
  killall kubectl   # ปิดเมื่อเลิกใช้
  ```

### Step 5: Test Access
- [ ] Open browser and navigate to: `https://go-fullstack.local:8443/` (or `https://127.0.0.1/` if Windows auth prompt appears)
- [ ] Accept self-signed certificate warning (for development)
- [ ] Verify frontend loads correctly
- [ ] Test backend API: `https://go-fullstack.local:8443/api/v1/health`
- [ ] Check browser console for any errors

## 🔍 Verification Tests

### Test 1: HTTPS Access
```powershell
# Test HTTPS connection
curl.exe -I -k https://go-fullstack.local:8443/
# Expected: HTTP/2 200 OK (or HTTP/1.1 200 OK)
```

**Note**: ไม่สามารถทดสอบ HTTP redirect ด้วย port 8443 ได้ เพราะ port 8443 เป็น HTTPS port (443) ที่ต้องการ TLS handshake

ถ้าต้องการทดสอบ HTTP → HTTPS redirect จริงๆ ต้อง port-forward HTTP port (80) ด้วย:
```powershell
# Port forward HTTP port
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80

# ทดสอบ redirect (ใน terminal อื่น)
curl.exe -I http://go-fullstack.local:8080/
# Expected: HTTP/1.1 308 Permanent Redirect
# Location: https://go-fullstack.local/
```

### Test 2: Frontend Access
```powershell
curl.exe -k https://go-fullstack.local:8443/
# Expected: HTML content of static file index.html
```

### Test 3: Backend API Access
```powershell
curl.exe -k https://go-fullstack.local:8443/api/v1/health
# Expected: {"ServerStatus":"OK","ServerTime":"2026-01-21T08:22:40.363789273Z"} or similar
```

### Test 4: Health Endpoint
```powershell
curl.exe -k https://go-fullstack.local:8443/health
# Expected: healthy
```

### Test 5: Static Assets
```powershell
# ดู assets ที่มีจริงจาก index.html
curl.exe -k https://go-fullstack.local:8443/ | Select-String "assets/"

# ทดสอบด้วยไฟล์ที่มีจริง (ชื่อไฟล์มี hash เช่น index-xxxxx.js)
# ตัวอย่าง:
curl.exe -I -k https://go-fullstack.local:8443/assets/index---fIsqSc.js
# Expected: HTTP/2 200 OK (or HTTP/1.1 200 OK)
# Expected headers: Cache-Control, Content-Type: application/javascript

# ทดสอบ vite.svg (static file)
curl.exe -I -k https://go-fullstack.local:8443/vite.svg
# Expected: HTTP/2 200 OK
```

**Note**: ไฟล์ในโฟลเดอร์ `/assets/` ใช้ content-based hashing (Vite build) ชื่อไฟล์จะเปลี่ยนทุกครั้งที่ rebuild

## 🐛 Troubleshooting Checklist

### If Frontend Not Loading
- [ ] Check frontend pod logs
  ```powershell
  kubectl logs -n go-fullstack -l app=frontend --tail=50
  ```
- [ ] Check if frontend service endpoints exist
  ```powershell
  kubectl get endpoints frontend -n go-fullstack
  ```
- [ ] Verify nginx configuration
  ```powershell
  kubectl describe configmap frontend-nginx-config -n go-fullstack
  ```

### If Backend API Not Working
- [ ] Check backend pod logs
  ```powershell
  kubectl logs -n go-fullstack -l app=backend --tail=50
  ```
- [ ] Check backend service endpoints
  ```powershell
  kubectl get endpoints backend -n go-fullstack
  ```
- [ ] Test backend directly
  ```powershell
  kubectl port-forward -n go-fullstack svc/backend 8080:8080
  curl.exe http://localhost:8080/health
  ```

### If SSL Not Working
- [ ] Verify TLS secret exists and has correct data
  ```powershell
  kubectl describe secret go-fullstack-tls -n go-fullstack
  ```
- [ ] Check ingress configuration
  ```powershell
  kubectl describe ingress go-fullstack-ingress -n go-fullstack
  ```
- [ ] Check ingress controller logs
  ```powershell
  kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100
  ```

### If Routing Not Working
- [ ] Verify ingress rules
  ```powershell
  kubectl get ingress go-fullstack-ingress -n go-fullstack -o yaml
  ```
- [ ] Check ingress annotations
- [ ] Test path rewriting with verbose curl.exe
  ```powershell
  curl.exe -kv https://go-fullstack.local:8443/api/v1/health
  ```

## 📊 Health Check Commands

### Quick Health Check
```powershell
# All-in-one health check
kubectl get pods,svc,ingress -n go-fullstack
```

### Detailed Status
```powershell
# Pod status with resource usage
kubectl top pods -n go-fullstack

# Service endpoints
kubectl get endpoints -n go-fullstack

# Ingress details
kubectl describe ingress go-fullstack-ingress -n go-fullstack
```

### Certificate Validation
```powershell
# Check certificate expiry
openssl x509 -in ../certs/dev.cert.pem -enddate -noout

# View certificate details
openssl x509 -in ../certs/dev.cert.pem -text -noout
```

## 📝 Post-Deployment Tasks

### Immediate
- [ ] Test all major application features
- [ ] Verify API endpoints are accessible
- [ ] Check browser console for errors
- [ ] Test file uploads (if applicable)
- [ ] Verify WebSocket connections (if applicable)

### Monitoring Setup

**Option 1: Port Forward (แนะนำสำหรับ Development/Personal use)**
- [ ] Access Kibana dashboard
  ```powershell
  kubectl port-forward -n go-fullstack svc/kibana 5601:5601
  ```
  Open: http://localhost:5601
  
  **ข้อดี:**
  - ✅ ง่ายที่สุด ไม่ต้อง config เพิ่ม
  - ✅ ไม่ expose ออกภายนอก cluster
  - ✅ เหมาะกับการใช้งานคนเดียวหรือทีมเล็ก
  
  **ข้อเสีย:**
  - ❌ ต้องเปิด terminal ทิ้งไว้
  - ❌ คนอื่นเข้าถึงไม่ได้ (ต้อง port-forward เอง)

**Option 2: Ingress (สำหรับ Production/Team use)**
- [ ] สร้าง Ingress สำหรับ Kibana
  ```yaml
  # k8s/elk/kibana-ingress.yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: kibana-ingress
    namespace: go-fullstack
    annotations:
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      # เพิ่ม Basic Auth (optional - แนะนำ)
      nginx.ingress.kubernetes.io/auth-type: basic
      nginx.ingress.kubernetes.io/auth-secret: kibana-basic-auth
      nginx.ingress.kubernetes.io/auth-realm: "Kibana Dashboard"
  spec:
    ingressClassName: nginx
    tls:
    - hosts:
      - kibana.go-fullstack.local
      secretName: go-fullstack-tls
    rules:
    - host: kibana.go-fullstack.local
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: kibana
              port:
                number: 5601
  ```
  
  - [ ] สร้าง Basic Auth (optional แต่แนะนำ):
    ```powershell
    # ติดตั้ง htpasswd (ใน Git Bash หรือ WSL)
    htpasswd -c auth admin
    # Enter password เมื่อถาม
    
    # สร้าง secret
    kubectl create secret generic kibana-basic-auth `
      --from-file=auth `
      -n go-fullstack
    ```
  
  - [ ] เพิ่มใน hosts file:
    ```
    127.0.0.1 kibana.go-fullstack.local
    ```
  
  - [ ] Apply ingress:
    ```powershell
    kubectl apply -f elk/kibana-ingress.yaml
    ```
  
  - [ ] เข้าใช้งาน: https://kibana.go-fullstack.local:8443/
  
  **ข้อดี:**
  - ✅ ทีมทั้งหมดเข้าถึงได้ (ผ่าน URL เดียวกัน)
  - ✅ มี authentication ป้องกัน
  - ✅ ใช้ HTTPS เหมือน production
  
  **ข้อเสีย:**
  - ❌ ต้อง setup เพิ่ม
  - ❌ ต้อง config DNS/hosts
  
**คำแนะนำ:**
- 💡 **Development**: ใช้ Port Forward (Option 1)
- 🏢 **Team/Production**: ใช้ Ingress (Option 2)

**หลังจาก Access แล้ว:**
- [ ] Verify logs are being collected
- [ ] Create log dashboards
- [ ] Set up alerts (if needed)

### Documentation
- [ ] Document any custom configurations
- [ ] Note any issues encountered and solutions
- [ ] Update team wiki/documentation
- [ ] Share access URLs with team

## 🔒 Security Checklist

### Development
- [x] Self-signed certificates are acceptable
- [x] HTTP to HTTPS redirect enabled
- [x] CORS configured for localhost
- [x] Security headers configured

### Production (TODO)
- [ ] Replace with CA-signed certificates
- [ ] Implement rate limiting
- [ ] Add WAF rules
- [ ] Configure IP whitelisting (if needed)
- [ ] Enable HSTS
- [ ] Set up certificate rotation
- [ ] Configure monitoring alerts
- [ ] Implement backup strategy

## 📖 Reference Documentation

- **Quick Start**: [START-HERE.md](START-HERE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Main Documentation**: [README.md](README.md)

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All pods are in `Running` state
- ✅ All services have endpoints
- ✅ Ingress has an address assigned
- ✅ TLS secret is properly configured
- ✅ HTTPS access works: https://go-fullstack.local:8443/
- ✅ Backend API accessible: https://go-fullstack.local:8443/api/v1/*
- ✅ Frontend loads without errors
- ✅ Browser shows padlock icon (even with warning for self-signed)
- ✅ Logs are being collected in Elasticsearch
- ✅ No error messages in ingress controller logs

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 443 in use by IIS | Use port 8443 or stop IIS: `iisreset /stop` |
| Windows Security auth prompt | Use https://127.0.0.1:8443/ instead of hostname |
| Port 443 access denied | Stop IIS or use port 8443 |
| Certificate not trusted | Accept warning (dev) or use CA cert (prod) |
| 404 Not Found | Check ingress rules and service endpoints |
| Connection refused | Verify port-forward is active |
| Backend timeout | Check backend service health and logs |
| CORS errors | Verify CORS configuration in ingress |
| Static assets 404 | Check frontend build and nginx config |
| Logs not appearing | Verify fluent-bit is running |

## 📞 Support Resources

- **GitHub Issues**: Open issue in repository
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **NGINX Ingress Docs**: https://kubernetes.github.io/ingress-nginx/
- **Troubleshooting Guide**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Security Documentation**: [SECURITY.md](SECURITY.md)

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Status**: Ready for Deployment ✅
