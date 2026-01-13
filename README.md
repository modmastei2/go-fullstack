# 🚀 Go

### 1. Dependency
```sh
cd backend

go mod tidy
```

### 2. Run go
```sh
go run cmd/api/main.go
```

# 🚀 React

### 1. Dependency
```sh
cd frontend

npm i
```

### 2. Run react
```sh
npm run dev
```

# 🚀 Redis

### 1. Run redis
```sh
docker run --name my_redis -p 6379:6379 -d redis:alpine
```

### 2. Download Redis Insight
https://redis.io/insight/

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