output "bucket_name" {
  description = "S3 bucket name."
  value       = aws_s3_bucket.this.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN."
  value       = aws_s3_bucket.this.arn
}

output "versioning_status" {
  description = "Configured S3 bucket versioning status."
  value       = aws_s3_bucket_versioning.this.versioning_configuration[0].status
}

output "sse_algorithm" {
  description = "Default server-side encryption algorithm."
  value       = tolist(tolist(aws_s3_bucket_server_side_encryption_configuration.this.rule)[0].apply_server_side_encryption_by_default)[0].sse_algorithm
}

output "public_access_block_enabled" {
  description = "Whether all S3 public access block switches are enabled."
  value = (
    aws_s3_bucket_public_access_block.this.block_public_acls &&
    aws_s3_bucket_public_access_block.this.block_public_policy &&
    aws_s3_bucket_public_access_block.this.ignore_public_acls &&
    aws_s3_bucket_public_access_block.this.restrict_public_buckets
  )
}
