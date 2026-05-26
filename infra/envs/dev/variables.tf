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
