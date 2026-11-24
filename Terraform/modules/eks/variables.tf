#------------------------------------
# Cluster EKS
#------------------------------------

# Define the name of the Cluster 
variable "name" {
  type = string
}

# Define the subnet IDs where the EKS cluster will be placed
variable "subnet_ids" {
  type = list(string)
}

# Define Cluster version 
variable "k8s_version" {
  type    = string
  default = "1.34"
}

# Define the IPv4 CIDR ranges allowed to access the public Eks API endpoint 
# Do not use this IP in productions
variable "public_access_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

# Define IAM role ARNs that should receive administravte access to EKS
variable "admin_role_arns" {
  type        = list(string)
  default     = []
  description = "IAM roles with cluster admin access"
}
#Define how many days CloudWatch logs should be retained
variable "log_retention_days" {
  type    = number
  default = 14
}
#-----------------------------------------------------
# Worker Nodes
#-------------------------------------------------------

# Defines the EC2 instance types for worker nodes
variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

# Defines the desired number of worker nodes
variable "node_desired_size" {
  type    = number
  default = 2
}

# Defines the minimum number of worker nodes
variable "node_min_size" {
  type    = number
  default = 1
}

# Defines the maximum number of worker nodes
variable "node_max_size" {
  type    = number
  default = 3
}

# Defines the disk size in GB for each worker node
variable "node_disk_size" {
  type    = number
  default = 20
}