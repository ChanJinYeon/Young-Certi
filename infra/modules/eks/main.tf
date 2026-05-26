locals {
  create_karpenter_manifests = var.enabled && var.manage_karpenter_manifests
  oidc_issuer_host           = var.enabled ? replace(aws_eks_cluster.this[0].identity[0].oidc[0].issuer, "https://", "") : ""
}

data "aws_iam_policy_document" "eks_cluster_assume_role" {
  count = var.enabled ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster" {
  count = var.enabled ? 1 : 0

  name               = "${var.cluster_name}-cluster"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume_role[0].json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "cluster" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.cluster[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "this" {
  count = var.enabled ? 1 : 0

  name     = var.cluster_name
  role_arn = aws_iam_role.cluster[0].arn
  version  = var.kubernetes_version

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.cluster_endpoint_public_access_cidrs
    subnet_ids              = var.subnet_ids
  }

  tags = merge(var.tags, {
    "karpenter.sh/discovery" = var.cluster_name
  })

  depends_on = [aws_iam_role_policy_attachment.cluster]
}

data "aws_iam_policy_document" "node_assume_role" {
  count = var.enabled ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  count = var.enabled ? 1 : 0

  name               = "${var.cluster_name}-node"
  assume_role_policy = data.aws_iam_policy_document.node_assume_role[0].json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.node[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.node[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.node[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "node_ssm" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.node[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_eks_node_group" "bootstrap" {
  count = var.enabled ? 1 : 0

  cluster_name    = aws_eks_cluster.this[0].name
  node_group_name = "${var.cluster_name}-bootstrap"
  node_role_arn   = aws_iam_role.node[0].arn
  subnet_ids      = var.subnet_ids
  ami_type        = "AL2023_x86_64_STANDARD"
  capacity_type   = "ON_DEMAND"
  instance_types  = var.bootstrap_node_instance_types

  scaling_config {
    desired_size = 1
    max_size     = 1
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    workload = "system"
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.node_worker,
    aws_iam_role_policy_attachment.node_cni,
    aws_iam_role_policy_attachment.node_ecr,
    aws_iam_role_policy_attachment.node_ssm,
  ]
}

resource "aws_ec2_tag" "cluster_security_group_karpenter_discovery" {
  count = var.enabled ? 1 : 0

  resource_id = aws_eks_cluster.this[0].vpc_config[0].cluster_security_group_id
  key         = "karpenter.sh/discovery"
  value       = var.cluster_name
}

resource "aws_eks_addon" "vpc_cni" {
  count = var.enabled ? 1 : 0

  cluster_name                = aws_eks_cluster.this[0].name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

resource "aws_eks_addon" "coredns" {
  count = var.enabled ? 1 : 0

  cluster_name                = aws_eks_cluster.this[0].name
  addon_name                  = "coredns"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [aws_eks_node_group.bootstrap]
}

resource "aws_eks_addon" "kube_proxy" {
  count = var.enabled ? 1 : 0

  cluster_name                = aws_eks_cluster.this[0].name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

resource "aws_iam_openid_connect_provider" "eks" {
  count = var.enabled ? 1 : 0

  url             = aws_eks_cluster.this[0].identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da0ecd8d8c0"]

  tags = var.tags
}

data "aws_iam_policy_document" "karpenter_assume_role" {
  count = var.enabled ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks[0].arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer_host}:sub"
      values   = ["system:serviceaccount:kube-system:karpenter"]
    }
  }
}

resource "aws_iam_role" "karpenter_controller" {
  count = var.enabled ? 1 : 0

  name               = "${var.cluster_name}-karpenter-controller"
  assume_role_policy = data.aws_iam_policy_document.karpenter_assume_role[0].json
  tags               = var.tags
}

data "aws_iam_policy_document" "karpenter_controller" {
  count = var.enabled ? 1 : 0

  statement {
    sid = "AllowKarpenterToManageCompute"
    actions = [
      "ec2:CreateFleet",
      "ec2:CreateLaunchTemplate",
      "ec2:CreateTags",
      "ec2:DeleteLaunchTemplate",
      "ec2:DescribeAvailabilityZones",
      "ec2:DescribeImages",
      "ec2:DescribeInstanceTypeOfferings",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeInstances",
      "ec2:DescribeLaunchTemplates",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSpotPriceHistory",
      "ec2:DescribeSubnets",
      "ec2:RunInstances",
      "ec2:TerminateInstances",
      "pricing:GetProducts",
      "ssm:GetParameter",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "AllowPassingNodeRole"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.node[0].arn]
  }

  statement {
    sid       = "AllowInterruptionQueue"
    actions   = ["sqs:DeleteMessage", "sqs:GetQueueUrl", "sqs:ReceiveMessage"]
    resources = [aws_sqs_queue.karpenter_interruption[0].arn]
  }

  statement {
    sid       = "AllowEksDescribe"
    actions   = ["eks:DescribeCluster"]
    resources = [aws_eks_cluster.this[0].arn]
  }
}

resource "aws_iam_policy" "karpenter_controller" {
  count = var.enabled ? 1 : 0

  name   = "${var.cluster_name}-karpenter-controller"
  policy = data.aws_iam_policy_document.karpenter_controller[0].json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "karpenter_controller" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.karpenter_controller[0].name
  policy_arn = aws_iam_policy.karpenter_controller[0].arn
}

resource "aws_sqs_queue" "karpenter_interruption" {
  count = var.enabled ? 1 : 0

  name                      = "${var.cluster_name}-karpenter-interruption"
  message_retention_seconds = 300
  sqs_managed_sse_enabled   = true
  tags                      = var.tags
}

resource "aws_cloudwatch_event_rule" "karpenter_interruption" {
  for_each = var.enabled ? {
    health      = "AWS Health Event"
    rebalance   = "EC2 Instance Rebalance Recommendation"
    spot        = "EC2 Spot Instance Interruption Warning"
    statechange = "EC2 Instance State-change Notification"
  } : {}

  name        = "${var.cluster_name}-karpenter-${each.key}"
  description = "Forward ${each.value} events to Karpenter."

  event_pattern = jsonencode({
    source        = each.key == "health" ? ["aws.health"] : ["aws.ec2"]
    "detail-type" = [each.value]
  })

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "karpenter_interruption" {
  for_each = aws_cloudwatch_event_rule.karpenter_interruption

  rule      = each.value.name
  target_id = "KarpenterInterruptionQueue"
  arn       = aws_sqs_queue.karpenter_interruption[0].arn
}

data "aws_iam_policy_document" "karpenter_interruption_queue" {
  count = var.enabled ? 1 : 0

  statement {
    sid     = "AllowEventBridgeToSendMessages"
    actions = ["sqs:SendMessage"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    resources = [aws_sqs_queue.karpenter_interruption[0].arn]
  }
}

resource "aws_sqs_queue_policy" "karpenter_interruption" {
  count = var.enabled ? 1 : 0

  queue_url = aws_sqs_queue.karpenter_interruption[0].id
  policy    = data.aws_iam_policy_document.karpenter_interruption_queue[0].json
}

resource "helm_release" "karpenter" {
  count = var.enabled && var.install_karpenter ? 1 : 0

  name       = "karpenter"
  namespace  = "kube-system"
  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter"
  version    = var.karpenter_chart_version

  set = [
    {
      name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
      value = aws_iam_role.karpenter_controller[0].arn
    },
    {
      name  = "settings.clusterName"
      value = aws_eks_cluster.this[0].name
    },
    {
      name  = "settings.clusterEndpoint"
      value = aws_eks_cluster.this[0].endpoint
    },
    {
      name  = "settings.interruptionQueue"
      value = aws_sqs_queue.karpenter_interruption[0].name
    },
  ]

  depends_on = [
    aws_eks_node_group.bootstrap,
    aws_iam_role_policy_attachment.karpenter_controller,
  ]
}

resource "kubernetes_manifest" "karpenter_ec2_node_class" {
  count = local.create_karpenter_manifests ? 1 : 0

  manifest = {
    apiVersion = "karpenter.k8s.aws/v1"
    kind       = "EC2NodeClass"
    metadata = {
      name = "spot"
    }
    spec = {
      amiFamily = "AL2023"
      role      = aws_iam_role.node[0].name
      subnetSelectorTerms = [{
        tags = {
          "karpenter.sh/discovery" = var.cluster_name
        }
      }]
      securityGroupSelectorTerms = [{
        tags = {
          "karpenter.sh/discovery" = var.cluster_name
        }
      }]
    }
  }

  depends_on = [helm_release.karpenter]
}

resource "kubernetes_manifest" "karpenter_spot_node_pool" {
  count = local.create_karpenter_manifests ? 1 : 0

  manifest = {
    apiVersion = "karpenter.sh/v1"
    kind       = "NodePool"
    metadata = {
      name = "spot"
    }
    spec = {
      template = {
        metadata = {
          labels = {
            capacity = "spot"
          }
        }
        spec = {
          nodeClassRef = {
            group = "karpenter.k8s.aws"
            kind  = "EC2NodeClass"
            name  = "spot"
          }
          requirements = [
            {
              key      = "karpenter.sh/capacity-type"
              operator = "In"
              values   = ["spot"]
            },
            {
              key      = "karpenter.k8s.aws/instance-family"
              operator = "In"
              values   = var.karpenter_spot_instance_families
            },
            {
              key      = "kubernetes.io/arch"
              operator = "In"
              values   = ["amd64"]
            },
          ]
        }
      }
      limits = {
        cpu = var.karpenter_spot_cpu_limit
      }
      disruption = {
        consolidationPolicy = "WhenEmptyOrUnderutilized"
        consolidateAfter    = "5m"
      }
    }
  }

  depends_on = [kubernetes_manifest.karpenter_ec2_node_class]
}
