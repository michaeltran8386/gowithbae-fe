# ---------- Giai đoạn 1: build (Node) ----------
FROM node:24-alpine AS build
WORKDIR /app

# Cài thư viện trước để Docker cache lớp này khi chỉ sửa code
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# tsc -b && vite build → thư mục dist/ (bản build thật, không bật MSW mock)
RUN npm run build

# ---------- Giai đoạn 2: phục vụ file tĩnh (nginx) ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
