# Bootstrap and remote-state migration notes:
#
# 1. Apply this module from a temporary local backend to create the tfstate bucket.
# 2. Add an S3 backend block to the root environment that will store state there.
# 3. Run `terraform init -migrate-state` from that root environment.
#
# Example root backend configuration:
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
