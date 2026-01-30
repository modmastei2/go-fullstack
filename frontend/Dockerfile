# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# เลือก env (default = prod)
#ARG VITE_ENV=docker
#ENV VITE_ENV=${VITE_ENV}

# ถ้าใช้ .env.prod
RUN if [ "$VITE_ENV" = "docker" ]; then cp .env.docker .env; fi && npm run build

# =========================
# Stage 2: Runtime
# =========================
FROM nginx:alpine

# ลบ config เดิม
RUN rm /etc/nginx/conf.d/default.conf

# ใส่ nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
