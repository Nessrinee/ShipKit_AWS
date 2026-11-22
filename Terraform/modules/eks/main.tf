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
  role= aws_iam_role.cluster.name
  #Select the AWS-managed policy ARN
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSClusterPolicy"
}

#Create monitoring
#resource "aws_cloudwatch_log_group" "cluster" {
  #name              = "/aws/eks/${var.name}/cluster"
  #retention_in_days = var.log_retention_days
#}

