# SSL Ingress Architecture Diagram

> **📖 Documentation**: ถ้าต้องการเริ่มต้นใช้งาน อ่าน [START-HERE.md](START-HERE.md)  
> ไฟล์นี้อธิบาย architecture และ network flow แบบละเอียด

---

## Request Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         User Browser                           │
│                  https://go-fullstack.local/                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ HTTPS Request (Port 443)
                            │ TLS/SSL Encrypted
                            │
┌───────────────────────────▼────────────────────────────────────┐
│              Kubernetes Ingress Controller                     │
│                    (NGINX Ingress)                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           SSL Termination Layer                          │ │
│  │  Secret: go-fullstack-tls                               │ │
│  │  - tls.crt (dev.cert.pem)                              │ │
│  │  - tls.key (dev.cert.key)                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │             Routing Rules                                │ │
│  │                                                          │ │
│  │  Host: go-fullstack.local                               │ │
│  │                                                          │ │
│  │  Path: /api(/|$)(.*)  → backend:8080                   │ │
│  │       rewrite: /$2                                      │ │
│  │                                                          │ │
│  │  Path: /             → frontend:80                      │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────┬─────────────────────────────┬────────────────────────┘
          │                             │
          │ HTTP (internal)             │ HTTP (internal)
          │ ClusterIP                   │ ClusterIP
          │                             │
┌─────────▼──────────────┐   ┌─────────▼──────────────────────┐
│   Frontend Service     │   │     Backend Service            │
│   Type: ClusterIP      │   │     Type: ClusterIP            │
│   Port: 80             │   │     Port: 8080                 │
└─────────┬──────────────┘   └─────────┬──────────────────────┘
          │                            │
          │                            │
┌─────────▼──────────────┐   ┌─────────▼──────────────────────┐
│   Frontend Pod         │   │     Backend Pod                │
│   ┌────────────────┐   │   │     ┌──────────────────────┐   │
│   │  Nginx         │   │   │     │  Go Fiber API        │   │
│   │  React SPA     │   │   │     │  Port: 8080          │   │
│   │  Port: 80      │   │   │     │                      │   │
│   └────────────────┘   │   │     └──────────────────────┘   │
│                        │   │                                │
│   Internal Proxy:      │   │     Connects to:               │
│   /api → backend:8080  │   │     - Redis                    │
│                        │   │     - MinIO                    │
└────────────────────────┘   │     - Vault                    │
                             │     - Elasticsearch            │
                             └────────────────────────────────┘
```

## URL Routing Examples

### Frontend Routes
```
https://go-fullstack.local/              → Frontend (index.html)
https://go-fullstack.local/dashboard     → Frontend (SPA routing)
https://go-fullstack.local/users         → Frontend (SPA routing)
https://go-fullstack.local/health        → Frontend Nginx (/health endpoint)
```

### Backend API Routes
```
https://go-fullstack.local/api/          → Backend (/)
https://go-fullstack.local/api/health    → Backend (/health)
https://go-fullstack.local/api/users     → Backend (/users)
https://go-fullstack.local/api/v1/posts  → Backend (/v1/posts)
```

## Path Rewriting Example

### Request Flow for `/api/users`
```
1. Browser Request:
   https://go-fullstack.local/api/users

2. Ingress Receives:
   Path: /api/users
   Regex Match: /api(/|$)(.*)
   Captured Groups:
   - $1 = /
   - $2 = users

3. Ingress Rewrites (rewrite-target: /$2):
   http://backend:8080/users

4. Backend Processes:
   GET /users
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: TLS/SSL Encryption                               │
│  - Certificate-based encryption                            │
│  - HTTPS only (force redirect)                             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Ingress Controller                               │
│  - Path-based routing                                      │
│  - CORS configuration                                      │
│  - Rate limiting (optional)                                │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Frontend Nginx                                   │
│  - Security headers                                        │
│  - Static asset caching                                    │
│  - API proxy with headers                                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Backend Application                              │
│  - Authentication/Authorization                            │
│  - Business logic                                          │
│  - Data validation                                         │
└─────────────────────────────────────────────────────────────┘
```

## Network Communication

```
┌──────────────────────────────────────────────────────────────┐
│                    External Network                          │
│                  (Public Internet)                           │
└───────────────────────────┬──────────────────────────────────┘
                            │
                   HTTPS (Port 443)
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                  Kubernetes Cluster                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Ingress Namespace                         │ │
│  │  nginx-ingress-controller                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                   HTTP (ClusterIP)                          │
│                            │                                 │
│  ┌────────────────────────┼─────────────────────────────┐  │
│  │      go-fullstack Namespace                          │  │
│  │                        │                              │  │
│  │  ┌─────────────────────┼──────────────────────────┐  │  │
│  │  │  Services (ClusterIP)                          │  │  │
│  │  │                     │                           │  │  │
│  │  │  frontend:80 ◄──────┤                          │  │  │
│  │  │  backend:8080 ◄─────┘                          │  │  │
│  │  │  redis:6379                                    │  │  │
│  │  │  minio:9000                                    │  │  │
│  │  │  vault:8200                                    │  │  │
│  │  │  elasticsearch:9200                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                        │                              │  │
│  │  ┌─────────────────────▼──────────────────────────┐  │  │
│  │  │  Pods                                          │  │  │
│  │  │  - frontend-xxx                               │  │  │
│  │  │  - backend-xxx                                │  │  │
│  │  │  - redis-xxx                                  │  │  │
│  │  │  - minio-xxx                                  │  │  │
│  │  │  - vault-xxx                                  │  │  │
│  │  │  - elasticsearch-xxx                          │  │  │
│  │  │  - kibana-xxx                                 │  │  │
│  │  │  - fluent-bit-xxx (DaemonSet)                │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. TLS Secret Creation                                     │
│     kubectl create secret tls go-fullstack-tls              │
│     --cert=dev.cert.pem --key=dev.cert.key                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  2. Ingress Deployment                                      │
│     - References: go-fullstack-tls secret                  │
│     - Configures: routing rules, SSL redirect              │
│     - Sets: CORS, timeouts, body size limits               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  3. Service Discovery                                       │
│     Ingress → ClusterIP Services                           │
│     - frontend:80                                          │
│     - backend:8080                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  4. Pod Communication                                       │
│     Services route to healthy pods                         │
│     - Label selectors: app=frontend, app=backend           │
│     - Health checks: readiness & liveness probes           │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Pods                         │
│     (Backend, Frontend, Services)                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Logs (stdout/stderr)
                    │
┌───────────────────▼─────────────────────────────────────────┐
│              Fluent-bit (DaemonSet)                         │
│              - Collect logs                                 │
│              - Parse & filter                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Forward to Elasticsearch
                    │
┌───────────────────▼─────────────────────────────────────────┐
│              Elasticsearch                                  │
│              - Index logs                                   │
│              - Store & query                                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Read & visualize
                    │
┌───────────────────▼─────────────────────────────────────────┐
│              Kibana                                         │
│              - Dashboard                                    │
│              - Query interface                              │
│              - Visualizations                               │
└─────────────────────────────────────────────────────────────┘
```

## Summary

**Key Points:**
- ✅ All external traffic goes through HTTPS (port 443)
- ✅ SSL termination happens at Ingress Controller
- ✅ Internal cluster communication uses HTTP (ClusterIP)
- ✅ Path-based routing separates frontend and backend
- ✅ Backend API paths are rewritten for clean URLs
- ✅ Frontend can also proxy API requests internally
- ✅ All services are private (ClusterIP) - only accessible via Ingress
- ✅ Logs are collected and centralized in ELK Stack
