# Port
ตัว Port ของ Project จะเกิดขึ้นได้ 3 ทาง  
```
└── APP_ENV=production        => 443
└── APP_ENV=development       => 8080

หากจะใช้ curl ต้องดูว่าเปิด SSL ไหม ถ้าเป็น ให้ใช้ curl.exe -k ...
```
# 1️⃣ Unsecure HTTP Methods ต้องถูกปิด

📌 ปัญหาปัจจุบัน:  
Fiber อนุญาต HTTP methods ทั้งหมดโดย default (PUT, DELETE, HEAD, OPTIONS, TRACE, WebDAV)

✅ วิธีแก้ไข:
สร้าง middleware ขึ้นมาควบคุม internal/middleware/http_method.go

🧪 วิธีพิสูจน์:
```powershell
# ทดสอบ method ที่ไม่อนุญาต
curl.exe -X TRACE http://localhost:8080/api/v1/health
# Expected: 405 Method Not Allowed

curl.exe -X OPTIONS http://localhost:8080/api/v1/health
# Expected: 405 Method Not Allowed

# ทดสอบ method ที่อนุญาต
curl.exe -X GET http://localhost:8080/api/v1/health
# Expected: 200 OK
```

# 2️⃣ HTTP-Only Cookie Flags (Non-check)
📌
ใช้ secure cookies เพื่อป้องกันการอ่าน cookie ด้วย Javascript (ป้องกัน XSS)ตัวอย่างการเปลี่ยนรูปแบบการส่ง Jwt Token ผ่าน Payload

✅ วิธีแก้ไข:
```go
    // ⭐ ตั้งค่า Access Token Cookie
    c.Cookie(&fiber.Cookie{
        Name:     "access_token",
        Value:    accessToken,
        MaxAge:   900,              // 15 minutes
        HTTPOnly: true,             // ป้องกัน XSS
        Secure:   true,             // HTTPS only (production)
        SameSite: "Strict",         // ป้องกัน CSRF
        Path:     "/",
    })

    // ⭐ ตั้งค่า Refresh Token Cookie
    c.Cookie(&fiber.Cookie{
        Name:     "refresh_token",
        Value:    refreshToken,
        MaxAge:   604800,           // 7 days
        HTTPOnly: true,
        Secure:   true,
        SameSite: "Strict",
        Path:     "/api/v1/auth/refresh-token",  // จำกัด path
    })
```
```go
        // ⭐ อ่าน token จาก cookie แทน Authorization header
        tokenString := c.Cookies("access_token")
```
🧪 วิธีพิสูจน์:
```powershell
# ทดสอบ login และตรวจสอบ cookies
curl.exe -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"password"}' `
  -c cookies.txt -v

# ตรวจสอบใน response headers ว่ามี:
# Set-Cookie: access_token=...; Max-Age=900; HttpOnly; Secure; SameSite=Strict
# Set-Cookie: refresh_token=...; Max-Age=604800; HttpOnly; Secure; SameSite=Strict

# ทดสอบใช้งาน protected route ด้วย cookie
curl.exe -X GET http://localhost:8080/api/v1/profile `
  -b cookies.txt
# Expected: 200 OK with user profile
```
ตรวจสอบด้วย Browser DevTools:

1. เปิด Application > Cookies
2. ดูว่า cookies มี flags: ✅ HttpOnly, ✅ Secure, ✅ SameSite=Strict

# 3️⃣ Security Header
สร้าง middleware เพื่อใส่ security header /internal/middleware/security_header.go

📌 HSTS (HTTP Strict Transport Security) (Non-check)
```go
c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
```

🧪 วิธีพิสูจน์:
```powershell
# ทดสอบ HSTS header
curl.exe -I https://localhost:8080/api/v1/health | Select-String "Strict-Transport-Security"

