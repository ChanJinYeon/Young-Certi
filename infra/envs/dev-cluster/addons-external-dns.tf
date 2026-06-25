################################################################
# ExternalDNS Helm Release
################################################################
# Ingress 생성 시 Route53 DNS 레코드 갱신하는 컨트롤러
resource "helm_release" "external_dns" {
  name       = "external-dns"
  repository = "https://kubernetes-sigs.github.io/external-dns/"
  chart      = "external-dns"
  namespace  = "kube-system"

  wait            = true
  atomic          = true
  cleanup_on_fail = true
  timeout         = 600

  values = [
    yamlencode({
      provider = {
        name = "aws"
      }

      policy = "upsert-only" # DNS 관리 방식 (upsert-only, create-only, sync)

      sources = [ # 감시할 리소스 (externalDNS annotation)
        "ingress",
      ]

      domainFilters = [ # externalDNS가 관리할 도메인 범위 제한
        var.external_dns_domain_filter,
      ]

      registry   = "txt" # DNS 레코드의 소유권 정보 저장 방식 (txt, dynamodb, aws-sd, ...)
      txtOwnerId = "${local.name}-external-dns"

      serviceAccount = { # ServiceAccount 생성 (반드시 Pod Identity Association과 같아야 함)
        create = true
        name   = "external-dns"
      }
    })
  ]

  depends_on = [
    helm_release.aws_load_balancer_controller,
    aws_iam_role_policy_attachment.external_dns,
    aws_eks_pod_identity_association.external_dns,
  ]
}
