# Defines the name of the IAM role
variable "name" {
  type = string
}

# Receives the ARN of the EKS OIDC provider
variable "oidc_provider_arn" {
  type = string
}

# Receives the OIDC issuer URL without https://
variable "oidc_provider_url" {
  type = string
}

# Defines the Kubernetes namespace
variable "namespace" {
  type = string
}

# Defines the Kubernetes Service Account name
variable "service_account" {
  type = string
}

# Receives the IAM permissions policy as JSON
variable "policy_json" {
  type = string
}