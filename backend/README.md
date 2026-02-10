# 🚀 Go

### Setup Dependency
```sh
cd backend

go mod download
```

### Run go
```sh
go run cmd/api/main.go
```

### Build Image [Skip if use Serve Docker]
```sh
docker build -t backend:1.0 .
```

### Serve Docker
```sh
docker compose -p app --env-file .env.docker up -d --build
```

___
# Redoc

### Install
```sh
go install github.com/swaggo/swag/cmd/swag@latest

go get -u github.com/swaggo/fiber-swagger
go get -u github.com/swaggo/swag
```

### Gen Spec

**วิธีที่ 1: ใช้คำสั่ง swag โดยตรง (ถ้า PATH ตั้งค่าเรียบร้อยแล้ว)**
```sh
swag init -g cmd/api/main.go 
```

**วิธีที่ 2: ใช้ full path (ถ้าคำสั่งข้างบนไม่ได้)**
```cmd
# Windows
%USERPROFILE%\go\bin\swag init -g cmd/api/main.go
```
```sh
# Linux/Mac
~/go/bin/swag init -g cmd/api/main.go
```

**เพิ่ม swag เข้า PATH ถาวร (แนะนำ - ทำครั้งเดียว):**
```cmd
# Windows (PowerShell)
setx PATH "%PATH%;%USERPROFILE%\go\bin"

# จากนั้นเปิด terminal ใหม่แล้วใช้คำสั่งวิธีที่ 1 ได้เลย
```
```sh
# Linux/Mac (เพิ่มใน ~/.bashrc หรือ ~/.zshrc)
export PATH=$PATH:~/go/bin
```

ดู API Spec:
- Swagger UI: http://127.0.0.1:8080/swagger/index.html
- ReDoc: http://127.0.0.1:8080/redoc

Gen Dev Cert
```bash
choco install mkcert

mkcert -install

mkcert -cert-file dev.cert.pem -key-file dev.cert.key go-fullstack.local localhost 127.0.0.1

```