/**
 * Product catalog — single source of truth for both API and frontend
 * productDir must match the folder name inside products/
 */
const PRODUCTS = [
  {
    id:         'kubernetes-starter-pack',
    slug:       'kubernetes-starter-pack',
    name:       'Kubernetes Starter Pack',
    tagline:    'Production-ready K8s manifests, Helm chart, and init scripts.',
    description:
      'Everything you need to deploy a production Kubernetes workload on EKS or any K8s cluster. ' +
      'Includes namespace isolation, RBAC, HPA, PodDisruptionBudget, NetworkPolicy, Ingress with TLS, ' +
      'and a reusable Helm chart — fully commented and ready to customize.',
    price:      49,
    currency:   'USD',
    productDir: 'kubernetes-starter-pack',
    gumroadId:  'REPLACE_kubernetes-starter-pack', // Replace with your Gumroad product permalink
    tags:       ['Kubernetes', 'Helm', 'EKS', 'Bash'],
    features: [
      'Namespace + RBAC config',
      'Deployment with rolling update strategy',
      'HorizontalPodAutoscaler (CPU + memory)',
      'PodDisruptionBudget for zero-downtime deploys',
      'Ingress + cert-manager TLS',
      'NetworkPolicy (default-deny)',
      'Reusable Helm chart',
      'cluster-init.sh bootstrap script',
      'health-check.sh with Slack alert',
    ],
    fileTree: [
      'kubernetes-starter-pack/',
      '├── README.md',
      '├── manifests/',
      '│   ├── namespace.yaml',
      '│   ├── deployment.yaml',
      '│   ├── service.yaml',
      '│   ├── ingress.yaml',
      '│   ├── hpa.yaml',
      '│   ├── pdb.yaml',
      '│   └── networkpolicy.yaml',
      '├── helm/',
      '│   └── app/',
      '│       ├── Chart.yaml',
      '│       ├── values.yaml',
      '│       └── templates/',
      '└── scripts/',
      '    ├── cluster-init.sh',
      '    └── health-check.sh',
    ],
    preview: {
      language: 'yaml',
      filename: 'manifests/deployment.yaml',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app
  namespace: {{ .Release.Namespace }}
  labels:
    app: {{ .Release.Name }}
    version: "{{ .Chart.AppVersion }}"
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
            requests:
              cpu: "{{ .Values.resources.requests.cpu }}"
              memory: "{{ .Values.resources.requests.memory }}"
            limits:
              cpu: "{{ .Values.resources.limits.cpu }}"
              memory: "{{ .Values.resources.limits.memory }}"
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.service.targetPort }}
            initialDelaySeconds: 10
            periodSeconds: 5`,
    },
  },

  {
    id:         'terraform-aws-kit',
    slug:       'terraform-aws-kit',
    name:       'Terraform AWS Infrastructure Kit',
    tagline:    'Production AWS infra — VPC, EKS, IAM, S3 backend in one Terragrunt repo.',
    description:
      'Complete Terraform codebase for a production AWS environment. ' +
      'Reusable modules for VPC, EKS, RDS, IAM, and S3. ' +
      'Multi-environment support (dev / staging / prod) with Terragrunt. ' +
      'Remote state with S3 + DynamoDB locking pre-configured.',
    price:      39,
    currency:   'USD',
    productDir: 'terraform-aws-kit',
    gumroadId:  'REPLACE_terraform-aws-kit',
    tags:       ['Terraform', 'AWS', 'EKS', 'Terragrunt'],
    features: [
      'VPC module (multi-AZ, public + private subnets)',
      'EKS cluster module with IRSA',
      'RDS module (PostgreSQL, Multi-AZ)',
      'S3 backend + DynamoDB state lock',
      'IAM role factory module',
      'Terragrunt multi-env structure',
      'Pre-configured provider + backend blocks',
      'terraform.tfvars.example for each env',
    ],
    fileTree: [
      'terraform-aws-kit/',
      '├── README.md',
      '├── modules/',
      '│   ├── vpc/',
      '│   │   ├── main.tf',
      '│   │   ├── variables.tf',
      '│   │   └── outputs.tf',
      '│   └── eks/',
      '│       ├── main.tf',
      '│       ├── variables.tf',
      '│       └── outputs.tf',
      '└── environments/',
      '    └── prod/',
      '        ├── main.tf',
      '        └── terraform.tfvars.example',
    ],
    preview: {
      language: 'hcl',
      filename: 'modules/vpc/main.tf',
      code: `module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "\${var.project}-\${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "prod" ? false : true
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags required for EKS to discover subnets
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = local.common_tags
}`,
    },
  },

  {
    id:         'docker-compose-bundle',
    slug:       'docker-compose-bundle',
    name:       'Docker Compose Production Bundle',
    tagline:    'Production-grade Compose stacks for Postgres HA, Nginx SSL, and Monitoring.',
    description:
      'Three battle-tested Docker Compose stacks you can run on any VPS or server. ' +
      'Each stack includes health checks, restart policies, named volumes, and a ' +
      'clear README with one-command setup. Ideal for staging environments or small production workloads.',
    price:      19,
    currency:   'USD',
    productDir: 'docker-compose-bundle',
    gumroadId:  'REPLACE_docker-compose-bundle',
    tags:       ['Docker', 'Postgres', 'Nginx', 'Prometheus'],
    features: [
      'Postgres HA (primary + replica + pgBouncer)',
      'Nginx + Certbot auto-SSL renewal',
      'Full monitoring stack (Prometheus + Grafana + Alertmanager)',
      'Redis Sentinel (3-node HA)',
      'Health checks on every service',
      'Named volumes for data persistence',
      'Secure default env vars',
      'One-command setup per stack',
    ],
    fileTree: [
      'docker-compose-bundle/',
      '├── README.md',
      '├── postgres-ha/',
      '│   └── docker-compose.yml',
      '├── nginx-ssl/',
      '│   ├── docker-compose.yml',
      '│   └── nginx.conf',
      '└── monitoring/',
      '    └── docker-compose.yml',
    ],
    preview: {
      language: 'yaml',
      filename: 'postgres-ha/docker-compose.yml',
      code: `services:
  postgres-primary:
    image: postgres:16-alpine
    container_name: pg-primary
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: \${REPLICATION_PASSWORD}
    volumes:
      - pg-primary-data:/var/lib/postgresql/data
      - ./init/01-replication.sh:/docker-entrypoint-initdb.d/01-replication.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  pgbouncer:
    image: pgbouncer/pgbouncer:1.22
    environment:
      DATABASES_HOST: postgres-primary
      DATABASES_PORT: 5432
      DATABASES_USER: \${POSTGRES_USER}
      DATABASES_PASSWORD: \${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    depends_on:
      postgres-primary:
        condition: service_healthy`,
    },
  },
];

module.exports = PRODUCTS;
