# 🚀 React

### Setup Dependency
```sh
cd frontend

npm i
```

### Run react
```sh
npm run dev
```

### Build Image [Skip if use Serve Docker]
```sh
docker build -t frontend:1.0 .
```

### Serve Docker
```sh
docker compose --env-file .env.prod up --build
```