run "frontend_cdn_and_cors_contract" {
  command = plan

  variables {
    enable_frontend_cdn = true
  }

  assert {
    condition     = module.frontend_cdn[0].bucket_name == "young-certi-dev-000000000000-ap-northeast-2-frontend"
    error_message = "dev env should create the frontend bucket with the project naming convention"
  }

  assert {
    condition     = length(output.frontend_cors_allowed_origins) == 1
    error_message = "dev env should expose exactly one CloudFront origin for backend CORS"
  }
}
