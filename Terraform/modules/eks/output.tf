output "cluster_name" { value = aws_eks_cluster.this.name }
# Export the Kubernetes API endpoint URL
output "cluster_endpoint" { value = aws_eks_cluster.this.endpoint }
# Export the IAM ARN of the OIDC provider
output "oidc_provider_arn" { value = aws_iam_openid_connect_provider.this.arn }
# Export the OIDC issuer URL without the HTTPS prefix
output "oidc_provider_url" {
  value = replace(aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")
}