output "arn" {
  description = "ARN of the GitHub Actions OIDC provider."
  value       = aws_iam_openid_connect_provider.main.arn
}

output "url" {
  description = "URL of the GitHub Actions OIDC provider."
  value       = aws_iam_openid_connect_provider.main.url
}
