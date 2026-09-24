# 🚀 ShipKit v2 — Production-Hardened



---

## 🔐 Security Fixes Applied (v2)

### Critical
| # | Fix | File | Impact |
|---|-----|------|--------|
| 1 | Timing oracle in login — always run bcrypt even if user not found | `routes/auth.js` | Prevents email enumeration |
| 2 | Buffer length crash in `timingSafeEqual()` — added length guard | `utils/licenseKey.js` | Prevents DoS crash |

### High
| # | Fix | File |
|---|-----|------|
| 3 | Docker resource limits: `deploy.resources` → `mem_limit`/`cpu_quota` | `docker-compose.prod.yml` |
| 4 | Admin route separated into `routes/admin.js` | `routes/admin.js` (new) |
| 5 | React ErrorBoundary added | `App.jsx` + `ErrorBoundary.jsx` |
| 6 | Test suite added (40+ tests) | `__tests__/shipkit.test.js` |

### Medium / Payment
| # | Fix | File |
|---|-----|------|
| 7 | Webhook token verification added | `routes/webhooks.js` |
| 8 | Atomic license creation (SQLite transaction) | `routes/webhooks.js` |
| 9 | Payment events audit table | `db/database.js` (migration v2) |
| 10 | Path traversal guard on `productDir` | `routes/downloads.js` |
| 11 | `config2` duplicate import removed | `db/database.js` |
| 12 | `require()` moved from handler bodies to module top | all routes |
| 13 | Email `.trim().lowercase()` in Joi schema | `routes/auth.js` |
| 14 | Module-level cache in `useProducts()` hook | `hooks/useProducts.js` |
| 15 | `TAG_COLOR_MAP` extracted to `lib/tags.js` (DRY) | `lib/tags.js` (new) |
| 16 | Nonce added to download token (uniqueness) | `utils/licenseKey.js` |
| 17 | X-Request-Id on every response | `app.js` |
| 18 | Permissions-Policy header | `nginx-spa.conf` |

---

## ⚡ Quick Start

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Fill in: JWT_SECRET (64 hex chars), LICENSE_SECRET, ADMIN_PASSWORD, etc.
# Generate secrets: openssl rand -hex 64

# 2. Run locally
cd backend && npm install && npm run dev   # Terminal 1
cd frontend && npm install && npm run dev  # Terminal 2
# Open: http://localhost:5173

# 3. Run tests
cd backend && npm test

# 4. Deploy (production)
docker compose -f docker/docker-compose.prod.yml up -d --build
```

---

## 🧪 Test Suite

```bash
cd backend
npm test                    # run all tests
npm test -- --coverage      # with coverage report
npm test -- --watch         # watch mode
```

**Coverage targets:**
- `utils/licenseKey.js`  → 100% (all critical paths + crash scenarios)
- `routes/auth.js`       → 90%  (includes timing attack test)
- `routes/webhooks.js`   → 85%  (idempotency + payment audit)
- `routes/downloads.js`  → 80%  (path traversal + quota enforcement)

---

## 💳 Payment Security Model

```
Customer → Gumroad checkout → Payment succeeds
       ↓
Gumroad sends webhook POST /api/webhooks/gumroad?token=SECRET
       ↓
Backend validates:
  1. Token in URL matches GUMROAD_WEBHOOK_TOKEN (required)
  2. seller_id matches GUMROAD_SELLER_ID (required)
  3. product_permalink maps to known internal product
  4. sale_id not already in licenses table (idempotency)
       ↓
Atomic SQLite transaction:
  - INSERT INTO licenses (license key generated with HMAC)
  - INSERT INTO payment_events (audit trail)
       ↓
Customer receives license key via Gumroad receipt email
       ↓
Customer visits /download → enters email + key
Backend: HMAC verify → DB lookup → quota check → 10-min signed token
       ↓
Customer hits /api/downloads/:token → reserve quota slot atomically
DB: UPDATE ... WHERE count < max before stream (replay-safe)
Then stream ZIP and log download event
```

**What prevents payment abuse:**
- Server-side product validation — price never comes from client
- Idempotency — duplicate webhooks create no duplicate licenses
- Download quotas — atomic reservation prevents token replay race
- Signed expiring download tokens — cannot share or replay download links
- Payment events audit table — full trail for disputes/refunds

---

## 🏗️ Project Structure (v2)

```
shipkit/
├── backend/
│   └── src/
│       ├── config/index.js           # centralized config from .env
│       ├── data/products.js          # product catalog
│       ├── db/database.js            # SQLite + migrations + seed
│       ├── middleware/
│       │   ├── auth.js               # JWT verify + admin check
│       │   ├── rateLimiter.js        # tiered rate limits
│       │   └── errorHandler.js       # global error formatter
│       ├── routes/
│       │   ├── admin.js              # NEW: separated admin routes
│       │   ├── auth.js               # FIXED: timing oracle
│       │   ├── downloads.js          # FIXED: path traversal + imports
│       │   ├── products.js           # public product listing
│       │   ├── webhooks.js           # FIXED: payment hardening
│       │   └── contact.js            # contact form
│       ├── utils/
│       │   ├── licenseKey.js         # FIXED: crash bug + nonce
│       │   ├── jwt.js                # JWT sign/verify
│       │   └── logger.js             # Winston structured logger
│       ├── __tests__/
│       │   └── shipkit.test.js       # NEW: 40+ test cases
│       ├── app.js                    # FIXED: X-Request-Id, admin route
│       └── server.js                 # entry point, graceful shutdown
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ErrorBoundary.jsx     # NEW: prevents blank screen crashes
│       │   ├── Layout.jsx
│       │   ├── ProductCard.jsx
│       │   └── ui.jsx
│       ├── hooks/
│       │   └── useProducts.js        # FIXED: module-level cache
│       ├── lib/
│       │   ├── api.js
│       │   └── tags.js               # NEW: shared tag colors (DRY)
│       └── pages/
│           ├── HomePage.jsx
│           ├── ProductPage.jsx
│           ├── DownloadPage.jsx
│           ├── AboutPage.jsx
│           ├── ContactPage.jsx
│           └── NotFoundPage.jsx
├── products/                         # downloadable bundles
├── docker/
│   ├── docker-compose.yml            # local dev
│   ├── docker-compose.prod.yml       # FIXED: mem_limit not deploy.resources
│   └── nginx/nginx.conf
└── k8s/
    └── shipkit.yaml                  # K8s manifests with probes + NetworkPolicy
```
