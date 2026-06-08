# 🏗️ Terraform AWS Infrastructure Kit — ShipKit

Production-grade AWS infrastructure as code. VPC + EKS + IRSA + encrypted secrets + VPC flow logs. Multi-environment, remote state, Terragrunt-ready.

---

## 📦 What's Inside

```
terraform-aws-kit/
├── modules/
│   ├── vpc/          # Multi-AZ VPC, public+private subnets, NAT, Flow Logs
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── eks/          # EKS cluster, managed node group, IRSA, KMS encryption
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    └── prod/
        ├── main.tf                  # Entry point — calls all modules
        ├── variables.tf
        └── terraform.tfvars.example # Copy → terraform.tfvars
```

---

## ⚡ Quick Start

### Prerequisites

```bash
# Install tools
brew install terraform awscli   # macOS
# OR
apt install terraform awscli    # Ubuntu

# Configure AWS credentials
aws configure
# or use environment variables:
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=eu-west-1
```

### 1. Create remote state backend (one time)

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket CHANGE_ME-terraform-state \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

aws s3api put-bucket-versioning \
  --bucket CHANGE_ME-terraform-state \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket CHANGE_ME-terraform-state \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name CHANGE_ME-terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1
```

### 2. Configure and deploy

```bash
cd environments/prod

# Copy and edit vars
cp terraform.tfvars.example terraform.tfvars
# Edit: project name, region, VPC CIDRs, node types

# Update backend.tf with your bucket name
# (search for CHANGE_ME in main.tf)

# Init + plan
terraform init
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

### 3. Configure kubectl

```bash
aws eks update-kubeconfig \
  --name $(terraform output -raw cluster_name) \
  --region eu-west-1

kubectl get nodes   # verify
```

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| KMS encryption | K8s secrets encrypted at rest with CMK |
| IMDSv2 enforced | `http_tokens = required` in launch template |
| EBS encryption | All node volumes encrypted with KMS |
| VPC Flow Logs | All traffic logged to CloudWatch (30d retention) |
| Private endpoint | EKS API server private by default in prod |
| IRSA | OpenID Connect provider for pod-level IAM roles |
| Remote state | Encrypted S3 + DynamoDB state locking |

---

## 📧 Support

Email **hello@shipkit.dev** — response within 24 hours.
