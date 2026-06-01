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
