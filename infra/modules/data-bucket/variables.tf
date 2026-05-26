variable "name" {
  description = "Question data S3 bucket name."
  type        = string
}

variable "upload_prefix" {
  description = "Prefix where the crawler uploads question artifacts."
  type        = string
  default     = "sap-c02/"

  validation {
    condition     = can(regex("^[A-Za-z0-9][A-Za-z0-9._/-]*/$", var.upload_prefix))
    error_message = "upload_prefix must be a non-empty S3 prefix ending with '/'."
  }
}

variable "force_destroy" {
  description = "Whether Terraform may delete a non-empty data bucket."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to the data bucket."
  type        = map(string)
  default     = {}
}
