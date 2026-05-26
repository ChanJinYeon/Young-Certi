provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "versioned_bucket_contract" {
  command = plan

  variables {
    name          = "young-certi-test-versioned"
    versioning    = true
    force_destroy = true
    lifecycle_rules = [
      {
        id                                     = "expire-old-versions"
        enabled                                = true
        abort_incomplete_multipart_upload_days = 7
        noncurrent_version_expiration = {
          noncurrent_days = 30
        }
      }
    ]
  }

  assert {
    condition     = aws_s3_bucket.this.bucket == "young-certi-test-versioned"
    error_message = "bucket name should match the name variable"
  }

  assert {
    condition     = aws_s3_bucket_versioning.this.versioning_configuration[0].status == "Enabled"
    error_message = "versioning should be enabled"
  }

  assert {
    condition     = tolist(tolist(aws_s3_bucket_server_side_encryption_configuration.this.rule)[0].apply_server_side_encryption_by_default)[0].sse_algorithm == "AES256"
    error_message = "bucket should use SSE-S3"
  }

  assert {
    condition = (
      aws_s3_bucket_public_access_block.this.block_public_acls &&
      aws_s3_bucket_public_access_block.this.block_public_policy &&
      aws_s3_bucket_public_access_block.this.ignore_public_acls &&
      aws_s3_bucket_public_access_block.this.restrict_public_buckets
    )
    error_message = "bucket should block all public access"
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this[0].rule[0].noncurrent_version_expiration[0].noncurrent_days == 30
    error_message = "lifecycle rule should expire noncurrent versions after 30 days"
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this[0].rule[0].abort_incomplete_multipart_upload[0].days_after_initiation == 7
    error_message = "lifecycle rule should abort incomplete multipart uploads after 7 days"
  }
}

run "unversioned_bucket_contract" {
  command = plan

  variables {
    name            = "young-certi-test-unversioned"
    versioning      = false
    force_destroy   = false
    lifecycle_rules = []
  }

  assert {
    condition     = aws_s3_bucket_versioning.this.versioning_configuration[0].status == "Suspended"
    error_message = "versioning should be suspended when disabled"
  }

  assert {
    condition     = length(aws_s3_bucket_lifecycle_configuration.this) == 0
    error_message = "lifecycle configuration should be omitted when no rules are provided"
  }
}