# Expected output:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
📌 Content-Type-Options
```go
c.Set("X-Content-Type-Options", "nosniff")
```
🧪 วิธีพิสูจน์:
```powershell
curl.exe -I http://localhost:8080/api/v1/health | Select-String "X-Content-Type-Options"
# Expected: X-Content-Type-Options: nosniff
```

📌 X-Frame-Options
```go
c.Set("X-Frame-Options", "DENY")
```
🧪 วิธีพิสูจน์:
```powershell
curl.exe -I http://localhost:8080/api/v1/health | Select-String "X-Frame-Options"
# Expected: X-Frame-Options: DENY
```
ทดสอบด้วย HTML:
```html
<!-- test-iframe.html -->
<iframe src="http://localhost:8080/api/v1/health"></iframe>
<!-- Expected: Browser จะบล็อกและแสดง error -->
```
📌 Content-Security-Policy (CSP)
```go
csp := "default-src 'self'; " +
       "object-src 'none'; " +
       "frame-ancestors 'none'; " +
       "base-uri 'self'; " +
       "form-action 'self'; " +
       "upgrade-insecure-requests"
       
c.Set("Content-Security-Policy", csp)
```
คำอธิบาย:

- default-src 'self' - อนุญาตเฉพาะ resources จาก same origin
- object-src 'none' - ห้าม plugins (Flash, Java)
- frame-ancestors 'none' - ห้ามแสดงใน iframe (คล้าย X-Frame-Options)
- base-uri 'self' - จำกัด <base> tag
- form-action 'self' - forms สามารถ submit ได้เฉพาะ same origin
- upgrade-insecure-requests - อัพเกรด HTTP → HTTPS

🧪 วิธีพิสูจน์:
```powershell
curl.exe -I http://localhost:8080/api/v1/health | Select-String "Content-Security-Policy"
# Expected: ต้องมี CSP header ครบ
```

ตรวจสอบ CSP Violations:
- เปิด Browser Console
- พยายามโหลด external script หรือ iframe
- ควรเห็น CSP violation errors

# 7️⃣ CORS Configuration
สร้าง middleware เพื่อตั้งค่า Cors ใน /internal/middleware/cors.go

🧪 วิธีพิสูจน์:
```powershell
# ทดสอบ CORS preflight request
curl -X OPTIONS http://localhost:8080/api/v1/health `
  -H "Origin: http://localhost:3000" `
  -H "Access-Control-Request-Method: GET" `
  -v

# Expected headers ใน response:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE

# ทดสอบ origin ที่ไม่อนุญาต
curl -X OPTIONS http://localhost:8080/api/v1/health `
  -H "Origin: http://malicious-site.com" `
  -v
# Expected: ไม่มี Access-Control-Allow-Origin header
```

# 8️⃣ Cache-Control Headers
ปรับเพิ่ม Cache control header สำหรับ sensitive data ใน /internal/middleware/security_header.go
```go
    // ⭐ Cache-Control headers สำหรับ sensitive data
    c.Set("Cache-Control", "no-cache, no-store, must-revalidate, private")
    c.Set("Pragma", "no-cache")
    c.Set("Expires", "0")
```

🧪 วิธีพิสูจน์:
```powershell
curl.exe -I http://localhost:8080/api/v1/profile | Select-String "Cache-Control"
# Expected: Cache-Control: no-cache, no-store, must-revalidate, private

curl.exe -I http://localhost:8080/api/v1/profile | Select-String "Pragma"
# Expected: Pragma: no-cache

curl.exe -I http://localhost:8080/api/v1/profile | Select-String "Expires"
# Expected: Expires: 0
```
ตรวจสอบว่า browser ไม่ cache:

1. เปิด DevTools > Network
2. Refresh หน้าหลายครั้ง
3. ดู Status column ไม่ควรมี "(from cache)"

# 9️⃣ Remove Fingerprinting/Version Headers
พยายามลบพวกลายนิ้วมือหรือ version ของสิ่งที่เอามาใช้ เพื่อช่วยให้ Hacker เดา Version และช่องโหว่ได้ยากขึ้น
```go
app := fiber.New(fiber.Config{
    AppName:               "KS_WEALTH_API",
    ServerHeader:          "",              // ⭐ ลบ Server header
    DisableStartupMessage: true,           // แสดง startup message ได้ (ไม่กระทบ security)
})
```

