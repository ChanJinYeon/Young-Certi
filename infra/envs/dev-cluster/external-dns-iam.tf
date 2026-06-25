################################################################
# ExternalDNS Pod Identity
################################################################
# Trust Policy Document
data "aws_iam_policy_document" "external_dns_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRole",
      "sts:TagSession",
    ]

    principals {
      type        = "Service"
      identifiers = ["pods.eks.amazonaws.com"]
    }
  }
}

# Permission Policy Document
data "aws_iam_policy_document" "external_dns" {
  statement {
    sid    = "AllowRoute53HostedZoneChanges"
    effect = "Allow"

    actions = [
      "route53:ChangeResourceRecordSets",
    ]

    resources = [
      "arn:aws:route53:::hostedzone/${var.hosted_zone_id}",
    ]
  }

  statement {
    sid    = "AllowRoute53Read"
    effect = "Allow"

    actions = [
      "route53:ListHostedZones",
      "route53:ListResourceRecordSets",
      "route53:ListTagsForResource",
    ]

    resources = [
      "*",
    ]
  }
}

# IAM Role 생성 - Trust Policy
resource "aws_iam_role" "external_dns" {
  name               = "${local.name}-external-dns"
  assume_role_policy = data.aws_iam_policy_document.external_dns_assume_role.json

  tags = merge(local.tags, {
    Purpose = "external-dns"
  })
}

# externalDNS가 사용할 Permission Policy
resource "aws_iam_policy" "external_dns" {
  name        = "${local.name}-external-dns"
  description = "Allow ExternalDNS to manage Route53 records for the selected hosted zone."
  policy      = data.aws_iam_policy_document.external_dns.json

  tags = merge(local.tags, {
    Purpose = "external-dns"
  })
}

# Role - Policy 연결
resource "aws_iam_role_policy_attachment" "external_dns" {
  role       = aws_iam_role.external_dns.name
  policy_arn = aws_iam_policy.external_dns.arn
}

# IAM Role - Kubernetes ServiceAccount 연결
resource "aws_eks_pod_identity_association" "external_dns" {
  cluster_name    = module.eks.cluster_name
  namespace       = "kube-system"
  service_account = "external-dns"
  role_arn        = aws_iam_role.external_dns.arn

  tags = merge(local.tags, {
    Purpose = "external-dns"
  })
}
