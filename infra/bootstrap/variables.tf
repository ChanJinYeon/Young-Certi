variable "aws_region" {
  description = "AWS region for bootstrap resources."
  type        = string
  default     = "ap-northeast-2"
}

variable "tfstate_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform state."
  type        = string
}
