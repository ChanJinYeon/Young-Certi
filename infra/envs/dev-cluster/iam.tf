################################################################
# Backend Pod Identity
################################################################
# Trust Policy Document
data "aws_iam_policy_document" "backend_api_assume_role" {
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
data "aws_iam_policy_document" "backend_api_s3_read" {
  statement {
    sid    = "ListQuestionDataBucket"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::${var.question_data_bucket_name}",
    ]
  }

  statement {
    sid    = "ReadQuestionDataObjects"
    effect = "Allow"

    actions = [
      "s3:GetObject",
    ]

    resources = [
      "arn:aws:s3:::${var.question_data_bucket_name}/*",
    ]
  }
}

# IAM Role 생성 - Trust Policy
resource "aws_iam_role" "backend_api" {
  name               = "${local.name}-backend-api"
  assume_role_policy = data.aws_iam_policy_document.backend_api_assume_role.json

  tags = merge(local.tags, {
    Purpose = "backend-api-pod-identity"
  })
}

# Backend Pod가 사용할 Permission Policy
resource "aws_iam_policy" "backend_api_s3_read" {
  name        = "${local.name}-backend-api-s3-read"
  description = "Allow the backend API Pod to read question data from S3."
  policy      = data.aws_iam_policy_document.backend_api_s3_read.json

  tags = merge(local.tags, {
    Purpose = "backend-api-s3-read"
  })
}

# IAM Role에 Policy 연결
resource "aws_iam_role_policy_attachment" "backend_api_s3_read" {
  role       = aws_iam_role.backend_api.name
  policy_arn = aws_iam_policy.backend_api_s3_read.arn
}

# EKS ServiceAccount와 IAM Role을 연결
# 이 값들은 Kubernetes 파일과 정확히 일치해야 함
# namespace: k8s/backend/namespace.yaml
# service_account: k8s/backend/serviceaccount.yaml
resource "aws_eks_pod_identity_association" "backend_api" {
  cluster_name    = module.eks.cluster_name
  namespace       = "young-certi"
  service_account = "young-certi-api"
  role_arn        = aws_iam_role.backend_api.arn

  tags = merge(local.tags, {
    Purpose = "backend-api-pod-identity"
  })
}