🧪 วิธีพิสูจน์:
```powershell
# ตรวจสอบว่าไม่มี Server header
curl -I http://localhost:8080/api/v1/health | Select-String "Server"
# Expected: ไม่มี output หรือเป็น empty string

# ตรวจสอบ headers ทั้งหมด
curl -I http://localhost:8080/api/v1/health
# ต้องไม่มี: X-Powered-By, X-AspNet-Version, Server: Fiber
```

# 🔟 Confidential Data Over HTTPS
📌 ปัญหา:
ข้อมูล sensitive (passwords, tokens) ต้องส่งผ่าน HTTPS เท่านั้น

✅ วิธีแก้ไข (Architecture ที่ใช้จริง):

**Architecture Overview:**
```
Client (HTTPS) → Ingress (TLS Termination) → Backend (HTTP:8080)
                                           → Frontend (HTTP:80)
```

## 1. Kubernetes Ingress (TLS Termination)

Ingress Controller จัดการ HTTPS และ redirect HTTP → HTTPS อัตโนมัติ

**k8s/ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: go-fullstack-ingress
  namespace: go-fullstack
  annotations:
    # บังคับ HTTPS
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    
    # Rate limiting (ป้องกัน brute force)
    nginx.ingress.kubernetes.io/limit-rps: "20"
    
    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://go-fullstack.local"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - go-fullstack.local
    secretName: go-fullstack-tls  # TLS Certificate
  rules:
  - host: go-fullstack.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8080  # Backend ใช้ HTTP ภายใน cluster
```

**สร้าง TLS Secret:**
```powershell
# สร้าง self-signed certificate (development)
cd ../certs

# หรือใช้ Let's Encrypt (production)
kubectl create secret tls go-fullstack-tls `
  --cert=dev.cert.pem `
  --key=dev.cert.key `
  -n go-fullstack
```

## 2. Backend Configuration

Backend listen HTTP:8080 ภายใน cluster (ไม่ต้องจัดการ TLS)

**cmd/api/main.go:**
```go
func main() {
    app := fiber.New(fiber.Config{
        AppName:               "KS_WEALTH_API",
        ServerHeader:          "",
        DisableStartupMessage: true,
    })

    // Setup middleware และ routes
    bootstrap.InitializeApp(app)

    // Backend ใช้ HTTP ใน cluster (Ingress จัดการ TLS)
    log.Fatal(app.Listen(":8080"))
}
```

**ทำไมไม่ใช้ HTTPS ที่ Backend?**
- ✅ TLS termination ที่ Ingress (centralized)
- ✅ ง่ายต่อการจัดการ certificates
- ✅ Backend ไม่ต้องโหลด TLS certificates
- ✅ Communication ภายใน cluster ปลอดภัยอยู่แล้ว (isolated network)

## 3. Security Headers (Frontend Nginx)

Frontend Nginx เพิ่ม security headers สำหรับ browser

**k8s/frontend/frontend-nginx-configmap.yaml:**
```yaml
data:
  nginx.conf: |
    server {
        listen 80;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Content-Security-Policy "default-src 'self'; ..." always;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
```

## 4. Port Forwarding สำหรับ Development

**Local Testing:**
```powershell
# Port forward Ingress Controller
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8443:443

# เข้าใช้งาน
https://go-fullstack.local:8443/

# หรือใช้ 127.0.0.1 (ต้อง -k เพราะ self-signed cert)
curl -k https://127.0.0.1:8443/api/v1/health
```

## 5. Middleware: ตรวจสอบ X-Forwarded-Proto

Backend ตรวจสอบว่า request มาจาก HTTPS หรือไม่ (ผ่าน header จาก Ingress)

