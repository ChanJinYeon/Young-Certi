module "question_data_bucket" {
  source = "../../modules/s3-bucket"

  bucket_name        = var.question_data_bucket_name
  force_destroy      = true
  versioning_enabled = true

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "question-data"
    ManagedBy   = "terraform"
  }
}

module "frontend_site" {
  source = "../../modules/frontend-site"

  bucket_name = var.frontend_bucket_name

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "frontend-site"
    ManagedBy   = "terraform"
  }
}
