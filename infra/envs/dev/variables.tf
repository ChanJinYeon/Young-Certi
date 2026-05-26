variable "project" {
  description = "Project name used in resource names and tags."
  type        = string
  default     = "young-certi"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for S3 resources."
  type        = string
  default     = "ap-northeast-2"
}

variable "account_id" {
  description = "AWS account ID used to make globally unique bucket names."
  type        = string
  default     = "000000000000"

  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "account_id must be a 12 digit AWS account ID."
  }
}

variable "question_upload_prefix" {
  description = "Prefix where crawler uploads question artifacts."
  type        = string
  default     = "sap-c02/"
}

variable "force_destroy_buckets" {
  description = "Whether Terraform may delete non-empty buckets in dev."
  type        = bool
  default     = false
}

variable "budget_alert_email" {
  description = "Email address for AWS Budget notifications."
  type        = string
  default     = "young-certi@example.com"
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS budget limit in USD."
  type        = string
  default     = "30"
}

variable "skip_credentials_validation" {
  description = "Use fake credentials and skip AWS credential validation for local plan-only checks."
  type        = bool
  default     = true
}

variable "enable_ephemeral_cluster" {
  description = "Explicitly create the cost-bearing EKS/Karpenter stack."
  type        = bool
  default     = false
}

variable "enable_frontend_cdn" {
  description = "Explicitly create the frontend S3 and CloudFront distribution."
  type        = bool
  default     = false
}

variable "frontend_force_destroy" {
  description = "Whether Terraform may delete the non-empty frontend asset bucket."
  type        = bool
  default     = false
}

variable "manage_karpenter_manifests" {
  description = "Create Karpenter EC2NodeClass and NodePool manifests after Karpenter CRDs are installed."
  type        = bool
  default     = false
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDR blocks allowed to reach the public EKS API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "vpc_cidr_block" {
  description = "CIDR block for the dev EKS VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "vpc_public_subnets" {
  description = "Availability-zone-to-CIDR map for public EKS subnets."
  type        = map(string)
  default = {
    ap-northeast-2a = "10.42.0.0/20"
    ap-northeast-2c = "10.42.16.0/20"
  }
}

variable "enable_github_oidc" {
  description = "Create the GitHub Actions OIDC role. This is normally bootstrapped once with operator credentials."
  type        = bool
  default     = false
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the CI role, in owner/name form."
  type        = string
  default     = "adansonia/young-certi"
}

variable "github_allowed_refs" {
  description = "Git refs allowed to assume the CI role."
  type        = list(string)
  default     = ["refs/heads/main", "refs/heads/001-question-practice"]
}
