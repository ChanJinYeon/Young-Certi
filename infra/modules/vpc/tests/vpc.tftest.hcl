provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "disabled_creates_no_vpc_resources" {
  command = plan

  variables {
    enabled      = false
    name         = "young-certi-vpc-test"
    cluster_name = "young-certi-test"
  }

  assert {
    condition     = length(aws_vpc.this) == 0
    error_message = "disabled module should not create a VPC"
  }

  assert {
    condition     = length(aws_subnet.public) == 0
    error_message = "disabled module should not create public subnets"
  }

  assert {
    condition     = output.vpc_id == null
    error_message = "disabled module should expose a null VPC ID"
  }
}

run "public_subnet_discovery_contract" {
  command = plan

  variables {
    enabled      = true
    name         = "young-certi-vpc-test"
    cluster_name = "young-certi-test"
    cidr_block   = "10.50.0.0/16"
    public_subnets = {
      ap-northeast-2a = "10.50.0.0/20"
      ap-northeast-2c = "10.50.16.0/20"
    }
    tags = {
      Project = "young-certi"
    }
  }

  assert {
    condition     = aws_vpc.this[0].cidr_block == "10.50.0.0/16"
    error_message = "VPC should use the requested CIDR block"
  }

  assert {
    condition     = length(aws_subnet.public) == 2
    error_message = "VPC module should create one public subnet per requested AZ"
  }

  assert {
    condition     = aws_subnet.public["ap-northeast-2a"].tags["karpenter.sh/discovery"] == "young-certi-test"
    error_message = "public subnets should be tagged for Karpenter discovery"
  }

  assert {
    condition     = aws_subnet.public["ap-northeast-2a"].tags["kubernetes.io/cluster/young-certi-test"] == "shared"
    error_message = "public subnets should be tagged for Kubernetes cluster discovery"
  }
}
