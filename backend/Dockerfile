# ======================================
# STAGE 1 : Builder 
# ======================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ===========================================
# STAGE 2 : Runtime - Lean production image 
# ===========================================
FROM node:20-alpine AS runtime

# Install dumb-init for proper signal handling 
RUN apk add --no-cache dumb-init  && \
    apk upgrade --no-cache

# Create a non-root user and group 
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodeapp
WORKDIR /app

# Copy Only the production node_modules from the builder stage
COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodeapp:nodejs . .

#
RUN mkdir -p data logs && chown nodeapp:nodejs data logs 

USER nodeapp

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]