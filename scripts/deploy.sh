#!/usr/bin/env bash
# =============================================================
# ShipKit EKS Deploy Script
# Called by: GitHub Actions CD pipeline
# Usage: deploy.sh <IMAGE_TAG>
# Example: deploy.sh e752253-29
# =============================================================

set -euo pipefail

IMAGE_TAG="${1:-}"

if [ -z "$IMAGE_TAG" ]; then
  echo " IMAGE_TAG is required"
  echo "   Usage: $0 <image-tag>"
  exit 1
fi
REGION="eu-west-3"
CLUSTER_NAME="shipkit-eks"
NAMESPACE="shipkit"
HELM_CHART_PATH="./helm/shipkit"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ShipKit EKS Deploy"
echo "  Image tag: ${IMAGE_TAG}"
echo "  Cluster:   ${CLUSTER_NAME}"
echo "  Namespace: ${NAMESPACE}"
echo "  Time:      $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Update kubeconfig ─────────────────────────────────
echo "[1/4] Configuring kubectl for EKS..."
aws eks update-kubeconfig \
  --name ${CLUSTER_NAME} \
  --region ${REGION}
echo "      ✅ kubectl configured"
# ── Step 2: Verify cluster connectivity ───────────────────────
echo "[2/4] Verifying cluster connectivity..."
kubectl cluster-info --request-timeout=10s > /dev/null
echo "      ✅ Cluster reachable"

# ── Step 2.5: Back up the database before deploy ──────────────
echo "[2.5/4] Backing up database..."
S3_BUCKET="shipkit-backups-818655836450"
BACKUP_FILE="$(date +%Y%m%d-%H%M%S)-before-${IMAGE_TAG}.db"

if kubectl get pod -n ${NAMESPACE} -l app=shipkit-backend \
     --field-selector=status.phase=Running -o name 2>/dev/null | grep -q pod; then

  kubectl exec -i -n ${NAMESPACE} deploy/shipkit-backend -- sh -c 'cd /app && node -' <<'JS'
const Database = require('better-sqlite3');
new Database('/app/data/shipkit.db').backup('/tmp/backup.db')
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
JS

  kubectl exec -n ${NAMESPACE} deploy/shipkit-backend -- cat /tmp/backup.db > /tmp/${BACKUP_FILE}
  kubectl exec -n ${NAMESPACE} deploy/shipkit-backend -- rm -f /tmp/backup.db

  [ -s /tmp/${BACKUP_FILE} ] || { echo "       Backup file is empty"; exit 1; }
  aws s3 cp /tmp/${BACKUP_FILE} \
    s3://${S3_BUCKET}/pre-deploy/${BACKUP_FILE} --region ${REGION}
  rm -f /tmp/${BACKUP_FILE}
  echo "      ✅ Backup saved: pre-deploy/${BACKUP_FILE}"
else
  echo "      ⚠️  No running backend pod, backup skipped"
fi
# ── Step 3: Deploy with Helm ──────────────────────────────────
echo "[3/4] Deploying with Helm..."
helm upgrade --install shipkit ${HELM_CHART_PATH} \
  --namespace ${NAMESPACE} \
  --create-namespace \
  -f ${HELM_CHART_PATH}/values-production.yaml \
  --set backend.image.tag=${IMAGE_TAG} \
  --set frontend.image.tag=${IMAGE_TAG} \
  --atomic \
  --timeout 5m \
  --wait
# --atomic:  if deploy fails → automatic rollback to previous release
# --wait:    wait until all pods pass readiness probes
# --timeout: give pods 5 minutes to become healthy

echo "       Helm release deployed"

# ── Step 4: Verify deployment ─────────────────────────────────
echo "[4/4] Verifying deployment..."
# Show pod status
kubectl get pods -n ${NAMESPACE}

# Show Helm release history
helm history shipkit -n ${NAMESPACE} --max 5

# Get ALB DNS for health check
ALB_DNS=$(kubectl get ingress shipkit-ingress \
  -n ${NAMESPACE} \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -n "$ALB_DNS" ]; then
  echo "      Checking health at: http://${ALB_DNS}/api/health"
  for i in $(seq 1 6); do
    HTTP=$(curl -s -o /dev/null \
      -w "%{http_code}" \
      --max-time 10 \
      "http://${ALB_DNS}/api/health" || echo "000")

    if [ "$HTTP" = "200" ]; then
      echo "      ✅ Application healthy"
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  ✅ Deployment complete!"
      echo "  Image:    ${IMAGE_TAG}"
      echo "  App URL:  http://${ALB_DNS}"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      exit 0
    fi

    echo "      Attempt ${i}/6 — HTTP ${HTTP}"
    sleep 10
  done
  echo "       Health check failed after 60 seconds"
  exit 1
else
  echo "        ALB not ready yet  check ingress status manually"
  echo "      kubectl get ingress -n ${NAMESPACE}"
fi