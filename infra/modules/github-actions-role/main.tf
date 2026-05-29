locals {
  allowed_subjects = [
    for ref in var.allowed_refs : "repo:${var.github_repository}:ref:${ref}"
  ]
}

# Trust Policy Document
data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = [
      "sts:AssumeRoleWithWebIdentity",
    ]

    principals {
      type = "Federated"

      identifiers = [
        var.oidc_provider_arn,
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com",
      ]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.allowed_subjects
    }
  }
}

# Trust Policy
resource "aws_iam_role" "main" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags = var.tags
}

# Role Policy Attachment
resource "aws_iam_role_policy_attachment" "managed" {
  for_each = var.policy_arns

  role       = aws_iam_role.main.name
  policy_arn = each.value
}
