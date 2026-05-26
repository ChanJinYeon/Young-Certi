# Bootstrap flow:
#
# 1. Create the tfstate bucket once with `terraform init -backend=false`.
# 2. For CI, create a generated backend file before init:
#    terraform {
#      backend "s3" {}
#    }
# 3. Re-run init with backend config:
#    terraform init \
#      -backend-config="bucket=young-certi-dev-<account-id>-ap-northeast-2-tfstate" \
#      -backend-config="key=dev/terraform.tfstate" \
#      -backend-config="region=ap-northeast-2" \
#      -backend-config="encrypt=true" \
#      -backend-config="use_lockfile=true" \
#      -migrate-state
# 4. CI must always use the same generated backend and backend config for apply/destroy.
