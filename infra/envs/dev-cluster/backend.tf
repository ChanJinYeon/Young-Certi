terraform {
  backend "s3" {
    bucket       = "young-certi-tfstate-study"
    key          = "dev/cluster/terraform.tfstate"
    region       = "ap-northeast-2"
    encrypt      = true
    use_lockfile = true
  }
}
