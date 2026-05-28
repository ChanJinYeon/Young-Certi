output "bucket_name" {
  description = "Name of the frontend S3 bucket."
  value       = aws_s3_bucket.main.bucket
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution."
  value       = aws_cloudfront_distribution.main.domain_name
}
