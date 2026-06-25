provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host = module.eks.cluster_endpoint # k8s API 서버 주소

  # TLS 인증서를 검증하기 위한 CA 인증서
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec { # EKS Cluster 접속용 임시 토큰 발급
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"

    args = [
      "eks",
      "get-token",
      "--region",
      var.aws_region,
      "--cluster-name",
      module.eks.cluster_name,
    ]
  }
}

provider "helm" {
  kubernetes = {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec = {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"

      args = [
        "eks",
        "get-token",
        "--region",
        var.aws_region,
        "--cluster-name",
        module.eks.cluster_name,
      ]
    }
  }
}