**internal/middleware/security_header.go:**
```go
func SecurityHeaderMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // ตรวจสอบว่ามาจาก HTTPS (Ingress set header)
        if c.Get("X-Forwarded-Proto") == "https" {
            // เพิ่ม HSTS header
            c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        }
        
        // เพิ่ม security headers อื่นๆ
        c.Set("X-Content-Type-Options", "nosniff")
        c.Set("X-Frame-Options", "DENY")
        
        return c.Next()
    }
}
```

🧪 วิธีพิสูจน์:

**1. ตรวจสอบ Ingress SSL Redirect:**
```powershell
# ลอง access HTTP (ถ้า port forward 443)
curl -I http://go-fullstack.local:8443/api/v1/health -v

# หรือใช้ ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50
```

**2. ตรวจสอบ TLS Certificate:**
```powershell
# ตรวจสอบ cert ที่ Ingress ใช้
kubectl get secret go-fullstack-tls -n go-fullstack -o yaml

# ทดสอบ TLS handshake
openssl s_client -connect 127.0.0.1:8443 -servername go-fullstack.local
```

**3. ตรวจสอบ Security Headers:**
```powershell
# ทดสอบ HTTPS response headers
curl.exe -I -k https://go-fullstack.local:8443/ | Select-String "Strict-Transport-Security"
curl.exe -I -k https://go-fullstack.local:8443/ | Select-String "X-Frame-Options"
curl.exe -I -k https://go-fullstack.local:8443/ | Select-String "Content-Security-Policy"
```

**4. ตรวจสอบ Backend ไม่เปิด port 443:**
```powershell
# เช็คว่า backend pod ใช้ port 8080
kubectl get pods -n go-fullstack -l app=backend -o yaml | Select-String "containerPort"
# Expected: containerPort: 8080
```

**5. ตรวจสอบ X-Forwarded-Proto:**
```powershell
# เข้าไปดู logs ใน backend
kubectl logs -n go-fullstack -l app=backend --tail=20

# ควรเห็น X-Forwarded-Proto: https ใน request headers
```

**6. Browser DevTools:**
1. เปิด Network tab
2. Login หรือส่ง sensitive data
3. ดู Request Headers ต้องมี:
   - `Protocol: https`
   - `X-Forwarded-Proto: https`
4. ดู Response Headers ต้องมี:
   - `Strict-Transport-Security: max-age=31536000`

**7. ทดสอบ Rate Limiting:**
```powershell
# ทดสอบส่ง requests เยอะๆ
for ($i=1; $i -le 30; $i++) {
    curl -k https://go-fullstack.local:8443/api/v1/health
}
# Expected: หลังจาก 20 requests จะได้ 429 Too Many Requests
```

📋 Deployment Checklist:
- ✅ TLS Secret สร้างแล้ว (`go-fullstack-tls`)
- ✅ Ingress มี annotation `ssl-redirect: "true"`
- ✅ Backend listen port 8080 (HTTP)
- ✅ Frontend nginx มี security headers
- ✅ Ingress มี rate limiting
- ✅ CORS configuration ถูกต้อง
- ✅ ทดสอบ HTTPS access ได้

⚠️ สำคัญ:
- **Self-signed certificates เหมาะกับ development เท่านั้น**
- **Production ใช้ Let's Encrypt หรือ trusted CA**
- **Certificate ต้อง match กับ hostname (go-fullstack.local)**
- **เก็บ private key ใน Kubernetes Secret เท่านั้น**
- **Rotate certificates ก่อนหมดอายุ**

🔐 Security Best Practices:
1. **TLS 1.2+** เท่านั้น (disable TLS 1.0/1.1)
2. **Strong cipher suites** (AES-256-GCM)
3. **HSTS preload** (หลังมั่นใจว่า HTTPS ใช้งานได้ 100%)
4. **Certificate pinning** (สำหรับ mobile apps)
5. **Monitor certificate expiration** (alert ก่อนหมดอายุ 30 วัน)