locals {
  allowed_subjects = [
    for ref in var.allowed_refs : "repo:${var.github_repository}:ref:${ref}"
  ]
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.enabled ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = var.tags
}

data "aws_iam_policy_document" "assume_role" {
  count = var.enabled ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.allowed_subjects
    }
  }
}

resource "aws_iam_role" "github_actions" {
  count = var.enabled ? 1 : 0

  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role[0].json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "managed" {
  for_each = var.enabled ? toset(var.policy_arns) : toset([])

  role       = aws_iam_role.github_actions[0].name
  policy_arn = each.value
}

resource "aws_iam_role_policy" "inline" {
  count = var.enabled && var.inline_policy_json != null ? 1 : 0

  name   = "${var.role_name}-inline"
  role   = aws_iam_role.github_actions[0].id
  policy = var.inline_policy_json
}
