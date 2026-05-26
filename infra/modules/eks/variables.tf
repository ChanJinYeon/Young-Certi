variable "enabled" {
  description = "Whether to create the EKS and Karpenter resources."
  type        = bool
  default     = true
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version."
  type        = string
  default     = "1.33"
}

variable "subnet_ids" {
  description = "Subnet IDs where EKS and nodes run."
  type        = list(string)
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDR blocks allowed to reach the public Kubernetes API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "bootstrap_node_instance_types" {
  description = "Instance types for the small managed node group that hosts Karpenter."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "karpenter_chart_version" {
  description = "Karpenter Helm chart version."
  type        = string
  default     = "1.8.2"
}

variable "install_karpenter" {
  description = "Whether Terraform should install Karpenter via Helm."
  type        = bool
  default     = true
}

variable "manage_karpenter_manifests" {
  description = "Whether Terraform should create Karpenter EC2NodeClass and NodePool resources. Enable after the Karpenter CRDs exist."
  type        = bool
  default     = false
}

variable "karpenter_spot_instance_families" {
  description = "Instance families Karpenter may use for Spot nodes."
  type        = list(string)
  default     = ["t3", "t3a", "m6i", "m7i"]
}

variable "karpenter_spot_cpu_limit" {
  description = "Maximum aggregate CPU Karpenter may provision."
  type        = string
  default     = "16"
}

variable "tags" {
  description = "Tags to apply to AWS resources."
  type        = map(string)
  default     = {}
}
