# environments/prod/main.tf — Production environment entry point

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  # Remote state — S3 + DynamoDB lock
  # Fill in your bucket name and table before running
  backend "s3" {
    bucket         = "CHANGE_ME-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "CHANGE_ME-terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source      = "../../modules/vpc"
  project     = var.project
  environment = "prod"
  vpc_cidr    = var.vpc_cidr

  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  single_nat_gateway   = false   # HA: one NAT per AZ in prod
  enable_flow_logs     = true
}

module "eks" {
  source      = "../../modules/eks"
  project     = var.project
  environment = "prod"

  private_subnet_ids   = module.vpc.private_subnet_ids
  kubernetes_version   = var.kubernetes_version
  node_instance_types  = var.node_instance_types
  node_desired         = 3
  node_min             = 2
  node_max             = 10
  public_access        = false   # Private endpoint only in prod
  public_access_cidrs  = []
}

output "cluster_name"     { value = module.eks.cluster_name }
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "vpc_id"           { value = module.vpc.vpc_id }
