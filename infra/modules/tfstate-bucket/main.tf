module "bucket" {
  source = "../s3-bucket"

  name          = var.name
  versioning    = true
  force_destroy = var.force_destroy
  lifecycle_rules = [
    {
      id                                     = "retain-old-state-versions"
      enabled                                = true
      abort_incomplete_multipart_upload_days = 7
      noncurrent_version_expiration = {
        noncurrent_days = 90
      }
    }
  ]
  tags = merge(var.tags, {
    ManagedBy = "terraform"
    Purpose   = "terraform-state"
  })
}
