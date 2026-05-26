output "bucket_name" {
  description = "Terraform state bucket name."
  value       = module.bucket.bucket_name
}

output "bucket_arn" {
  description = "Terraform state bucket ARN."
  value       = module.bucket.bucket_arn
}

output "versioning_status" {
  description = "Terraform state bucket versioning status."
  value       = module.bucket.versioning_status
}

output "public_access_block_enabled" {
  description = "Whether public access is fully blocked."
  value       = module.bucket.public_access_block_enabled
}
