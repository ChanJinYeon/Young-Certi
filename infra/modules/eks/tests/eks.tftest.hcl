provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

provider "helm" {
  kubernetes {
    host                   = "https://127.0.0.1"
    cluster_ca_certificate = ""
    token                  = "test"
  }
}

provider "kubernetes" {
  host                   = "https://127.0.0.1"
  cluster_ca_certificate = ""
  token                  = "test"
}

run "disabled_creates_no_cluster_resources" {
  command = plan

  variables {
    enabled      = false
    cluster_name = "young-certi-test"
    subnet_ids   = []
  }

  assert {
    condition     = length(aws_eks_cluster.this) == 0
    error_message = "disabled module should not create an EKS cluster"
  }

  assert {
    condition     = length(aws_eks_node_group.bootstrap) == 0
    error_message = "disabled module should not create a bootstrap node group"
  }

  assert {
    condition     = output.cluster_name == null
    error_message = "disabled module should expose a null cluster name"
  }
}

run "cluster_and_karpenter_controller_contract" {
  command = plan

  variables {
    enabled                              = true
    cluster_name                         = "young-certi-test"
    subnet_ids                           = ["subnet-00000000000000001", "subnet-00000000000000002"]
    cluster_endpoint_public_access_cidrs = ["203.0.113.10/32"]
    install_karpenter                    = true
    manage_karpenter_manifests           = false
    tags = {
      Project = "young-certi"
    }
  }

  assert {
    condition     = aws_eks_cluster.this[0].name == "young-certi-test"
    error_message = "EKS cluster should use the requested cluster name"
  }

  assert {
    condition     = aws_eks_cluster.this[0].access_config[0].authentication_mode == "API_AND_CONFIG_MAP"
    error_message = "EKS cluster should support API access entries and the config map during migration"
  }

  assert {
    condition     = aws_eks_cluster.this[0].vpc_config[0].public_access_cidrs == toset(["203.0.113.10/32"])
    error_message = "EKS public endpoint CIDRs should come from the module input"
  }

  assert {
    condition     = aws_eks_node_group.bootstrap[0].capacity_type == "ON_DEMAND"
    error_message = "bootstrap node group should stay on on-demand capacity for Karpenter stability"
  }

  assert {
    condition     = helm_release.karpenter[0].namespace == "kube-system"
    error_message = "Karpenter should be installed into kube-system"
  }

  assert {
    condition     = length(kubernetes_manifest.karpenter_spot_node_pool) == 0
    error_message = "Karpenter NodePool should be omitted until CRDs have been installed"
  }
}
