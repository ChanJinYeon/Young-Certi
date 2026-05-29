variable "allowed_refs" { // 허용할 branch
  description = "Git refs allowed to assume this role, such as refs/heads/main."
  type        = list(string)
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPO format."
  type        = string
}

variable "oidc_provider_arn" { # infra/modules/github-oidc-provider의 ARN
  description = "ARN of the GitHub Actions OIDC provider."
  type        = string
}

variable "policy_arns" { # IAM Policy ARN
  description = "Managed IAM policy ARNs to attach to this role."
  type        = map(string)
  default     = {}
}

variable "role_name" {
  description = "IAM role name for GitHub Actions."
  type        = string
}

variable "tags" {
  description = "Tags to apply to IAM role resources."
  type        = map(string)
  default     = {}
}
