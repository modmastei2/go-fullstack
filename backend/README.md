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
docker compose --env-file .env.docker up --build
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