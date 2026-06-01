################################################################
# VPC
################################################################
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = "${var.project_name}-${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.6.1"

  name = "${local.name}-vpc"
  cidr = "10.10.0.0/16"

  azs             = local.azs
  private_subnets = ["10.10.1.0/24", "10.10.2.0/24"]
  public_subnets  = ["10.10.101.0/24", "10.10.102.0/24"]

  enable_dns_hostnames = true # VPC 안에서 AWS DNS resolver 사용 여부
  enable_dns_support   = true # EC2 인스턴스에 DNS hostname 부여

  enable_nat_gateway = true
  single_nat_gateway = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = local.tags
}

################################################################
# EKS
################################################################
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name = "${local.name}-eks"

  kubernetes_version = "1.34" # Kubernetes 버전

  # 로컬 PC에서 kubectl, terraform으로 접근하기 쉽게 EKS API endpoint를 public으로 설정
  # prod에서는 CIDR 제한 필수
  endpoint_public_access = true

  # 현재 terraform apply를 실행한 AWS IAM 주체에게 클러스터 관리자 권한을 부여
  # kubectl 접근 권한이 없어 막히는 상황 방지
  enable_cluster_creator_admin_permissions = true

  addons = {
    coredns = {}

    eks-pod-identity-agent = { # Pod가 AWS 권한을 안전하게 쓸 때 사용
      # EKS Managed Node Group이 만들어지기 전에 add-on 생성
      # 노드가 뜨기 전에 네트워크/Pod Identity 기반이 먼저 준비되어야 해서 사용
      before_compute = true
    }

    kube-proxy = {} # Kubernetes Service 네트워크 라우팅 담당

    vpc-cni = { # Pod 네트워킹 담당
      # EKS Managed Node Group이 만들어지기 전에 add-on 생성
      # 노드가 뜨기 전에 네트워크/Pod Identity 기반이 먼저 준비되어야 해서 사용
      before_compute = true
    }
  }

  vpc_id = module.vpc.vpc_id # EKS 클러스터를 배치할 VPC

  subnet_ids = module.vpc.private_subnets # 워커 노드는 private subnet에 배치 (ingress로 접근)

  eks_managed_node_groups = {
    default = {
      ami_type = "AL2023_x86_64_STANDARD" # EKS 1.30부터 AL2023 계열이 기본 방향

      instance_types = ["t3.medium"]

      min_size     = 1
      max_size     = 2
      desired_size = 1 # 비용 절감
    }
  }

  tags = local.tags
}
