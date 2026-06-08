/**
 * tags.js — Shared tag color mapping
 *
 * FIX [MEDIUM]: This was duplicated identically in ProductCard.jsx and ProductPage.jsx.
 * Centralizing here means adding a new tag/color only needs one change.
 */

export const TAG_COLOR_MAP = {
  // Green group
  Kubernetes: 'green',
  Helm:       'green',
  EKS:        'green',
  Bash:       'green',
  // Blue group
  Terraform:  'blue',
  AWS:        'blue',
  Terragrunt: 'blue',
  Docker:     'blue',
  Ansible:    'blue',
  // Yellow group
  Postgres:   'yellow',
  Nginx:      'yellow',
  Prometheus: 'yellow',
  Grafana:    'yellow',
};

export const getTagColor = (tag) => TAG_COLOR_MAP[tag] || 'muted';
