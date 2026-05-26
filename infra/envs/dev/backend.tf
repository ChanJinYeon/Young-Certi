# Bootstrap flow:
#
# 1. Keep this local backend for the first apply that creates the tfstate bucket.
# 2. Uncomment and fill the S3 backend below.
# 3. Run `terraform init -migrate-state`.
#
# terraform {
#   backend "s3" {
#     bucket       = "young-certi-tfstate-<account-id>-ap-northeast-2"
#     key          = "dev/terraform.tfstate"
#     region       = "ap-northeast-2"
#     encrypt      = true
#     use_lockfile = true
#   }
# }
