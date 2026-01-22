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
```sh
swag init -g cmd/api/main.go 
```

ดู API Spec
http://127.0.0.1:8080/redoc

Gen Dev Cert
```bash
choco install mkcert

mkcert -install

mkcert -cert-file dev.cert.pem -key-file dev.cert.key go-fullstack.local localhost 127.0.0.1

```