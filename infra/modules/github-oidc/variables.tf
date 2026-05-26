variable "enabled" {
  description = "Whether to create the GitHub OIDC provider and role."
  type        = bool
  default     = true
}

variable "role_name" {
  description = "IAM role name assumed by GitHub Actions."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the role, in owner/name form."
  type        = string
}

variable "allowed_refs" {
  description = "Git refs allowed to assume the role."
  type        = list(string)
  default     = ["refs/heads/main"]
}

variable "policy_arns" {
  description = "Managed policy ARNs to attach to the role."
  type        = list(string)
  default     = []
}

variable "inline_policy_json" {
  description = "Optional inline policy JSON for the role."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources."
  type        = map(string)
  default     = {}
}
