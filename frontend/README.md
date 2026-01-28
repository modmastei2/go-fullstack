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
docker build --build-arg VITE_ENV=docker -t frontend:1.0 .
```

### Serve Docker
```sh
docker compose -p app --env-file .env.docker up -d --build
```