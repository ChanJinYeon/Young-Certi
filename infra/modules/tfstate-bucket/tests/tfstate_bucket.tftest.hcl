provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "tfstate_bucket_contract" {
  command = plan

  variables {
    name = "young-certi-tfstate-test"
    tags = {
      Project = "young-certi"
      Purpose = "terraform-state"
    }
  }

  assert {
    condition     = module.bucket.bucket_name == "young-certi-tfstate-test"
    error_message = "tfstate bucket should use the requested name"
  }

  assert {
    condition     = module.bucket.versioning_status == "Enabled"
    error_message = "tfstate bucket must be versioned"
  }

  assert {
    condition     = module.bucket.public_access_block_enabled
    error_message = "tfstate bucket must block public access"
  }
}
