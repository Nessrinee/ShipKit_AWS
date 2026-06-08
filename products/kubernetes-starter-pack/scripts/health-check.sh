#!/usr/bin/env bash
# health-check.sh — K8s cluster health checker with optional Slack alert
# Usage: SLACK_WEBHOOK=https://hooks.slack.com/... bash health-check.sh
# Cron (every 5 min): */5 * * * * /opt/shipkit/health-check.sh >> /var/log/k8s-health.log 2>&1

set -euo pipefail

NAMESPACE="${NAMESPACE:-production}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
ALERT_THRESHOLD_RESTARTS=5
EXIT_CODE=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ALERTS=()

log()   { echo -e "[$TIMESTAMP] $*"; }
alert() { ALERTS+=("$*"); echo -e "${RED}[ALERT]${NC} $*"; EXIT_CODE=1; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# ── 1. Node health ──────────────────────────────────────────────────
log "Checking nodes..."
NOT_READY=$(kubectl get nodes --no-headers 2>/dev/null | grep -v " Ready " | wc -l | tr -d ' ')
if [[ "$NOT_READY" -gt 0 ]]; then
  alert "$NOT_READY node(s) NOT READY"
  kubectl get nodes --no-headers | grep -v " Ready "
else
  TOTAL=$(kubectl get nodes --no-headers | wc -l | tr -d ' ')
  ok "All $TOTAL nodes Ready"
fi

# ── 2. Pod health ───────────────────────────────────────────────────
log "Checking pods in namespace: $NAMESPACE..."
FAILED_PODS=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null \
  | grep -vE "Running|Completed" || true)
if [[ -n "$FAILED_PODS" ]]; then
  alert "Failed pods in $NAMESPACE:"
  echo "$FAILED_PODS"
else
  TOTAL_PODS=$(kubectl get pods -n "$NAMESPACE" --no-headers | wc -l | tr -d ' ')
  ok "$TOTAL_PODS pods Running in $NAMESPACE"
fi

# ── 3. Crash loops / high restart counts ────────────────────────────
log "Checking restart counts..."
while IFS= read -r line; do
  POD=$(echo "$line"    | awk '{print $1}')
  RESTARTS=$(echo "$line" | awk '{print $4}')
  if [[ "$RESTARTS" -ge "$ALERT_THRESHOLD_RESTARTS" ]]; then
    alert "Pod $POD has $RESTARTS restarts (threshold: $ALERT_THRESHOLD_RESTARTS)"
  fi
done < <(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null || true)

# ── 4. PVC health ───────────────────────────────────────────────────
log "Checking PersistentVolumeClaims..."
UNBOUND_PVC=$(kubectl get pvc --all-namespaces --no-headers 2>/dev/null \
  | grep -v Bound || true)
if [[ -n "$UNBOUND_PVC" ]]; then
  alert "Unbound PVCs found:"
  echo "$UNBOUND_PVC"
else
  ok "All PVCs Bound"
fi

# ── 5. Recent events (warnings) ─────────────────────────────────────
log "Checking recent Warning events (last 15 min)..."
WARNINGS=$(kubectl get events -n "$NAMESPACE" --field-selector type=Warning \
  --sort-by='.lastTimestamp' 2>/dev/null | tail -5 || true)
if [[ -n "$WARNINGS" ]]; then
  warn "Recent warnings:"
  echo "$WARNINGS"
fi

# ── 6. Send Slack alert ─────────────────────────────────────────────
if [[ "${#ALERTS[@]}" -gt 0 && -n "$SLACK_WEBHOOK" ]]; then
  ALERT_TEXT=$(printf "• %s\n" "${ALERTS[@]}")
  PAYLOAD=$(printf '{"text":"🚨 *K8s Health Alert* [%s]\n```%s```"}' \
    "$TIMESTAMP" "$ALERT_TEXT")
  curl -s -X POST -H 'Content-type: application/json' \
    --data "$PAYLOAD" "$SLACK_WEBHOOK" >/dev/null
  log "Slack alert sent (${#ALERTS[@]} issue(s))"
fi

log "Health check complete — exit code: $EXIT_CODE"
exit "$EXIT_CODE"
