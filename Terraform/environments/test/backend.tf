# Define the Terraform configuration and backend settings
terraform {
    required_version = ">= 1.17.1"
# Declare the AWS provider dependency
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
# Configure Amazon S3 as the remote backend
 backend "s3" {
    # Name of the S3 bucket created by the bootstrap project
    bucket       = "shipkit-tfstate-818655836450"
    key          = "test/terraform.tfstate"
    region       = "eu-west-3"
    encrypt      = true
    use_lockfile = true
  }
}