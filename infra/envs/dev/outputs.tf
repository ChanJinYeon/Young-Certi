output "question_data_bucket_arn" {
  description = "ARN of the question data S3 bucket."
  value       = module.question_data_bucket.bucket_arn
}

output "question_data_bucket_name" {
  description = "Name of the question data S3 bucket."
  value       = module.question_data_bucket.bucket_name
}

output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket."
  value       = module.frontend_site.bucket_name
}

output "frontend_cloudfront_distribution_id" {
  description = "ID of the frontend CloudFront distribution."
  value       = module.frontend_site.cloudfront_distribution_id
}

output "frontend_cloudfront_domain_name" {
  description = "Domain name of the frontend CloudFront distribution."
  value       = module.frontend_site.cloudfront_domain_name
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions deploy role."
  value       = module.github_oidc.role_arn
}
