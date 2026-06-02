variable "aws_region" {
  description = "AWS region for dev resources."
  type        = string
  default     = "ap-northeast-2"
}

variable "question_data_bucket_name" {
  description = "Globally unique S3 bucket name for question data."
  type        = string
}

variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for frontend site."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to deploy frontend."
  type        = string
  default     = "main"
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPO format."
  type        = string
}

variable "backend_ecr_repository_name" {
  description = "Name of the backend ECR repository."
  type        = string
  default     = "young-certi-backend"
}

################################################################
# CloudFront
################################################################
variable "frontend_domain_name" {
  description = "Custom domain name for the frontend CloudFront distribution."
  type        = string
}

variable "frontend_acm_certificate_arn" {
  description = "ACM certificate ARN for the frontend CloudFront distribution. Must be issued in us-east-1."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for adansonia.cloud."
  type        = string
}
