# Kubernetes Architecture - SSL Ingress with Go Fullstack

> **📖 Quick Start**: [START-HERE.md](START-HERE.md) | **🐛 Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | **🔒 Security**: [SECURITY.md](SECURITY.md)

---

## 🏗️ High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         User Browser                           │
│           https://go-fullstack.local:8443/                     │
└───────────────────────────┬────────────────────────────────────┘
                            │
                    Port Forward (Local Dev)
                   kubectl port-forward 8443:443
                            │
┌───────────────────────────▼────────────────────────────────────┐
│              NGINX Ingress Controller                          │
│                  (ingress-nginx namespace)                     │
│                                                                │
│  🔐 TLS Termination                                            │
│  ├─ Secret: go-fullstack-tls                                  │
│  ├─ Certificate: dev.cert.pem (self-signed)                   │
│  └─ Private Key: dev.cert.key                                 │
│                                                                │
│  🛣️  Routing Rules (go-fullstack.local)                       │
│  ├─ /api/*    → backend:8080  (Backend API)                   │
│  └─ /*        → frontend:80   (React SPA)                     │
│                                                                │
│  🔒 Security Features                                          │
│  ├─ SSL Redirect (HTTP → HTTPS)                               │
│  ├─ Rate Limiting (20 req/sec)                                │
│  └─ CORS (https://go-fullstack.local)                         │
└─────────┬─────────────────────────────┬────────────────────────┘
          │                             │
    HTTP (ClusterIP)              HTTP (ClusterIP)
          │                             │
┌─────────▼──────────────┐   ┌─────────▼──────────────────────┐
│   Frontend Service     │   │     Backend Service            │
│   Port: 80             │   │     Port: 8080                 │
└─────────┬──────────────┘   └─────────┬──────────────────────┘
          │                            │
┌─────────▼──────────────┐   ┌─────────▼──────────────────────┐
│   Frontend Pod         │   │     Backend Pod                │
│   ┌────────────────┐   │   │   ┌──────────────────────┐     │
│   │ Nginx + React  │   │   │   │  Go Fiber API        │     │
│   │ Port: 80       │───┼───┼──▶│  Port: 8080          │     │
│   └────────────────┘   │   │   └──────────────────────┘     │
│                        │   │            │                    │
│   Security Headers:    │   │            │ Connects to:       │
│   - HSTS               │   │            ├─ Redis:6379        │
│   - CSP                │   │            ├─ Vault:8200        │
│   - X-Frame-Options    │   │            ├─ MinIO:9000        │
│   - XSS Protection     │   │            └─ Elasticsearch     │
└────────────────────────┘   └────────────────────────────────┘
```

---

## 📊 Complete Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │             Namespace: ingress-nginx                              │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │  nginx-ingress-controller (Deployment)                     │  │ │
│  │  │  - Listens on :80, :443                                   │  │ │
│  │  │  - LoadBalancer Service (or port-forward for local)       │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │             Namespace: go-fullstack                               │ │
│  │                                                                   │ │
│  │  📱 Frontend Stack                                                │ │
│  │  ├─ frontend-deployment.yaml                                     │ │
│  │  │   └─ Nginx + React (1 replica)                               │ │
│  │  ├─ frontend-service.yaml (ClusterIP :80)                        │ │
│  │  ├─ frontend-configmap.yaml (ConfigMap)                          │ │
│  │  └─ frontend-nginx-configmap.yaml (Nginx config)                 │ │
│  │                                                                   │ │
│  │  🔧 Backend Stack                                                 │ │
│  │  ├─ backend-deployment.yaml                                      │ │
│  │  │   └─ Go Fiber API (1 replica)                                │ │
│  │  ├─ backend-service.yaml (ClusterIP :8080)                       │ │
│  │  ├─ backend-configmap.yaml (ConfigMap)                           │ │
│  │  └─ backend-secret.yaml (Secret - sealed)                        │ │
│  │                                                                   │ │
│  │  💾 Data Layer                                                    │ │
│  │  ├─ redis-deployment.yaml                                        │ │
│  │  │   ├─ Service: redis:6379                                      │ │
│  │  │   └─ PVC: redis-pvc (8Gi)                                     │ │
│  │  │                                                                │ │
│  │  ├─ minio-deployment.yaml                                        │ │
│  │  │   ├─ Service: minio:9000                                      │ │
│  │  │   └─ PVC: minio-pvc (10Gi)                                    │ │
│  │  │                                                                │ │
│  │  └─ vault-deployment.yaml                                        │ │
│  │      ├─ Service: vault:8200                                      │ │
│  │      └─ Init Job: vault-init-job                                 │ │
│  │                                                                   │ │
│  │  📊 ELK Stack (Logging)                                           │ │
│  │  ├─ elasticsearch-deployment.yaml                                │ │
│  │  │   ├─ Service: elasticsearch:9200                              │ │
│  │  │   └─ PVC: elasticsearch-pvc (30Gi)                            │ │
│  │  │                                                                │ │
│  │  ├─ kibana-deployment.yaml                                       │ │
│  │  │   ├─ Service: kibana:5601                                     │ │
│  │  │   └─ Init Job: kibana-init-job                                │ │
│  │  │                                                                │ │
│  │  └─ fluent-bit-daemonset.yaml                                    │ │
│  │      ├─ Runs on every node                                       │ │
│  │      └─ Collects logs → Elasticsearch                            │ │
│  │                                                                   │ │
│  │  🔐 Security                                                      │ │
│  │  ├─ go-fullstack-tls (Secret - TLS cert/key)                     │ │
│  │  ├─ network-policy.yaml (optional - CNI dependent)               │ │
│  │  └─ ingress.yaml (SSL redirect, rate limit, CORS)                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow (Detailed)

### 1. HTTPS Request Flow
```
User Browser
    │
    │ 1. HTTPS Request
    │    https://go-fullstack.local:8443/
    ▼
Port Forward (Local Dev)
    │ kubectl port-forward 8443:443
    │
    ▼
NGINX Ingress Controller
    │
    ├─ 2. TLS Handshake
    │    └─ Load cert from Secret: go-fullstack-tls
    │
    ├─ 3. Decrypt HTTPS → HTTP
    │
    ├─ 4. Match Host Header
    │    └─ Host: go-fullstack.local ✓
    │
    ├─ 5. Match Path
    │    ├─ /api/*  → backend:8080
    │    └─ /*      → frontend:80
    │
    └─ 6. Forward HTTP request (ClusterIP)
         │
         ▼
    Frontend/Backend Service
         │
         ▼
    Target Pod
```

### 2. Backend API Request Example
```
Request:  https://go-fullstack.local:8443/api/v1/auth/login
            │
            ▼
Ingress:  Matches path /api → Routes to backend:8080
            │
            ▼
Backend:  Receives HTTP request at http://backend:8080/api/v1/auth/login
            │
            ├─ Go Fiber handles route /api/v1/auth/login
            ├─ Check Redis for session
            ├─ Query Vault for secrets
            ├─ Authenticate user
            └─ Return JSON response
            │
            ▼
Ingress:  Adds security headers, forwards response
            │
            ▼
Browser:  Receives HTTPS response with JWT token
```

### 3. Frontend Asset Loading
```
Request:  https://go-fullstack.local:8443/assets/index-xxxxx.js
            │
            ▼
Ingress:  Matches path / → Routes to frontend:80
            │
            ▼
Frontend: Nginx serves static file from /usr/share/nginx/html/assets/
            │
            ├─ Add Cache-Control headers (30 days)
            ├─ Add Security headers (HSTS, CSP, X-Frame-Options)
            └─ Return JavaScript file
            │
            ▼
Browser:  Executes JavaScript, renders React app
```

---

## 🌐 URL Routing Table

| URL Pattern | Destination | Description |
|-------------|-------------|-------------|
| `https://go-fullstack.local:8443/` | Frontend | React SPA index.html |
| `https://go-fullstack.local:8443/dashboard` | Frontend | SPA client-side routing |
| `https://go-fullstack.local:8443/assets/*` | Frontend | Static assets (JS, CSS, images) |
| `https://go-fullstack.local:8443/vite.svg` | Frontend | Static files |
| `https://go-fullstack.local:8443/health` | Frontend | Nginx health check |
| `https://go-fullstack.local:8443/api/v1/health` | Backend | Backend health check |
| `https://go-fullstack.local:8443/api/v1/auth/login` | Backend | Authentication endpoint |
| `https://go-fullstack.local:8443/api/v1/*` | Backend | All backend API routes |

**Note**: Path matching priority - `/api` is matched **before** `/` (order matters in ingress.yaml)

---

## 📊 Monitoring & Logging Flow

```
Application Pods (Frontend, Backend, Services)
    │
    │ stdout/stderr logs
    ▼
Fluent-bit DaemonSet (Runs on every node)
    │
    ├─ Parse logs (JSON, regex patterns)
    ├─ Filter by namespace/pod
    ├─ Add Kubernetes metadata
    │  └─ Pod name, namespace, labels, node
    │
    ▼
Elasticsearch (Index & Store)
    │
    ├─ Index: logs-go-fullstack-*
    ├─ Store: 30 days retention
    └─ Query: Full-text search, aggregations
    │
    ▼
Kibana (Visualize & Query)
    │
    ├─ Access: http://localhost:5601 (port-forward)
    │   or https://kibana.go-fullstack.local:8443/ (ingress)
    │
    ├─ Dashboards: Error rates, response times
    ├─ Discover: Real-time log streaming
    └─ Alerting: Error threshold notifications
```

### Log Flow Example
```
Backend Pod Logs:
2026/01/21 07:08:27 {"level":"INFO","method":"POST","path":"/api/v1/auth/login","status_code":401}
    │
    ▼
Fluent-bit:
{
  "timestamp": "2026-01-21T07:08:27Z",
  "level": "INFO",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "status_code": 401,
  "kubernetes": {
    "pod_name": "backend-576dc6f74f-ftdtc",
    "namespace": "go-fullstack",
    "container": "backend"
  }
}
    │
    ▼
Elasticsearch:
Indexed in logs-go-fullstack-2026.01.21
    │
    ▼
Kibana:
Visible in Discover with filters and visualizations
```

---

## 🔐 Security Architecture

### Multi-Layer Security Model
```
Layer 1: Transport Security (TLS/SSL)
┌────────────────────────────────────────────────┐
│  ✓ HTTPS Only (SSL Redirect enabled)          │
│  ✓ TLS 1.2+ (Modern cipher suites)            │
│  ✓ Certificate-based encryption                │
│  ✓ Self-signed cert (dev) / CA cert (prod)    │
└────────────────────────────────────────────────┘
                    ▼
Layer 2: Ingress Security
┌────────────────────────────────────────────────┐
│  ✓ Rate Limiting (20 req/sec)                 │
│  ✓ CORS Policy (go-fullstack.local only)      │
│  ✓ Path-based routing restrictions            │
│  ✓ Request size limits (100MB)                │
└────────────────────────────────────────────────┘
                    ▼
Layer 3: Frontend Security Headers
┌────────────────────────────────────────────────┐
│  ✓ HSTS (max-age=31536000)                    │
│  ✓ Content-Security-Policy                    │
│  ✓ X-Frame-Options: DENY                      │
│  ✓ X-Content-Type-Options: nosniff            │
│  ✓ X-XSS-Protection: 1; mode=block            │
│  ✓ Referrer-Policy                            │
│  ✓ Permissions-Policy                         │
└────────────────────────────────────────────────┘
                    ▼
Layer 4: Application Security
┌────────────────────────────────────────────────┐
│  ✓ JWT Authentication                         │
│  ✓ Session Management (Redis)                 │
│  ✓ Secrets Management (Vault)                 │
│  ✓ Input Validation                           │
│  ✓ SQL Injection Prevention                   │
│  ✓ XSS Prevention                             │
└────────────────────────────────────────────────┘
                    ▼
Layer 5: Network Policies (Optional)
┌────────────────────────────────────────────────┐
│  ✓ Pod-to-Pod communication rules             │
│  ✓ Namespace isolation                        │
│  ✓ Deny all by default                        │
│  ✓ Allow specific ports only                  │
└────────────────────────────────────────────────┘
```

### Security Headers (Frontend Nginx)
```nginx
# Added by frontend-nginx-configmap.yaml
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

---

## 🔌 Service Dependencies

```
Frontend Pod
    │
    ├─ Direct: None (serves static files)
    └─ Optional: backend:8080 (internal nginx proxy - not used with Ingress)

Backend Pod
    │
    ├─ Redis (Session storage)
    │   └─ redis:6379
    │
    ├─ Vault (Secrets management)
    │   └─ vault:8200
    │
    ├─ MinIO (Object storage)
    │   └─ minio:9000
    │
    └─ Elasticsearch (Logs - via Fluent-bit)
        └─ elasticsearch:9200

Kibana Pod
    │
    └─ Elasticsearch
        └─ elasticsearch:9200

Fluent-bit DaemonSet
    │
    └─ Elasticsearch
        └─ elasticsearch:9200
```

### Service Discovery (ClusterIP)
```yaml
# All services use ClusterIP (internal only)
frontend.go-fullstack.svc.cluster.local:80
backend.go-fullstack.svc.cluster.local:8080
redis.go-fullstack.svc.cluster.local:6379
vault.go-fullstack.svc.cluster.local:8200
minio.go-fullstack.svc.cluster.local:9000
elasticsearch.go-fullstack.svc.cluster.local:9200
kibana.go-fullstack.svc.cluster.local:5601
```

**External Access:** Only through Ingress Controller (HTTPS) or port-forward (local dev)

---

## 💾 Persistent Storage

| Component | Volume | Size | Purpose |
|-----------|--------|------|---------|
| Redis | redis-pvc | 8Gi | Session data, cache |
| MinIO | minio-pvc | 10Gi | Object storage (files, images) |
| Vault | Emptydir | - | Secrets (ephemeral - dev mode) |
| Elasticsearch | elasticsearch-pvc | 30Gi | Log storage |

**Note**: Vault uses dev mode (ephemeral storage). For production, use persistent storage.

---

## 🚀 Deployment Sequence

```
1. Create Namespace
   └─ kubectl apply -f namespace.yaml

2. Deploy Infrastructure (order matters)
   ├─ Redis (dependency for backend)
   ├─ Vault (dependency for backend)
   ├─ MinIO (dependency for backend)
   └─ Wait for all to be ready

3. Deploy ELK Stack
   ├─ Elasticsearch (dependency for Kibana & Fluent-bit)
   ├─ Wait for Elasticsearch ready
   ├─ Kibana + Init Job
   └─ Fluent-bit DaemonSet

4. Deploy Application
   ├─ Backend (depends on Redis, Vault, MinIO)
   │   └─ Init containers wait for dependencies
   ├─ Frontend (independent)
   └─ Wait for all pods ready

5. Configure Ingress
   ├─ Create TLS Secret (go-fullstack-tls)
   └─ Deploy Ingress (references TLS secret)

6. Verify
   ├─ kubectl get pods -n go-fullstack
   ├─ kubectl get ingress -n go-fullstack
   └─ Access https://go-fullstack.local:8443/
```

**Automation**: Use `apply-all.ps1` or `apply-all.sh` for automatic deployment

---

## 📋 Architecture Summary

### ✅ Key Design Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **TLS at Ingress** | Single point for certificate management | Backend pods use HTTP internally, simplified cert rotation |
| **ClusterIP Services** | Internal-only communication | All external traffic through Ingress (secure, controlled) |
| **Path-based routing** | Single domain with multiple backends | `/api` → backend, `/` → frontend, no subdomain needed |
| **No rewrite-target** | Backend already has `/api/v1` prefix | Preserves original URLs, simpler debugging |
| **Rate limiting** | 20 req/sec per IP | Prevents abuse, protects backend resources |
| **Network policies** | Pod-to-pod restrictions | Zero-trust model, only allow necessary traffic |
| **ELK centralized logging** | Single source of truth for logs | Fluent-bit collects from all pods, Kibana for analysis |
| **Content-hashed assets** | Vite build with hash in filename | Aggressive caching (30 days) without stale content |

### 🎯 Architectural Characteristics

- **High Availability**: Multiple replicas for frontend/backend
- **Security-First**: Multi-layer security (Ingress → Network Policy → Application)
- **Observability**: Centralized logging with ELK stack
- **Scalability**: Horizontal pod autoscaling ready
- **Cloud-Native**: Follows 12-factor app principles
- **Developer-Friendly**: Local development with port-forward, production with Ingress

### 📊 Current Status

| Component | Status | Replicas | Exposed Port |
|-----------|--------|----------|--------------|
| **Frontend** | ✅ Running | 2 | - |
| **Backend** | ✅ Running | 2 | - |
| **Ingress** | ✅ Active | N/A | 8443 (HTTPS) |
| **Redis** | ✅ Running | 1 | - |
| **Vault** | ✅ Running | 1 (dev) | - |
| **MinIO** | ✅ Running | 1 | - |
| **Elasticsearch** | ✅ Running | 1 | - |
| **Kibana** | ✅ Running | 1 | 5601 (port-forward) |
| **Fluent-bit** | ✅ Running | 1 per node | - |

**Access URLs:**
- **Application**: https://go-fullstack.local:8443/
- **Kibana**: `kubectl port-forward svc/kibana 5601:5601 -n go-fullstack`
- **MinIO Console**: `kubectl port-forward svc/minio 9001:9001 -n go-fullstack`

---

## 🔗 Related Documentation

- [START-HERE.md](START-HERE.md) - Quick start guide and prerequisites
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Detailed deployment steps and verification
- [SECURITY.md](SECURITY.md) - Security enhancements and best practices
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](README.md) - Overview and command reference

---

**Last Updated**: Architecture reflects current production deployment with SSL/TLS, security enhancements, and comprehensive monitoring.
