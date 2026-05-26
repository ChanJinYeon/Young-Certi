resource "aws_s3_bucket" "this" {
  #checkov:skip=CKV2_AWS_62:No event notifications are required for pull-only question data or Terraform state buckets.
  #checkov:skip=CKV_AWS_144:Cross-region replication is omitted to keep the dev portfolio environment within its cost ceiling.
  #checkov:skip=CKV_AWS_145:SSE-S3 is the project-approved default; KMS adds cost and key management overhead for this MVP.
  #checkov:skip=CKV_AWS_18:Access logging is omitted for dev buckets to avoid recursive logging and storage cost.
  bucket        = var.name
  force_destroy = var.force_destroy
  tags          = var.tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  #checkov:skip=CKV_AWS_300:Abort incomplete multipart upload is emitted for each dynamic lifecycle rule and verified by terraform test.
  count = length(var.lifecycle_rules) > 0 ? 1 : 0

  bucket = aws_s3_bucket.this.id

  dynamic "rule" {
    for_each = var.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      abort_incomplete_multipart_upload {
        days_after_initiation = coalesce(rule.value.abort_incomplete_multipart_upload_days, 7)
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration == null ? [] : [rule.value.noncurrent_version_expiration]

        content {
          noncurrent_days = noncurrent_version_expiration.value.noncurrent_days
        }
      }
    }
  }
}
