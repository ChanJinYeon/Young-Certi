variable "name" {
  description = "Globally unique S3 bucket name and CloudFront resource prefix."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.name))
    error_message = "name must be a valid S3 bucket name."
  }
}

variable "default_root_object" {
  description = "Default object CloudFront returns for the SPA."
  type        = string
  default     = "index.html"
}

variable "force_destroy" {
  description = "Whether Terraform may delete a non-empty frontend bucket."
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class for the frontend distribution."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition = contains([
      "PriceClass_100",
      "PriceClass_200",
      "PriceClass_All",
    ], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "tags" {
  description = "Tags to apply to frontend CDN resources."
  type        = map(string)
  default     = {}
}
