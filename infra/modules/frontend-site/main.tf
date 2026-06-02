resource "aws_s3_bucket" "main" {
  bucket = var.bucket_name

  tags = var.tags
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.bucket_name}-oac"
  description                       = "OAC for ${var.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = var.price_class # 어느 edge locaion까지 다룰지 (100, 200, all)

  origin {                                                                    # 어느 s3에서 파일을 가져올지
    domain_name              = aws_s3_bucket.main.bucket_regional_domain_name # 정적 웹사이트 엔드포인트
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id   # OAC 연결
    origin_id                = "s3-${aws_s3_bucket.main.bucket}"              # 식별자 (사용자 정의)
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-${aws_s3_bucket.main.bucket}"

    viewer_protocol_policy = "redirect-to-https" # HTTPS
    compress               = true                # 자동 압축 (gzip 지원)

    forwarded_values {
      query_string = false # 쿼리스트링 캐시에 포함 X (?p=2 ?p=3 모두 동일한 객체 취급)

      cookies {
        forward = "none"
      }
    }
  }

  # Vite SPA에서 /exams/sap-c02 같은 경로로 직접 접속해도 CloudFront가 index.html을 반환하도록 처리
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # CloudFront - Domain 연결 (정보만 제공)
  # DNS 입장에서는 해당 정보를 모르기 때문에 infra/envs/dev-foundation/dns.tf 작성
  # route53에 레코드 만드는 것 (Alias)
  aliases = [
    var.domain_name
  ]

  viewer_certificate {
    # 기존: cloudfront_default_certificate = true
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = var.tags
}

resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"

        Principal = {
          Service = "cloudfront.amazonaws.com"
        }

        Action = "s3:GetObject"

        Resource = "${aws_s3_bucket.main.arn}/*"

        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}
