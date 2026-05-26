provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "frontend_cdn_contract" {
  command = plan

  variables {
    name          = "young-certi-frontend-test"
    force_destroy = true
    tags = {
      Project = "young-certi"
    }
  }

  assert {
    condition     = module.bucket.bucket_name == "young-certi-frontend-test"
    error_message = "frontend CDN should reuse the private S3 bucket module"
  }

  assert {
    condition     = aws_cloudfront_origin_access_control.this.name == "young-certi-frontend-test-oac"
    error_message = "frontend CDN should create a CloudFront origin access control"
  }

  assert {
    condition     = aws_cloudfront_distribution.this.enabled
    error_message = "frontend CDN distribution should be enabled"
  }

  assert {
    condition     = aws_cloudfront_distribution.this.default_root_object == "index.html"
    error_message = "frontend CDN should serve the SPA index as the default root object"
  }
}
