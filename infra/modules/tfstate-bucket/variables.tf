variable "name" {
  description = "Terraform state S3 bucket name."
  type        = string
}

variable "force_destroy" {
  description = "Whether Terraform may delete a non-empty tfstate bucket."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to the tfstate bucket."
  type        = map(string)
  default     = {}
}
