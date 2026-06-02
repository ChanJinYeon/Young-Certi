resource "aws_route53_record" "frontend" {
  zone_id = var.hosted_zone_id

  name = var.frontend_domain_name
  type = "A"

  alias {
    name                   = module.frontend_site.cloudfront_domain_name
    zone_id                = module.frontend_site.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}
