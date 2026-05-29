variable "tags" {
  description = "Tags to apply to the GitHub OIDC provider."
  type        = map(string)
  default     = {}
}
