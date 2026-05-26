output "bucket_name" {
  description = "Question data bucket name."
  value       = module.bucket.bucket_name
}

output "bucket_arn" {
  description = "Question data bucket ARN."
  value       = module.bucket.bucket_arn
}

output "versioning_status" {
  description = "Question data bucket versioning status."
  value       = module.bucket.versioning_status
}

output "upload_prefix" {
  description = "Crawler upload prefix for question artifacts."
  value       = var.upload_prefix
}

output "questions_key" {
  description = "Default key for the merged SAP-C02 question pool."
  value       = "${var.upload_prefix}questions.json"
}
