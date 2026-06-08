# ☸️ Kubernetes Starter Pack — ShipKit

Production-ready Kubernetes manifests and Helm chart for deploying any containerized app to EKS or any K8s cluster.

---

## 📦 What's Inside

```
kubernetes-starter-pack/
├── manifests/
│   ├── namespace.yaml        # Namespace + ResourceQuota + LimitRange + RBAC
│   ├── deployment.yaml       # Deployment + Service + Ingress (TLS)
│   └── hpa-pdb-netpol.yaml   # HPA + PodDisruptionBudget + NetworkPolicy
├── helm/
│   └── app/
│       ├── Chart.yaml
│       ├── values.yaml       # All tuneable settings in one place
│       └── templates/        # Helm-templated versions of all manifests
└── scripts/
    ├── cluster-init.sh       # Bootstrap a fresh cluster end-to-end
    └── health-check.sh       # Cron-ready health checker + Slack alerts
```

---

## ⚡ Quick Start

### Prerequisites

- `kubectl` connected to your cluster
- `helm` v3+
- An EKS/GKE/AKS cluster (or local k3s/kind)

### Option A — Raw manifests

```bash
# 1. Edit namespace, image, and domain in the YAML files
# 2. Apply
kubectl apply -f manifests/namespace.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/hpa-pdb-netpol.yaml
```

### Option B — Helm (recommended)

```bash
# 1. Copy and edit values
cp helm/app/values.yaml helm/app/my-values.yaml
# Edit: image.repository, image.tag, ingress.host

# 2. Install
helm install my-app ./helm/app \
  --namespace production \
  --create-namespace \
  --values helm/app/my-values.yaml

# 3. Upgrade
helm upgrade my-app ./helm/app \
  --namespace production \
  --values helm/app/my-values.yaml
```

---

## 🏗️ Bootstrap a Fresh Cluster

```bash
# Bootstrap cert-manager, ingress-nginx, ArgoCD, monitoring
export ACME_EMAIL="you@example.com"
bash scripts/cluster-init.sh

# Dry run first to see what would be installed
bash scripts/cluster-init.sh --dry-run
```

---

## 🔍 Health Monitoring

```bash
# Run manually
NAMESPACE=production bash scripts/health-check.sh

# With Slack alerts
SLACK_WEBHOOK="https://hooks.slack.com/services/..." \
NAMESPACE=production \
bash scripts/health-check.sh

# Add to cron (every 5 minutes)
*/5 * * * * NAMESPACE=production SLACK_WEBHOOK="..." /opt/shipkit/health-check.sh
```

---

## 🔐 Security Features Included

| Feature | Implementation |
|---|---|
| Non-root containers | `runAsNonRoot: true`, `runAsUser: 1000` |
| Read-only filesystem | `readOnlyRootFilesystem: true` |
| Dropped capabilities | `capabilities.drop: [ALL]` |
| Network isolation | Default-deny NetworkPolicy |
| Resource limits | CPU + memory requests and limits |
| Pod disruption | PodDisruptionBudget (min 1 available) |
| Autoscaling | HPA on CPU + memory (2–10 replicas) |
| TLS | cert-manager + Let's Encrypt ClusterIssuer |
| RBAC | Least-privilege ServiceAccount + Role |
| Secrets | Referenced from Kubernetes Secrets (never hardcoded) |

---

## 🔧 Customization

Edit `helm/app/values.yaml`:

```yaml
image:
  repository: your-registry/your-app   # ← your image
  tag: "1.2.3"

ingress:
  host: yourdomain.com                  # ← your domain

resources:
  requests:
    cpu: "200m"
    memory: "256Mi"

autoscaling:
  minReplicas: 3
  maxReplicas: 20
```

---

## 📧 Support

Stuck? Email **hello@shipkit.dev** — response within 24 hours.
