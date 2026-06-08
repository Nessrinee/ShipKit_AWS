#!/usr/bin/env bash
# cluster-init.sh — Bootstrap a fresh EKS/K8s cluster with all required tools
# Usage: bash cluster-init.sh [--dry-run]
# Requirements: kubectl, helm, aws cli (for EKS), curl

set -euo pipefail

# ── Colors ─────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true && info "DRY RUN MODE — no changes will be made"

run() {
  if $DRY_RUN; then echo "  [dry-run] $*"; else "$@"; fi
}

# ── Pre-flight checks ───────────────────────────────────────────────
info "Checking prerequisites..."
for cmd in kubectl helm; do
  command -v "$cmd" &>/dev/null || error "$cmd is not installed"
done

kubectl cluster-info &>/dev/null || error "kubectl cannot reach the cluster. Check your kubeconfig."
info "Cluster reachable ✓"

# ── Helm repo setup ─────────────────────────────────────────────────
info "Adding Helm repositories..."
run helm repo add ingress-nginx  https://kubernetes.github.io/ingress-nginx
run helm repo add cert-manager   https://charts.jetstack.io
run helm repo add argo            https://argoproj.github.io/argo-helm
run helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
run helm repo update
info "Helm repos updated ✓"

# ── cert-manager ────────────────────────────────────────────────────
info "Installing cert-manager..."
run kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.crds.yaml
run helm upgrade --install cert-manager cert-manager/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=false \
  --wait --timeout=120s
info "cert-manager installed ✓"

# ── ingress-nginx ────────────────────────────────────────────────────
info "Installing ingress-nginx..."
run helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --wait --timeout=180s
info "ingress-nginx installed ✓"

# ── ArgoCD ──────────────────────────────────────────────────────────
info "Installing ArgoCD..."
run kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
run kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
info "ArgoCD installed ✓"

# ── kube-prometheus-stack ────────────────────────────────────────────
info "Installing monitoring stack..."
run helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=change-me \
  --set prometheus.prometheusSpec.retention=15d \
  --wait --timeout=300s
info "Monitoring stack installed ✓"

# ── Apply namespaces ──────────────────────────────────────────────────
info "Creating application namespaces..."
for ns in production staging; do
  run kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
done

# ── ClusterIssuer for Let's Encrypt ──────────────────────────────────
ACME_EMAIL="${ACME_EMAIL:-admin@yourdomain.com}"
info "Creating ClusterIssuer for Let's Encrypt (email: $ACME_EMAIL)..."
if ! $DRY_RUN; then
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${ACME_EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
fi
info "ClusterIssuer created ✓"

echo ""
info "════════════════════════════════════════════"
info "  Cluster bootstrap complete! ✓"
info "  Next: kubectl apply -f manifests/"
info "════════════════════════════════════════════"
