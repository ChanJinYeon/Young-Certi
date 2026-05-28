variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID that GitHub Actions can invalidate."
  type        = string
}

variable "frontend_bucket_name" {
  description = "Frontend S3 bucket name that GitHub Actions can deploy to."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to assume this role."
  type        = string
  default     = "main"
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPO format."
  type        = string
}

variable "role_name" {
  description = "IAM role name for GitHub Actions."
  type        = string
}

variable "tags" {
  description = "Tags to apply to IAM resources."
  type        = map(string)
  default     = {}
}
