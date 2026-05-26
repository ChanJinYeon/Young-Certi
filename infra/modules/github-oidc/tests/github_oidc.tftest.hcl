provider "aws" {
  region                      = "ap-northeast-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

run "disabled_creates_no_oidc_resources" {
  command = plan

  variables {
    enabled           = false
    role_name         = "young-certi-github-actions-test"
    github_repository = "adansonia/young-certi"
  }

  assert {
    condition     = length(aws_iam_openid_connect_provider.github) == 0
    error_message = "disabled module should not create a GitHub OIDC provider"
  }

  assert {
    condition     = length(aws_iam_role.github_actions) == 0
    error_message = "disabled module should not create a GitHub Actions role"
  }

  assert {
    condition     = output.role_arn == null
    error_message = "disabled module should expose a null role ARN"
  }
}

run "github_oidc_trust_contract" {
  command = plan

  variables {
    enabled           = true
    role_name         = "young-certi-github-actions-test"
    github_repository = "adansonia/young-certi"
    allowed_refs      = ["refs/heads/main", "refs/heads/001-question-practice"]
    inline_policy_json = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Effect   = "Allow"
        Action   = ["sts:GetCallerIdentity"]
        Resource = "*"
      }]
    })
    tags = {
      Project = "young-certi"
    }
  }

  assert {
    condition     = aws_iam_openid_connect_provider.github[0].url == "https://token.actions.githubusercontent.com"
    error_message = "OIDC provider should trust GitHub's token issuer"
  }

  assert {
    condition     = contains(aws_iam_openid_connect_provider.github[0].client_id_list, "sts.amazonaws.com")
    error_message = "OIDC provider should allow the AWS STS audience"
  }

  assert {
    condition     = aws_iam_role.github_actions[0].name == "young-certi-github-actions-test"
    error_message = "GitHub Actions role should use the requested role name"
  }

  assert {
    condition     = length(aws_iam_role_policy.inline) == 1
    error_message = "inline policy should be created when inline_policy_json is provided"
  }
}
