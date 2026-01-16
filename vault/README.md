# 🚀 Vault

### Serve Vault

```sh
docker compose up -d
```

## 1. Init Vault (ทำครั้งเดียว)
```sh
docker exec -it vault sh
```

```sh
vault operator init

Output:
Unseal Key 1: xxxxx
Unseal Key 2: xxxxx
Unseal Key 3: xxxxx
Unseal Key 4: xxxxx
Unseal Key 5: xxxxx

Initial Root Token: s.xxxxx
```

## 2. Unseal Vault (ต้องทำทุกครั้งที่ Vault restart)
จะได้ Unseal Key มา

```sh
vault operator unseal
```

ใส่ key ทีละอัน ทำ 3 รอบ

### เช็คสถานะ ต้องเห็น Sealed: false

```sh
vault status
```

## 3. Login เข้า Vault

ใส่ Root Token

```sh
vault login

vault login <root_token>
```

## 4. เปิด KV และใส่ Secret
```sh
vault secrets enable -path=secret kv-v2
```

```sh
vault kv put secret/fiber-app \
  jwt_secret="e4dc8542b2a656613680dd0ff5f87b8f79041b4def0f79717469fe17a4d7a6b9" \
  db_password="superuser01"
```

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

ลบ Secret

```sh
vault kv delete secret/fiber-app
```
เรียกดู
```sh
vault kv get secret/fiber-app
```

## 5. สร้าง Policy (กำหนดสิทธิ์)

```sh
vi fiber-policy.hcl

path "secret/data/fiber-app" {
  capabilities = ["read"]
}
```

```
กด I สำหรับ Insert
กด Esc เพื่อออกโหมดแทรก
พิมพ์ :wq + Enter เพื่อบันทึกและออก
```

```sh
vault policy write fiber-policy fiber-policy.hcl

Output:
Success! Uploaded policy: fiber-policy
```

## 6. สร้าง AppRole
```sh
vault auth enable approle
```

```sh
vault write auth/approle/role/fiber-backend \
  token_policies="fiber-policy" \
  token_ttl=1h

Output:
Success! Data written to: auth/approle/role/fiber-backend
```

ดึง Role Id
```sh
vault read auth/approle/role/fiber-backend/role-id
```

สร้าง secret_id
```sh
vault write -f auth/approle/role/fiber-backend/secret-id
```

เก็บ role_id กับ secret_id และ Initial Root Token ให้ดี

# ใช้ผ่าน Web UI (ถนัด UI)
http://localhost:8200

Login → Token  
Secrets → secret/fiber-app  
Access → AppRole / Policies

# HA Mode

```sh
ui = true
disable_mlock = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_disable = true
}

storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-1"   # เปลี่ยนตาม node
}

api_addr     = "http://10.0.0.1:8200"
cluster_addr = "http://10.0.0.1:8201"

```