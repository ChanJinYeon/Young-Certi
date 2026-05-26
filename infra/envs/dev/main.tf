locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  name_prefix  = "${var.project}-${var.environment}-${var.account_id}-${var.aws_region}"
  cluster_name = "${var.project}-${var.environment}"
}

module "tfstate_bucket" {
  source = "../../modules/tfstate-bucket"

  name          = "${local.name_prefix}-tfstate"
  force_destroy = var.force_destroy_buckets
  tags          = local.common_tags
}

module "data_bucket" {
  source = "../../modules/data-bucket"

  name          = "${local.name_prefix}-data"
  upload_prefix = var.question_upload_prefix
  force_destroy = var.force_destroy_buckets
  tags          = local.common_tags
}

module "frontend_cdn" {
  count  = var.enable_frontend_cdn ? 1 : 0
  source = "../../modules/frontend-cdn"

  name          = "${local.name_prefix}-frontend"
  force_destroy = var.frontend_force_destroy
  tags          = local.common_tags
}

module "vpc" {
  source = "../../modules/vpc"

  enabled        = var.enable_ephemeral_cluster
  name           = "${local.name_prefix}-eks"
  cluster_name   = local.cluster_name
  cidr_block     = var.vpc_cidr_block
  public_subnets = var.vpc_public_subnets
  tags           = local.common_tags
}

module "eks" {
  source = "../../modules/eks"

  enabled                              = var.enable_ephemeral_cluster
  cluster_name                         = local.cluster_name
  subnet_ids                           = module.vpc.public_subnet_ids
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs
  manage_karpenter_manifests           = var.manage_karpenter_manifests
  tags                                 = local.common_tags
}

data "aws_iam_policy_document" "github_actions" {
  count = var.enable_github_oidc ? 1 : 0

  statement {
    sid = "AllowTerraformToManageYoungCerti"
    actions = [
      "acm:*",
      "autoscaling:*",
      "budgets:*",
      "cloudformation:*",
      "cloudfront:*",
      "ec2:*",
      "ecr:*",
      "eks:*",
      "elasticloadbalancing:*",
      "events:*",
      "iam:*",
      "logs:*",
      "s3:*",
      "sqs:*",
      "ssm:*",
      "sts:GetCallerIdentity",
    ]
    resources = ["*"]
  }
}

module "github_oidc" {
  source = "../../modules/github-oidc"

  enabled            = var.enable_github_oidc
  role_name          = "${var.project}-${var.environment}-github-actions"
  github_repository  = var.github_repository
  allowed_refs       = var.github_allowed_refs
  inline_policy_json = var.enable_github_oidc ? data.aws_iam_policy_document.github_actions[0].json : null
  tags               = local.common_tags
}

resource "aws_budgets_budget" "monthly_cost" {
  name         = "${var.project}-${var.environment}-monthly-cost"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
