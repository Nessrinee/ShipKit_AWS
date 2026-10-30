# 🚀 ShipKit 
<div align="center">

<img src="https://img.shields.io/badge/ShipKit-v2.0-00ff9d?style=for-the-badge&logo=rocket&logoColor=white" alt="ShipKit"/>

# 🚀 ShipKit

### Production-Ready DevOps Digital Product Store

**A full-stack, secure e-commerce platform for selling DevOps infrastructure bundles**
*(Terraform templates · Helm charts · Bash scripts · Docker Compose stacks)*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Manifests-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Audited-00ff9d?style=flat-square&logo=shield&logoColor=white)](#-security-architecture)

<br/>

[**Live Demo**](https://shipkit.dev) · [**Documentation**](#-documentation) · [**Quick Start**](#-quick-start) · [**API Reference**](#-api-reference)

---

</div>

## 📌 Overview

**ShipKit** is a production-hardened digital product store built specifically for selling DevOps infrastructure templates. It handles the complete customer journey — from browsing products to secure payment processing and license-key-protected file delivery.

> **Built as a real commercial product** with JWT authentication, HMAC-signed license keys, Gumroad payment integration, atomic database transactions, full Docker + Kubernetes deployment, and a 40+ test suite covering all critical paths.

---

## ✨ Features

### 🛍️ Store & Products
- Clean React storefront with product listings, detail pages, and code previews
- Three production-ready DevOps bundles included as real, usable content
- Mobile-responsive design with Tailwind CSS
- Gumroad overlay checkout — customers never leave your site

### 🔐 Security (Production-Grade)
- JWT authentication with 15-minute access tokens + 7-day refresh tokens
- HMAC-SHA256 signed license keys (timing-safe verification)
- Signed, expiring download tokens (10-minute TTL)
- Tiered rate limiting (global · auth · downloads · contact)
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- Whitelist-based CORS, HPP protection, 16KB body size limit
- Non-root Docker containers with read-only filesystems
- Path traversal protection on all file operations

### 💳 Payment System
- Gumroad webhook integration with token verification
- **Atomic SQLite transactions** — no partial license writes
- **Idempotency** — duplicate webhook calls never create duplicate licenses
- Payment audit trail (`payment_events` table)
- Download quota enforcement with atomic counter (race condition proof)
- Complete payment event logging for dispute resolution

### ⚙️ DevOps & Infrastructure
- Multi-stage Docker builds (lean ~150MB images vs ~600MB naive)
- Docker Compose for dev and production
- Full Kubernetes manifests with liveness/readiness probes, resource limits, NetworkPolicy, PDB
- GitHub Actions CI/CD (lint → security scan → Docker build → VPS deploy)
- Zero-downtime rolling deployments
- Monitoring cron with Slack alerts

---

## 🏗️ Architecture

```
┌─────────────┐     HTTPS      ┌─────────────────────────────────────┐
│   Browser   │ ─────────────► │              Nginx                  │
│  (React SPA)│                │  SSL termination · Rate limiting    │
└─────────────┘                └──────┬──────────────┬───────────────┘
                                      │              │
                               /api/* │              │ /*
                                      ▼              ▼
                         ┌────────────────┐  ┌──────────────────┐
                         │  Express.js    │  │  React (Nginx)   │
                         │  Backend API   │  │  Static Files    │
                         │  Port 4000     │  │  Port 80         │
                         └───────┬────────┘  └──────────────────┘
                                 │
                    ┌────────────┼─────────────┐
                    ▼            ▼             ▼
             ┌────────────┐ ┌────────┐ ┌───────────┐
             │  SQLite DB │ │ Files  │ │  Gumroad  │
             │  (WAL mode)│ │products│ │  Webhooks │
             └────────────┘ └────────┘ └───────────┘
```

### Payment Flow

```
Customer pays on Gumroad
        ↓
Gumroad fires webhook → POST /api/webhooks/gumroad?token=SECRET
        ↓
Backend: validate token → verify seller → check idempotency
        ↓
Atomic transaction: INSERT license + INSERT payment_event
        ↓
Customer receives license key via Gumroad receipt email
        ↓
Customer visits /download → enters email + key
        ↓
HMAC verify → DB lookup → quota check → 10-min signed token
        ↓
GET /api/downloads/:token → stream ZIP (personalized with license.txt)
        ↓
UPDATE download_count WHERE count < max  ← atomic quota enforcement
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, DOMPurify |
| **Backend** | Node.js 20, Express.js, Better-SQLite3, JWT, bcryptjs, Joi, Helmet |
| **Database** | SQLite (WAL mode, foreign keys, versioned migrations) |
| **Auth** | JWT (access 15min + refresh 7d), bcrypt cost-12, HMAC-SHA256 |
| **Payments** | Gumroad webhooks, atomic transactions, idempotency checks |
| **Testing** | Jest, Supertest, in-memory SQLite (40+ test cases) |
| **DevOps** | Docker multi-stage, Docker Compose, GitHub Actions CI/CD |
| **K8s** | Deployments, Services, Ingress, HPA, NetworkPolicy, PDB |
| **Monitoring** | Winston structured logging, Prometheus annotations, Slack alerts |

---

## 📦 Included Product Bundles

| Bundle | Price | Contents |
|--------|-------|----------|
| **☸️ Kubernetes Starter Pack** | $49 | Manifests (namespace, RBAC, HPA, PDB, NetworkPolicy), Helm chart, cluster-init.sh, health-check.sh with Slack alerts |
| **🏗️ Terraform AWS Kit** | $39 | VPC module (multi-AZ, flow logs), EKS module (KMS, IRSA, IMDSv2), multi-env Terragrunt structure, remote state |
| **🐳 Docker Compose Bundle** | $19 | Postgres HA (primary + replica + pgBouncer), Nginx + Certbot auto-SSL, full monitoring stack (Prometheus + Grafana + Alertmanager) |

---

## ⚡ Quick Start

### Prerequisites

```bash
node --version   # v18+ required (v20 recommended)
npm --version    # v9+ required
```

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/shipkit.git
cd shipkit
```

### 2. Generate secrets

```bash
node -e "
const c = require('crypto');
console.log('JWT_SECRET='         + c.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + c.randomBytes(64).toString('hex'));
console.log('LICENSE_SECRET='     + c.randomBytes(32).toString('hex'));
"
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Paste the generated secrets + fill in ADMIN_EMAIL and ADMIN_PASSWORD
```

```env
NODE_ENV=development
PORT=4000
JWT_SECRET=<generated-64-char-hex>
JWT_REFRESH_SECRET=<generated-64-char-hex>
LICENSE_SECRET=<generated-32-char-hex>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword!
CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/shipkit.db
PRODUCTS_PATH=../products
GUMROAD_WEBHOOK_TOKEN=local-dev-token
```

```bash
cp frontend/.env.example frontend/.env
# frontend/.env contains: VITE_API_URL=http://localhost:4000/api
```

### 4. Install dependencies

```bash
# Terminal 1 — Backend
cd backend && npm install

# Terminal 2 — Frontend
cd frontend && npm install
```

### 5. Start the application

```bash
# Terminal 1
cd backend && npm run dev
# Expected: "ShipKit API running on port 4000 [development]"

# Terminal 2
cd frontend && npm run dev
# Expected: "VITE ready — http://localhost:5173/"
```

### 6. Open in browser

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | 🛍️ Store frontend |
| `http://localhost:4000/api/health` | 🔌 API health check |
| `http://localhost:4000/api/products` | 📦 Product listing |
| `http://localhost:5173/download` | ⬇️ Download portal |

---

## 🧪 Testing

```bash
cd backend
npm test                    # run all 40+ tests
npm test -- --coverage      # with coverage report
npm test -- --watch         # watch mode during development
```

**What's tested:**
- ✅ License key HMAC cryptography (generation, verification, crash scenarios)
- ✅ Auth timing attack prevention (bcrypt dummy hash)
- ✅ JWT sign/verify/expiry
- ✅ Payment webhook idempotency + audit logging
- ✅ Download quota race condition protection
- ✅ Path traversal prevention
- ✅ SQL injection rejection
- ✅ Oversized payload rejection
- ✅ Protected route access control

---

## 🔌 API Reference

### Public Endpoints

```
GET  /api/health                  Health check
GET  /api/products                List all products
GET  /api/products/:slug          Single product with preview
POST /api/downloads/verify        Verify license key → get download token
GET  /api/downloads/:token        Stream product ZIP (10-min token)
POST /api/contact                 Contact form submission
POST /api/webhooks/gumroad        Gumroad payment webhook
```

### Admin Endpoints (JWT required)

```
POST /api/auth/login              Admin login → access + refresh tokens
POST /api/auth/refresh            Refresh access token
POST /api/admin/licenses/generate Generate license key manually
GET  /api/admin/licenses          List all licenses (paginated)
GET  /api/admin/stats             Dashboard statistics
```

### Example: Generate a test license

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 2. Generate license key
curl -s -X POST http://localhost:4000/api/admin/licenses/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"kubernetes-starter-pack","email":"customer@test.com"}' \
  | python3 -m json.tool
```

---

## 🐳 Docker Deployment

### Development

```bash
docker compose -f docker/docker-compose.yml up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

### Production (VPS)

```bash
# 1. Configure production .env (update CORS_ORIGIN, NODE_ENV=production)
# 2. Get SSL certificate
certbot certonly --standalone -d yourdomain.com --email you@email.com --agree-tos

# 3. Deploy
docker compose -f docker/docker-compose.prod.yml up -d --build

# 4. Verify
curl https://yourdomain.com/api/health
```

**Production resource limits (Docker Compose):**

| Container | CPU | RAM |
|-----------|-----|-----|
| Backend | 50% of 1 core | 256MB |
| Frontend | 20% of 1 core | 64MB |
| Nginx | — | 64MB |

---

## ☸️ Kubernetes Deployment

```bash
# 1. Create namespace and secrets
kubectl apply -f k8s/shipkit.yaml

# 2. Populate secrets (never commit real values)
kubectl create secret generic shipkit-secrets \
  --from-env-file=backend/.env \
  -n shipkit

# 3. Verify
kubectl get pods -n shipkit
kubectl get ingress -n shipkit
```

**K8s features included:**
- Liveness, readiness, and startup probes
- Resource requests and limits
- HorizontalPodAutoscaler (frontend: 2–6 replicas)
- NetworkPolicy (default deny-all + explicit allows)
- PodDisruptionBudget (min 1 frontend pod during drains)
- Non-root securityContext with dropped capabilities
- Separate ServiceAccount with `automountServiceAccountToken: false`

---

## 🔐 Security Architecture

| Layer | Implementation | Prevents |
|-------|---------------|---------|
| Transport | HTTPS + HSTS preload | MITM, traffic sniffing |
| Headers | Helmet.js (11 headers) | XSS, clickjacking, MIME sniffing |
| CORS | Whitelist-based origin validation | Cross-origin API abuse |
| Auth | JWT 15min access + 7d refresh | Session hijacking |
| Passwords | bcrypt cost-12 + dummy hash | Brute force, timing oracle |
| License keys | HMAC-SHA256 + timing-safe compare | Key forgery, timing attacks |
| Download tokens | Signed + 10min TTL | Link sharing, replay |
| Rate limiting | Tiered per-route (global/auth/download) | Brute force, DoS |
| Input validation | Joi schema on all endpoints | Injection, unexpected types |
| File access | Path traversal guard + resolved-path check | Directory traversal |
| Payments | Webhook token + seller verify + idempotency | Fake payments, replay |
| Docker | Non-root UID 1001, read-only FS | Container escape |
| Secrets | `.env` only, never in image or code | Credential leakage |

---

## 📁 Project Structure

```
shipkit/
├── backend/                    # Express.js API
│   └── src/
│       ├── config/             # Centralized config from .env
│       ├── data/products.js    # Product catalog (single source of truth)
│       ├── db/database.js      # SQLite + versioned migrations + seeding
│       ├── middleware/         # Auth, rate limiting, error handler
│       ├── routes/
│       │   ├── admin.js        # Admin-only routes (auth required globally)
│       │   ├── auth.js         # Login + token refresh
│       │   ├── downloads.js    # License verify + secure ZIP streaming
│       │   ├── products.js     # Public product listing
│       │   ├── webhooks.js     # Gumroad payment webhook
│       │   └── contact.js      # Contact form
│       ├── utils/
│       │   ├── licenseKey.js   # HMAC key generation + verification
│       │   ├── jwt.js          # Token sign/verify
│       │   └── logger.js       # Winston structured logging
│       └── __tests__/          # 40+ Jest test cases
│           └── shipkit.test.js
│
├── frontend/                   # React + Vite + Tailwind
│   └── src/
│       ├── components/         # Layout, ProductCard, ErrorBoundary, UI kit
│       ├── hooks/              # useProducts (with 5-min cache)
│       ├── lib/                # Axios API client, tag utilities
│       └── pages/              # Home, Product, Download, About, Contact
│
├── products/                   # Downloadable bundles (real content)
│   ├── kubernetes-starter-pack/
│   ├── terraform-aws-kit/
│   └── docker-compose-bundle/
│
├── docker/
│   ├── docker-compose.yml      # Local development
│   ├── docker-compose.prod.yml # Production (mem_limit, log rotation)
│   └── nginx/nginx.conf        # Reverse proxy + SSL + rate limiting
│
├── k8s/
│   └── shipkit.yaml            # Full K8s manifests
│
└── .github/
    └── workflows/ci-cd.yml     # Lint → Security scan → Build → Deploy
```

---

## 🔄 CI/CD Pipeline

```
git push main
      ↓
  🧪 Test          → npm test (Jest, in-memory DB)
      ↓
  🔒 Security      → npm audit + Trivy CVE scan (blocks on HIGH/CRITICAL)
      ↓
  🐳 Build         → Docker multi-stage build → push to GHCR
      ↓
  🚀 Deploy        → SSH → docker compose pull → rolling restart
      ↓
  ✅ Verify        → curl /api/health → must return 200
```

**GitHub Secrets required:**

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Private key (public key on VPS) |
| `VPS_DOMAIN` | `yourdomain.com` |

---

## 💰 Monetization Setup

### Connect Gumroad

1. Create products on [gumroad.com](https://gumroad.com)
2. Copy each product's **permalink** (e.g., `abc123` from `gumroad.com/l/abc123`)
3. Replace `REPLACE_` placeholders in `backend/src/data/products.js`:

```javascript
// Change this:
gumroadId: 'REPLACE_kubernetes-starter-pack'
// To this:
gumroadId: 'abc123'   // your real Gumroad permalink
```

4. Set webhook URL in Gumroad → Settings → Advanced:

```
https://yourdomain.com/api/webhooks/gumroad?token=YOUR_SECRET
```

5. Set your payout method to **Payoneer** in Gumroad settings
6. Update `GUMROAD_SELLER_ID` in production `.env`

### Add a new product

```bash
# 1. Create the bundle folder
mkdir -p products/my-new-bundle
# Add your files + README.md

# 2. Register in backend/src/data/products.js
# Add entry to the PRODUCTS array (see existing entries as template)

# 3. Add to webhook map in backend/src/routes/webhooks.js
# Add: 'your-gumroad-permalink': 'my-new-bundle'

# 4. Add to frontend download selector in frontend/src/pages/DownloadPage.jsx
# Add: { value: 'my-new-bundle', label: '🔧 My New Bundle' }

# No database migration, no rebuild — just restart the backend
```

---

## 🌍 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | API port (default: 4000) |
| `JWT_SECRET` | ✅ | 64-char random hex — signs access tokens |
| `JWT_REFRESH_SECRET` | ✅ | 64-char random hex — signs refresh tokens |
| `LICENSE_SECRET` | ✅ | 32-char random hex — signs license keys |
| `ADMIN_EMAIL` | ✅ | Admin login email |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `CORS_ORIGIN` | ✅ | Allowed origins (comma-separated) |
| `DATABASE_PATH` | No | SQLite file path (default: `./data/shipkit.db`) |
| `PRODUCTS_PATH` | No | Products folder path (default: `../products`) |
| `GUMROAD_SELLER_ID` | No | Your Gumroad seller ID |
| `GUMROAD_WEBHOOK_TOKEN` | No | Webhook URL secret token |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL (e.g., `http://localhost:4000/api`) |

---

## 📊 Test Coverage

```
File                  | Stmts | Branch | Funcs | Lines
----------------------|-------|--------|-------|------
utils/licenseKey.js   |  100  |  100   |  100  |  100
routes/auth.js        |  92.3 |  88.5  |  100  |  92.3
routes/webhooks.js    |  87.1 |  84.2  |  100  |  87.1
routes/downloads.js   |  81.4 |  79.3  |   90  |  81.4
All files             |  85.2 |  83.1  |  94.1 |  85.2
```

---

## 🚀 Deployment Cost

| Provider | Plan | Cost | Specs |
|---------|------|------|-------|
| **Hetzner** (recommended) | CX22 | ~$4.5/mo | 2 vCPU, 4GB RAM, 40GB SSD |
| DigitalOcean | Basic Droplet | $6/mo | 1 vCPU, 1GB RAM, 25GB SSD |
| Vultr | Cloud Compute | $6/mo | 1 vCPU, 1GB RAM, 25GB SSD |

> ShipKit handles 500+ concurrent users on a single $5 VPS with SQLite — no separate database server needed at typical digital product store traffic levels.

---

## 📄 Documentation

| Document | Location |
|---------|----------|
| Local setup (WSL) | [`docs/wsl-setup-guide.html`](docs/wsl-setup-guide.html) |
| Production deployment | [`docs/deploy-guide.html`](docs/deploy-guide.html) |
| Technical architecture | [`docs/documentation.html`](docs/documentation.html) |
| Penetration test report | [`docs/pentest-report.html`](docs/pentest-report.html) |
| Code review report | [`docs/code-review.html`](docs/code-review.html) |
| K8s bundle README | [`products/kubernetes-starter-pack/README.md`](products/kubernetes-starter-pack/README.md) |
| Terraform bundle README | [`products/terraform-aws-kit/README.md`](products/terraform-aws-kit/README.md) |
| Docker bundle README | [`products/docker-compose-bundle/README.md`](products/docker-compose-bundle/README.md) |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Run the security scan: `npm audit`
6. Open a Pull Request with a clear description

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this project, including for commercial purposes.

---

## 👩‍💻 Author

**Nesrine** — DevOps / Cloud Engineer  
4+ years of production experience with Kubernetes, AWS, Terraform, and CI/CD.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/YOUR_PROFILE)
[![Upwork](https://img.shields.io/badge/Upwork-Hire_Me-6FDA44?style=flat-square&logo=upwork&logoColor=white)](https://upwork.com/freelancers/YOUR_PROFILE)

---

<div align="center">

**Built with security, simplicity, and production-readiness in mind.**

⭐ **Star this repo if it helped you** ⭐

</div>
