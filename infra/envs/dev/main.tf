locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  name_prefix = "${var.project}-${var.environment}-${var.account_id}-${var.aws_region}"
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
