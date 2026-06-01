variable "force_delete" { # 삭제 시 ECR 내부에 이미지가 있어도 강제 삭제할지
  description = "Whether to delete the repository even if it contains images."
  type        = bool
  default     = false
}

variable "image_tag_mutability" { # ECR 태그를 덮어 쓸 수 있는지
  description = "Whether image tags are mutable or immutable."
  type        = string
  default     = "IMMUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be MUTABLE or IMMUTABLE."
  }
}

variable "repository_name" {
  description = "Name of the ECR repository."
  type        = string
}

variable "tags" {
  description = "Tags to apply to the ECR repository."
  type        = map(string)
  default     = {}
}
