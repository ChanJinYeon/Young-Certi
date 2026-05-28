# 현재 Terraform을 실행 중인 AWS 계정 정보 확인용
# CloudFront Distribution ARN을 만들기 위해 사용
# "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${var.cloudfront_distribution_id}"
data "aws_caller_identity" "current" {}

# GitHub Actions OIDC issuer URL의 TLS 인증서 정보를 가져옴
# GitHub Actions가 OIDC 토큰을 발급하는 endpoint
# https://registry.terraform.io/providers/hashicorp/tls/latest/docs/data-sources/certificate?utm_source=chatgpt.com
data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

# 공식 문서 참고
# GitHub Actions
# https://docs.github.com/ko/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com" # OIDC 토큰의 issuer (발급자)

  client_id_list = [ # 대상 그룹 (AWS STS와 통신)
    "sts.amazonaws.com",
  ]

  # 웹사이트의 보안 인증서가 올바른지 확인할 때 사용되는 고유한 해시 (SSL, TLS 인증서)
  # 없으면 AWS IAM이 필요한 TLS 검증을 자동 처리
  # thumbprint_list = [
  #   data.tls_certificate.github_actions.certificates[0].sha1_fingerprint,
  # ]

  tags = var.tags
}

# Trust Policy
resource "aws_iam_role" "github_actions" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [ # https://docs.github.com/ko/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws#adding-the-identity-provider-to-aws 참고
      {
        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity" # 외부 OIDC 토큰을 사용해서 Role을 빌릴 때 사용 (원래: sts:AssumeRole)

        Condition = {
          StringEquals = {
            # AWS STS에 제출하기 위한 토큰 검증
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }

          StringLike = {
            # 어떤 저장소의 어떤 ref에서 실행된 workflow인지 검증
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# Permission Policy
resource "aws_iam_policy" "frontend_deploy" {
  name        = "${var.role_name}-frontend-deploy"
  description = "Allow GitHub Actions to deploy frontend assets to S3 and invalidate CloudFront."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListFrontendBucket"
        Effect = "Allow"

        Action = [
          "s3:ListBucket",
        ]

        Resource = "arn:aws:s3:::${var.frontend_bucket_name}"
      },
      {
        Sid    = "WriteFrontendObjects"
        Effect = "Allow"

        Action = [
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:PutObject",
        ]

        Resource = "arn:aws:s3:::${var.frontend_bucket_name}/*"
      },
      {
        Sid    = "InvalidateCloudFront"
        Effect = "Allow"

        Action = [
          "cloudfront:CreateInvalidation",
        ]

        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${var.cloudfront_distribution_id}"
      }
    ]
  })

  tags = var.tags
}

# Trust Policy와 Permission Policy 연결
resource "aws_iam_role_policy_attachment" "frontend_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.frontend_deploy.arn
}
