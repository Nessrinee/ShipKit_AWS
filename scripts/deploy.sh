#!/usr/bin/env bash
# =============================================================
# ShipKit Production Deploy Script
# Runs on EC2 instance via GitHub Actions SSM
# =============================================================

set -euo pipefail
# set -e  → exit immediately if any command fails
# set -u  → treat unset variables as errors
# set -o pipefail → pipe fails if any command in pipe fails
# Together: no silent failures, no unexpected behavior

# ── Configuration ─────────────────────────────────────────────
REGION="eu-west-3"
APP_DIR="/opt/shipkit"
ENV_FILE="${APP_DIR}/.env"
COMPOSE_FILE="${APP_DIR}/docker/docker-compose.prod.yml"
ECR_REGISTRY="YOUR_ACCOUNT_ID.dkr.ecr.eu-west-3.amazonaws.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ShipKit Deploy — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Authenticate Docker to ECR ────────────────────────
echo "[1/6] Authenticating to ECR..."
aws ecr get-login-password --region ${REGION} \
  | docker login \
    --username AWS \
    --password-stdin \
    ${ECR_REGISTRY}
echo "      ✅ ECR authentication successful"

# ── Step 2: Pull latest images ────────────────────────────────
echo "[2/6] Pulling latest images from ECR..."
docker pull ${ECR_REGISTRY}/shipkit-backend:latest
docker pull ${ECR_REGISTRY}/shipkit-frontend:latest
echo "      ✅ Images pulled"

# ── Step 3: Fetch secrets from Parameter Store ────────────────
echo "[3/6] Fetching secrets from Parameter Store..."

# Fetch each secret individually using AWS CLI
JWT_SECRET=$(aws ssm get-parameter \
  --name "/shipkit/prod/jwt-secret" \
  --with-decryption \
  --region ${REGION} \
  --query "Parameter.Value" \
  --output text)

JWT_REFRESH_SECRET=$(aws ssm get-parameter \
  --name "/shipkit/prod/jwt-refresh-secret" \
  --with-decryption \
  --region ${REGION} \
  --query "Parameter.Value" \
  --output text)

LICENSE_SECRET=$(aws ssm get-parameter \
  --name "/shipkit/prod/license-secret" \
  --with-decryption \
  --region ${REGION} \
  --query "Parameter.Value" \
  --output text)

ADMIN_PASSWORD=$(aws ssm get-parameter \
  --name "/shipkit/prod/admin-password" \
  --with-decryption \
  --region ${REGION} \
  --query "Parameter.Value" \
  --output text)

GUMROAD_WEBHOOK_TOKEN=$(aws ssm get-parameter \
  --name "/shipkit/prod/gumroad-webhook-token" \
  --with-decryption \
  --region ${REGION} \
  --query "Parameter.Value" \
  --output text)

echo "      ✅ Secrets fetched"

# ── Step 4: Write .env file ───────────────────────────────────
echo "[4/6] Writing environment file..."

# Write all secrets to .env file
# This file is NEVER committed to git
# Created fresh on every deployment
cat > ${ENV_FILE} << EOF
# ShipKit Production Environment
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# DO NOT COMMIT THIS FILE

NODE_ENV=production
PORT=4000
DATABASE_PATH=/app/data/shipkit.db
PRODUCTS_PATH=/app/products
ADMIN_EMAIL=admin@shipkit.dev
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
LICENSE_SECRET=${LICENSE_SECRET}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
GUMROAD_WEBHOOK_TOKEN=${GUMROAD_WEBHOOK_TOKEN}
EOF

# Lock down permissions immediately
# Only the deploy user can read this file
chmod 600 ${ENV_FILE}
echo "      ✅ Environment file written (chmod 600)"

# ── Step 5: Deploy with Docker Compose ────────────────────────
echo "[5/6] Deploying containers..."

docker compose -f ${COMPOSE_FILE} \
  --env-file ${ENV_FILE} \
  up -d --remove-orphans

echo "      ✅ Containers deployed"

# ── Step 6: Verify deployment ──────────────────────────────────
echo "[6/6] Verifying deployment..."

# Wait for backend healthcheck to pass
MAX_WAIT=60
WAITED=0
until docker inspect shipkit-backend \
  --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; do
  sleep 3
  WAITED=$((WAITED + 3))
  if [ ${WAITED} -ge ${MAX_WAIT} ]; then
    echo "      ❌ Backend health check timed out after ${MAX_WAIT}s"
    docker compose -f ${COMPOSE_FILE} logs backend
    exit 1
  fi
done

echo "      ✅ Backend is healthy"

# Quick API check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:4000/api/health)

if [ "${HTTP_CODE}" != "200" ]; then
  echo "      ❌ API returned HTTP ${HTTP_CODE}"
  exit 1
fi

echo "      ✅ API responding correctly"

# ── Cleanup ───────────────────────────────────────────────────
echo "Cleaning up old images..."
docker image prune -f --filter "until=24h"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment complete!"
echo "  Backend:  http://localhost:4000/api/health"
echo "  Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
