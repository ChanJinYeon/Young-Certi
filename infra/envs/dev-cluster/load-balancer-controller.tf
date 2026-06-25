# Trust Policy Document
data "aws_iam_policy_document" "load_balancer_controller_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRole",
      "sts:TagSession", # 추적용 태그 허용
    ]

    principals {
      type        = "Service"
      identifiers = ["pods.eks.amazonaws.com"]
    }
  }
}

# IAM Role
resource "aws_iam_role" "load_balancer_controller" {
  name               = "${local.name}-aws-load-balancer-controller"
  assume_role_policy = data.aws_iam_policy_document.load_balancer_controller_assume_role.json

  tags = merge(local.tags, {
    Purpose = "aws-load-balancer-controller"
  })
}

# 다운로드 받은 IAM Policy
resource "aws_iam_policy" "load_balancer_controller" {
  name        = "${local.name}-aws-load-balancer-controller"
  description = "Allow AWS Load Balancer Controller to manage ALB/NLB resources."
  policy      = file("${path.module}/aws-load-balancer-controller-policy.json")

  tags = merge(local.tags, {
    Purpose = "aws-load-balancer-controller"
  })
}

# IAM Role - Policy 연결
resource "aws_iam_role_policy_attachment" "load_balancer_controller" {
  role       = aws_iam_role.load_balancer_controller.name
  policy_arn = aws_iam_policy.load_balancer_controller.arn
}

# ServiceAccount + AWS IAM Role 연결 (적용은 helm install에서)
resource "aws_eks_pod_identity_association" "load_balancer_controller" {
  cluster_name    = module.eks.cluster_name
  namespace       = "kube-system"                  # AWS Load Balancer Controller는 보통 kube-system에 위치
  service_account = "aws-load-balancer-controller" # AWS Load Balancer Controller Pod용 ServiceAccount
  role_arn        = aws_iam_role.load_balancer_controller.arn

  tags = merge(local.tags, {
    Purpose = "aws-load-balancer-controller"
  })
}
