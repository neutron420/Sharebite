resource "aws_amplify_app" "sharebite" {
  name         = var.project_name
  repository   = var.github_repository_url
  access_token = var.github_access_token

  # Built-in environment variables
  environment_variables = {
    DATABASE_URL         = var.database_url
    REDIS_URL            = var.redis_url
    JWT_SECRET           = var.jwt_secret
    R2_ACCOUNT_ID        = var.r2_account_id
    R2_ACCESS_KEY_ID     = var.r2_access_key_id
    R2_SECRET_ACCESS_KEY = var.r2_secret_access_key
    R2_BUCKET_NAME       = var.r2_bucket_name
    R2_PUBLIC_DOMAIN     = var.r2_public_domain
    MAPBOX_TOKEN         = var.mapbox_token
    OPENAI_API_KEY       = var.openai_api_key
    NEXT_PUBLIC_APP_URL  = "https://master.${aws_amplify_app.sharebite.default_domain}"
  }

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
            - npx prisma generate
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "master" {
  app_id      = aws_amplify_app.sharebite.id
  branch_name = "master"

  framework = "Next.js - SSR"
}

resource "aws_amplify_domain_association" "sharebite" {
  app_id      = aws_amplify_app.sharebite.id
  domain_name = var.domain_name

  # https://master.example.com
  sub_domain {
    branch_name = aws_amplify_branch.master.branch_name
    prefix      = "master"
  }

  # https://example.com (pointing to master)
  sub_domain {
    branch_name = aws_amplify_branch.master.branch_name
    prefix      = ""
  }
}
