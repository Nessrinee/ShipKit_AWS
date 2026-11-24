# ======================================
# STAGE 1 : Builder
# ======================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install Python and C/C++ build toolchain required by node-gyp (e.g., better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ===========================================
# STAGE 2 : Runtime - Lean production image
# ===========================================
FROM node:20-alpine AS runtime

RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache

RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeapp

WORKDIR /app

COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs package.json ./
COPY --chown=nodeapp:nodejs src ./src

RUN mkdir -p data logs

USER nodeapp

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]