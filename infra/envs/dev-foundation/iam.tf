data "aws_caller_identity" "current" {}

# Permission Policy Document
data "aws_iam_policy_document" "frontend_deploy" {
  statement {
    sid    = "ListFrontendBucket"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      module.frontend_site.bucket_arn,
    ]
  }

  statement {
    sid    = "WriteFrontendObjects"
    effect = "Allow"

    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${module.frontend_site.bucket_arn}/*",
    ]
  }

  statement {
    sid    = "InvalidateCloudFront"
    effect = "Allow"

    actions = [
      "cloudfront:CreateInvalidation",
    ]

    resources = [
      "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${module.frontend_site.cloudfront_distribution_id}",
    ]
  }
}

# Permission Policy
resource "aws_iam_policy" "frontend_deploy" {
  name        = "young-certi-dev-frontend-deploy"
  description = "Allow GitHub Actions to deploy frontend assets to S3 and invalidate CloudFront."
  policy      = data.aws_iam_policy_document.frontend_deploy.json

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "frontend-deploy"
    ManagedBy   = "terraform"
  }
}

module "github_oidc_provider" {
  source = "../../modules/github-oidc-provider"

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "github-oidc-provider"
    ManagedBy   = "terraform"
  }
}

module "github_frontend_deploy_role" {
  source = "../../modules/github-actions-role"

  allowed_refs      = ["refs/heads/${var.github_branch}"] # 허용하는 git branch
  github_repository = var.github_repository
  oidc_provider_arn = module.github_oidc_provider.arn
  role_name         = "young-certi-dev-frontend-deploy" # 만들어지는 role name

  policy_arns = {
    frontend_deploy = aws_iam_policy.frontend_deploy.arn # 적용하고자 하는 Policy (위에서 만듦)
  }

  tags = {
    Project     = "young-certi"
    Environment = "dev"
    Purpose     = "frontend-deploy"
    ManagedBy   = "terraform"
  }
}
