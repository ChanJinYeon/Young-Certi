output "role_arn" { # 주체: Trust Policy
  description = "ARN of the GitHub Actions IAM role."
  value       = aws_iam_role.github_actions.arn
}

output "role_name" {
  description = "Name of the GitHub Actions IAM role."
  value       = aws_iam_role.github_actions.name
}
