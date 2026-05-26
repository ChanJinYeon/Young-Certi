output "tfstate_bucket_name" {
  description = "Terraform remote state bucket name."
  value       = module.tfstate_bucket.bucket_name
}

output "data_bucket_name" {
  description = "Question data bucket name."
  value       = module.data_bucket.bucket_name
}

output "questions_key" {
  description = "Default key for the merged SAP-C02 question pool."
  value       = module.data_bucket.questions_key
}

output "budget_name" {
  description = "Monthly AWS budget resource name."
  value       = aws_budgets_budget.monthly_cost.name
}

output "eks_cluster_name" {
  description = "EKS cluster name when the ephemeral cluster is enabled."
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint when the ephemeral cluster is enabled."
  value       = module.eks.cluster_endpoint
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC when enabled."
  value       = module.github_oidc.role_arn
}
