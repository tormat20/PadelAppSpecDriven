# syntax=docker/dockerfile:1
# ── Padel Host — Frontend ─────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source and build
# VITE_API_BASE_URL is intentionally empty so api.ts resolves to the
# relative path "/api/v1" — Nginx will proxy those requests to the backend.
COPY . .
RUN VITE_API_BASE_URL="" npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Replace the default Nginx config with ours (SPA routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx runs as root by default inside its own image; it drops to nobody
# for worker processes automatically. No override needed here.
CMD ["nginx", "-g", "daemon off;"]
