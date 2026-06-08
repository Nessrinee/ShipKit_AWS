# 🐳 Docker Compose Production Bundle — ShipKit

Three production-grade Docker Compose stacks for common server setups. One-command startup, health checks, restart policies, named volumes, and clear setup guides included.

---

## 📦 What's Inside

```
docker-compose-bundle/
├── postgres-ha/
│   └── docker-compose.yml   # Postgres primary + replica + pgBouncer + exporter
├── nginx-ssl/
│   ├── docker-compose.yml   # Nginx + Certbot (auto SSL renewal)
│   └── nginx.conf           # Reverse proxy config with rate limiting
└── monitoring/
    └── docker-compose.yml   # Prometheus + Grafana + Alertmanager + Node Exporter + cAdvisor
```

---

## ⚡ Stack 1 — Postgres HA

Primary + streaming replica + pgBouncer connection pooler + Prometheus exporter.

```bash
cd postgres-ha

# Create .env
cat > .env <<EOF
POSTGRES_USER=appuser
POSTGRES_PASSWORD=changeme-strong-password
POSTGRES_DB=myapp
REPLICATION_PASSWORD=changeme-replication-password
EOF

docker compose up -d

# Verify replication
docker exec pg-replica psql -U appuser -c "SELECT * FROM pg_stat_wal_receiver;"
```

**Connect your app to pgBouncer (not Postgres directly):**
```
host=localhost port=5432 dbname=myapp user=appuser password=...
```

---

## ⚡ Stack 2 — Nginx + Auto SSL

Nginx reverse proxy with automatic Let's Encrypt certificate renewal.

```bash
cd nginx-ssl

# Step 1: Edit nginx.conf — replace yourdomain.com with your domain
# Step 2: Get initial certificate
docker compose up -d nginx

docker run --rm \
  -v $(pwd)/certbot-www:/var/www/certbot \
  -v $(pwd)/certbot-certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  --email you@example.com \
  --agree-tos --non-interactive

# Step 3: Start Certbot auto-renew sidecar
docker compose up -d certbot

# Step 4: Reload Nginx to pick up cert
docker exec nginx-ssl nginx -s reload
```

Certbot checks every 12 hours and renews if expiry < 30 days.

---

## ⚡ Stack 3 — Monitoring (Prometheus + Grafana)

Full observability stack with dashboards pre-wired.

```bash
cd monitoring

# Set Grafana password
cat > .env <<EOF
GRAFANA_USER=admin
GRAFANA_PASSWORD=changeme-strong-password
EOF

docker compose up -d

# Access
# Prometheus:   http://localhost:9090
# Grafana:      http://localhost:3000  (admin / your password)
# Alertmanager: http://localhost:9093
```

**Pre-built dashboards available at grafana.com:**
- Node Exporter Full: ID `1860`
- Docker cAdvisor:    ID `14282`
- Postgres:           ID `9628`

In Grafana → Dashboards → Import → enter the dashboard ID.

---

## 🔐 Security Defaults

- All services run on internal Docker networks (not exposed except necessary ports)
- Postgres: no direct external port exposure — access via pgBouncer only
- Nginx: TLSv1.2/1.3 only, HSTS, rate limiting, security headers
- Monitoring: Grafana with auth required (`allow_sign_up = false`)

---

## 📧 Support

Email **hello@shipkit.dev** — response within 24 hours.
