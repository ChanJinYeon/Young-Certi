provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "data_bucket_contract" {
  command = plan

  variables {
    name          = "young-certi-data-test"
    upload_prefix = "sap-c02/"
    tags = {
      Project = "young-certi"
      Purpose = "question-data"
    }
  }

  assert {
    condition     = module.bucket.bucket_name == "young-certi-data-test"
    error_message = "data bucket should use the requested name"
  }

  assert {
    condition     = module.bucket.versioning_status == "Enabled"
    error_message = "data bucket must be versioned"
  }

  assert {
    condition     = output.upload_prefix == "sap-c02/"
    error_message = "data bucket should expose the crawler upload prefix"
  }
}
