variable "bucket_name" {
  description = "Globally unique S3 bucket name for frontend static assets."
  type        = string
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_200"
}

variable "tags" {
  description = "Tags to apply to frontend resources."
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Whether S3 bucket versioning is enabled."
  type        = bool
  default     = true
}
