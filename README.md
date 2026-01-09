# go-fullstack

# run go
```sh
go run cmd/api/main.go
```

# run redis
```sh
docker run --name my_redis -p 6379:6379 -d redis:alpine
```

# redoc
```sh
go install github.com/swaggo/swag/cmd/swag@latest

go get -u github.com/swaggo/fiber-swagger
go get -u github.com/swaggo/swag
```

```sh
swag init -g cmd/api/main.go 
```