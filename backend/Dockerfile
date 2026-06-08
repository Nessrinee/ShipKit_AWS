# ── Stage 1: deps ────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs

WORKDIR /app
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs . .

RUN mkdir -p data logs && chown nodeapp:nodejs data logs

USER nodeapp
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
