
# Configure the AWS provider for the test environment
provider "aws" {
  # Set the AWS region where resources will be created
  region = "eu-west-3"

  # Apply common tags automatically to supported AWS resources
  default_tags {
    tags = {
      Project     = "shipkit"
      Environment = "test"
      ManagedBy   = "terraform"
    }
  }
}

# Call the reusable networking module to create the test network
module "network" {
  # Path to the networking module directory
  source = "../../modules/network"

  # Name used to identify the test infrastructure resources
  name = "shipkit-test"

  # Define the CIDR range for the test VPC
  vpc_cidr = "10.10.0.0/16"

  # Select two Availability Zones in the Paris region
  azs = ["eu-west-3a", "eu-west-3b"]

  # Set the EKS cluster name used by networking resource tags
  cluster_name = "shipkit-test"

  # Use one NAT Gateway to reduce infrastructure costs in test
  single_nat_gateway = true
}

# ECR module 
module "ecr" {
  source       = "../../modules/ecr"
  name         = "shipkit-test"
  force_delete = true
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

# EKS module
module "eks" {
  source     = "../../modules/eks"
  name       = "shipkit-test"
  subnet_ids = module.network.private_subnet_ids

  admin_role_arns = [
    "arn:aws:iam::818655836450:role/shipkit-github-actions-role",
  ]
}
