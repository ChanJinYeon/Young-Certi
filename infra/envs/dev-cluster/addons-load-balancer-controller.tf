################################################################
# AWS Load Balancer Controller 설치
################################################################
resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"     # release 이름 (지정))
  repository = "https://aws.github.io/eks-charts" # repository 이름 (정해짐)
  chart      = "aws-load-balancer-controller"     # load-balancer-controller chart
  namespace  = "kube-system"

  wait            = true # Kubernetes 리소스 준비 대기
  atomic          = true # 설치 실패 시 자동 rollback
  cleanup_on_fail = true # 설치 실패 시 생성된 리소스 정리
  timeout         = 600

  values = [ # install 시 args (공식 레퍼런스 참고: https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html)
    yamlencode({
      clusterName = module.eks.cluster_name
      region      = var.aws_region
      vpcId       = module.vpc.vpc_id

      serviceAccount = {
        create = true
        name   = "aws-load-balancer-controller"
      }
    })
  ]

  depends_on = [
    module.eks,
    aws_iam_role_policy_attachment.load_balancer_controller,
    aws_eks_pod_identity_association.load_balancer_controller,
  ]
}

################################################################
# Argo CD 설치
################################################################
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = "argocd"
  create_namespace = true

  wait            = true # Kubernetes 리소스 준비 대기
  atomic          = true # 설치 실패 시 자동 rollback
  cleanup_on_fail = true # 설치 실패 시 생성된 리소스 정리
  timeout         = 600

  values = [
    yamlencode({
      server = {
        service = {
          type = "ClusterIP"
        }
      }
    })
  ]

  depends_on = [
    helm_release.aws_load_balancer_controller
  ]
}

# Argo CD Application 적용
# EKS 클러스터가 만들어진 상태일 때만 작동하므로 제거
# 우선 수동으로 apply
# resource "kubernetes_manifest" "argocd_backend_application" {
#   manifest = yamldecode(
#     file("${path.module}/../../../k8s/argocd/backend-application.yaml")
#   )

#   depends_on = [
#     helm_release.argocd
#   ]
# }
