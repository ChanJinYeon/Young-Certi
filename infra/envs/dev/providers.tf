provider "aws" {
  region = var.aws_region

  access_key                  = var.skip_credentials_validation ? "test" : null
  secret_key                  = var.skip_credentials_validation ? "test" : null
  skip_credentials_validation = var.skip_credentials_validation
  skip_metadata_api_check     = var.skip_credentials_validation
  skip_requesting_account_id  = var.skip_credentials_validation
}

provider "helm" {
  kubernetes {
    host                   = var.enable_ephemeral_cluster ? module.eks.cluster_endpoint : "https://127.0.0.1"
    cluster_ca_certificate = var.enable_ephemeral_cluster ? base64decode(module.eks.cluster_certificate_authority_data) : ""
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", local.cluster_name, "--region", var.aws_region]
    }
  }
}

provider "kubernetes" {
  host                   = var.enable_ephemeral_cluster ? module.eks.cluster_endpoint : "https://127.0.0.1"
  cluster_ca_certificate = var.enable_ephemeral_cluster ? base64decode(module.eks.cluster_certificate_authority_data) : ""
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", local.cluster_name, "--region", var.aws_region]
  }
}
