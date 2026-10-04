#!/usr/bin/env bash
set -euo pipefail

# ── Accept image tag from GitHub Actions via SSM ──────────────
# Called by SSM as: deploy.sh <IMAGE_TAG>
# Example: deploy.sh 818655836450.dkr.ecr.eu-west-3.amazonaws.com/shipkit-backend:a3f2c1b

IMAGE_TAG="${1:-latest}"
# If no argument passed → fall back to latest
# In production: GitHub Actions always passes the exact SHA tag

REGION="eu-west-3"
APP_DIR="/opt/shipkit"
ENV_FILE="${APP_DIR}/.env"
COMPOSE_FILE="${APP_DIR}/docker/docker-compose-prod.yml"
ECR_REGISTRY="818655836450.dkr.ecr.eu-west-3.amazonaws.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ShipKit Deploy — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "  Image tag: ${IMAGE_TAG}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Authenticate Docker to ECR ────────────────────────
echo "[1/6] Authenticating to ECR..."
aws ecr get-login-password --region ${REGION} \
  | docker login \
    --username AWS \
    --password-stdin \
    ${ECR_REGISTRY}

# ── Step 2: Export image tag for docker compose ───────────────
echo "[2/6] Setting image tag: ${IMAGE_TAG}"
export BACKEND_IMAGE="${ECR_REGISTRY}/shipkit-backend:${IMAGE_TAG}"
export FRONTEND_IMAGE="${ECR_REGISTRY}/shipkit-frontend:${IMAGE_TAG}"

# ── Step 3: Fetch secrets from Parameter Store ────────────────
echo "[3/6] Fetching secrets from Parameter Store..."
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

# ── Step 4: Write .env file ───────────────────────────────────
echo "[4/6] Writing environment file..."
cat > ${ENV_FILE} << EOF
NODE_ENV=production
PORT=4000
DATABASE_PATH=/app/data/shipkit.db
PRODUCTS_PATH=/app/products
ADMIN_EMAIL=admin@shipkit.dev
CORS_ORIGIN=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
LICENSE_SECRET=${LICENSE_SECRET}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
GUMROAD_WEBHOOK_TOKEN=${GUMROAD_WEBHOOK_TOKEN}
BACKEND_IMAGE=${BACKEND_IMAGE}
FRONTEND_IMAGE=${FRONTEND_IMAGE}
EOF
chmod 600 ${ENV_FILE}

# ── Step 5: Deploy ────────────────────────────────────────────
echo "[5/6] Deploying containers..."
docker compose \
  -f ${COMPOSE_FILE} \
  --env-file ${ENV_FILE} \
  up -d --remove-orphans --pull always

# ── Step 6: Health check ──────────────────────────────────────
echo "[6/6] Verifying health..."
MAX_WAIT=60
WAITED=0
until docker inspect shipkit-backend \
  --format='{{.State.Health.Status}}' 2>/dev/null \
  | grep -q "healthy"; do
  sleep 3
  WAITED=$((WAITED + 3))
  if [ ${WAITED} -ge ${MAX_WAIT} ]; then
    echo "Health check timed out"
    docker compose -f ${COMPOSE_FILE} logs backend
    exit 1
  fi
done

echo "✅ Deployment complete — image: ${IMAGE_TAG}"






 