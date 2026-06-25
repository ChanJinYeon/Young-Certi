variable "aws_region" {
  description = "AWS region for dev cluster resources."
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "young-certi"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
}

variable "question_data_bucket_name" {
  description = "Name of the S3 bucket that stores question data for the backend API."
  type        = string
  default     = "young-certi-study"
}

################################################################
# ExternalDNS용 Variable
################################################################
# 수정할 수 있는 Route53 Hosted Zone
variable "hosted_zone_id" {
  description = "Route53 hosted zone ID that ExternalDNS can manage."
  type        = string
}

variable "external_dns_domain_filter" {
  description = "Domain suffix that ExternalDNS is allowed to manage."
  type        = string
  default     = "adansonia.cloud"
}
