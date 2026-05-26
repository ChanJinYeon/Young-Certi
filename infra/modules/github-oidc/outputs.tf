output "role_arn" {
  description = "GitHub Actions IAM role ARN."
  value       = var.enabled ? aws_iam_role.github_actions[0].arn : null
}

output "provider_arn" {
  description = "GitHub OIDC provider ARN."
  value       = var.enabled ? aws_iam_openid_connect_provider.github[0].arn : null
}
