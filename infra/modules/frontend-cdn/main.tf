locals {
  origin_id          = "${var.name}-s3-origin"
  s3_origin_domain   = "${module.bucket.bucket_name}.s3.amazonaws.com"
  cache_policy_id    = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  headers_policy_id  = "67f7725c-6f97-4210-82d7-5512b31e9d03"
  cloudfront_comment = "YoungCerti frontend SPA"
}

module "bucket" {
  source = "../s3-bucket"

  name          = var.name
  versioning    = true
  force_destroy = var.force_destroy
  tags = merge(var.tags, {
    Purpose = "frontend-static-assets"
  })
}

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.name}-oac"
  description                       = "Allow CloudFront to read the private frontend bucket."
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  #checkov:skip=CKV_AWS_68:WAF is omitted for the cost-capped portfolio dev environment.
  #checkov:skip=CKV_AWS_174:The default CloudFront certificate is used for the generated domain in the MVP; no custom TLS certificate is managed yet.
  #checkov:skip=CKV_AWS_86:CloudFront access logs are omitted to avoid S3 storage cost for the MVP.
  #checkov:skip=CKV_AWS_310:Origin failover is unnecessary for a single-region static SPA bucket.
  #checkov:skip=CKV_AWS_374:Geo restriction is intentionally disabled so the portfolio can be reviewed globally.
  #checkov:skip=CKV2_AWS_32:The distribution attaches AWS managed SecurityHeadersPolicy in default_cache_behavior; Checkov does not detect the managed policy ID here.
  #checkov:skip=CKV2_AWS_42:A custom certificate is deferred until a custom domain is introduced.
  #checkov:skip=CKV2_AWS_47:WAF managed rule groups are deferred to keep the MVP within its cost ceiling.
  enabled             = true
  is_ipv6_enabled     = true
  comment             = local.cloudfront_comment
  default_root_object = var.default_root_object
  price_class         = var.price_class
  tags                = var.tags

  origin {
    domain_name              = local.s3_origin_domain
    origin_id                = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = local.cache_policy_id
    compress                   = true
    response_headers_policy_id = local.headers_policy_id
    target_origin_id           = local.origin_id
    viewer_protocol_policy     = "redirect-to-https"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}

data "aws_iam_policy_document" "bucket_read" {
  statement {
    sid     = "AllowCloudFrontRead"
    actions = ["s3:GetObject"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    resources = ["${module.bucket.bucket_arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudfront_read" {
  bucket = module.bucket.bucket_name
  policy = data.aws_iam_policy_document.bucket_read.json
}
