# Define the name of the Cluster 
variable "name" {
    type = string
}

# Define the subnet IDs where the EKS cluster will be placed
variable "subnet_ids" {
    type = list(string)
}

# Define Cluster version 
variable "K8s_version" {
    type = string
    default = "1.34"
}

# Define the IPv4 CIDR ranges allowed to access the public Eks API endpoint 
# Do not use this IP in productions
variable "public_access_cidrs" {
    type = string
    default = ["0.0.0.0/0"]
}

# Define IAM role ARNs that should receive administravte access to EKS
variable "admin_role_arns" {
    type = list(string)
    default = []
    description = "IAM roles with cluster admin access"
}
#Define how many days CloudWatch logs should be retained
variable "log_retention_days" {
  type    = number
  default = 14
}