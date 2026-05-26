output "bucket_name" {
  description = "Private S3 bucket name that stores frontend static assets."
  value       = module.bucket.bucket_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.this.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cors_allowed_origin" {
  description = "Origin string to allow in backend CORS configuration."
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}
