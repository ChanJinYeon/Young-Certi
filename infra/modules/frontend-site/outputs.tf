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

output "bucket_arn" {
  description = "ARN of the frontend S3 bucket."
  value       = aws_s3_bucket.main.arn
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID."
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}
