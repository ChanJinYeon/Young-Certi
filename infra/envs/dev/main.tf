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

module "github_oidc" {
  source = "../../modules/github-oidc"

  cloudfront_distribution_id = module.frontend_site.cloudfront_distribution_id
  frontend_bucket_name       = module.frontend_site.bucket_name
  github_branch              = var.github_branch
  github_repository          = var.github_repository
  role_name                  = "young-certi-dev-github-actions"

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "github-actions-oidc"
    ManagedBy   = "terraform"
  }
}
