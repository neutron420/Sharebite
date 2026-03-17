output "amplify_app_id" {
  value = aws_amplify_app.sharebite.id
}

output "amplify_default_domain" {
  value = aws_amplify_app.sharebite.default_domain
}

output "amplify_custom_domain" {
  value = var.domain_name
}
