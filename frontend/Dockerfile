# ============================================
# STAGE 1: Builder — build the React app
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ============================================
# STAGE 2: Runtime — Nginx serves static files
# ============================================
FROM nginx:1.27-alpine AS runtime

# Upgrade all Alpine packages AND explicitly upgrade tiff to patch CVE-2026-4775
RUN apk upgrade --no-cache && apk add --no-cache --upgrade tiff

RUN rm /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf 2>/dev/null || true

COPY nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -u 1001 -G nginx-app nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx-app:nginx-app /var/run/nginx.pid

USER nginx-app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]