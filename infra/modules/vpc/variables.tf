variable "enabled" {
  description = "Whether to create the VPC resources."
  type        = bool
  default     = true
}

variable "name" {
  description = "Name prefix for VPC resources."
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name used for Kubernetes and Karpenter discovery tags."
  type        = string
}

variable "cidr_block" {
  description = "IPv4 CIDR block for the VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnets" {
  description = "Map of availability zone name to public subnet CIDR block."
  type        = map(string)
  default = {
    ap-northeast-2a = "10.42.0.0/20"
    ap-northeast-2c = "10.42.16.0/20"
  }
}

variable "tags" {
  description = "Tags to apply to all VPC resources."
  type        = map(string)
  default     = {}
}
