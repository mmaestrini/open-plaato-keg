# ─── Stage 1: build the React app ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy dep manifests first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src
RUN npm run build

# ─── Stage 2: nginx serves the static bundle + proxies API ─────────────
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck (nginx is up if it serves index.html)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O- http://127.0.0.1/ >/dev/null || exit 1

EXPOSE 80
