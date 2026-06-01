output "question_data_bucket_arn" {
  description = "ARN of the question data S3 bucket."
  value       = module.question_data_bucket.bucket_arn
}

output "question_data_bucket_name" {
  description = "Name of the question data S3 bucket."
  value       = module.question_data_bucket.bucket_name
}

# Frontend
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

output "github_frontend_deploy_role_arn" {
  description = "ARN of the GitHub Actions frontend deploy role."
  value       = module.github_frontend_deploy_role.role_arn
}

# ECR
output "backend_ecr_repository_arn" {
  description = "ARN of the backend ECR repository."
  value       = module.backend_ecr.repository_arn
}

output "backend_ecr_repository_name" {
  description = "Name of the backend ECR repository."
  value       = module.backend_ecr.repository_name
}

output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository."
  value       = module.backend_ecr.repository_url
}

output "github_backend_push_role_arn" {
  description = "ARN of the GitHub Actions backend push role."
  value       = module.github_backend_push_role.role_arn
}
