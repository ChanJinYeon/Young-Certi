output "cluster_name" {
  description = "EKS cluster name."
  value       = var.enabled ? aws_eks_cluster.this[0].name : null
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint."
  value       = var.enabled ? aws_eks_cluster.this[0].endpoint : null
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded EKS cluster certificate authority data."
  value       = var.enabled ? aws_eks_cluster.this[0].certificate_authority[0].data : null
  sensitive   = true
}

output "node_role_arn" {
  description = "IAM role ARN used by managed and Karpenter-created nodes."
  value       = var.enabled ? aws_iam_role.node[0].arn : null
}

output "karpenter_controller_role_arn" {
  description = "IAM role ARN annotated on the Karpenter service account."
  value       = var.enabled ? aws_iam_role.karpenter_controller[0].arn : null
}

output "karpenter_interruption_queue_name" {
  description = "SQS queue name used by Karpenter for interruption handling."
  value       = var.enabled ? aws_sqs_queue.karpenter_interruption[0].name : null
}
