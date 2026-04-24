# Stage 1: builder (Vite build)
FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 시점 API URL 주입 (docker-compose args 로 전달)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime (serve로 정적 파일 서빙)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev serve
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
