# Retrieve the current AWS partition
data "aws_partition" "current" {}
# Create an IAM role that EKS can assume to manage the cluster
resource "aws_iam_role" "cluster" {
  name = "${var.name}-cluster-role"
  # Define who is allowed to assume this role and what action is permitted
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}


#Attach the AWS-managed EKS Cluster policy to the cluster IAM role
resource "aws_iam_role_policy_attachment" "cluster" {
  #specify the IAM role to recive the policy
  role = aws_iam_role.cluster.name
  #Select the AWS-managed policy ARN
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSClusterPolicy"
}

#Create monitoring
#resource "aws_cloudwatch_log_group" "cluster" {
#name              = "/aws/eks/${var.name}/cluster"
#retention_in_days = var.log_retention_days
#}

#Create the Amazon EKS Cluster
resource "aws_eks_cluster" "this" {
  name     = var.name
  version  = var.k8s_version
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.public_access_cidrs
  }
  #Configure how users and IAM identities authenticate to the EKS cluster 
  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }
  #
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.cluster,
    #aws_cloudwatch_log_group.cluster,
  ]
}
#Register each IAM role as an identity allowed to access the EKS Cluster
resource "aws_eks_access_entry" "admin" {
  # Iterate over all IAM role ARNs provided through the module variable
  for_each     = toset(var.admin_role_arns)
  cluster_name = aws_eks_cluster.this.name
  # Register the IAM role as an EKS principal
  principal_arn = each.value
}

# Associate an EKS access policy with each registered IAM role
resource "aws_eks_access_policy_association" "admin" {
  for_each      = toset(var.admin_role_arns)
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = each.value
  #Grant the Amazon EKS cluster administrator policy
  policy_arn = "arn:${data.aws_partition.current.partition}:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  # Apply the policy to the entire kubernetes Cluster
  access_scope { type = "cluster" }
  # Wait until the IAM roles are registered in EKS 
  depends_on = [aws_eks_access_entry.admin]
}

resource "aws_iam_openid_connect_provider" "this" {
  # Retrieve the OIDC issuer URL from the EKS cluster
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
  # Allow tokens intended for AWS Security Token Service
  client_id_list = ["sts.amazonaws.com"]
}