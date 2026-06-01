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

module "backend_ecr" {
  source = "../../modules/ecr-repository"

  repository_name      = var.backend_ecr_repository_name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "backend-image"
    ManagedBy   = "terraform"
  }
}

# Registry 단위 스캔
resource "aws_ecr_registry_scanning_configuration" "main" {
  scan_type = "BASIC"

  rule {
    scan_frequency = "SCAN_ON_PUSH"

    repository_filter {
      filter      = "young-certi-*"
      filter_type = "WILDCARD"
    }
  }
}
