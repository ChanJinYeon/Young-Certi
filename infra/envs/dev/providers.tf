provider "aws" {
  region = var.aws_region

  access_key                  = var.skip_credentials_validation ? "test" : null
  secret_key                  = var.skip_credentials_validation ? "test" : null
  skip_credentials_validation = var.skip_credentials_validation
  skip_metadata_api_check     = var.skip_credentials_validation
  skip_requesting_account_id  = var.skip_credentials_validation
}
