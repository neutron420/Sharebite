variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "domain_name" {
  description = "The root domain name"
  default     = "neutrondev.in"
}

variable "ecr_repository_name" {
  description = "Name for the ECR repository"
  default     = "sharebite-app"
}

variable "ecs_cluster_name" {
  description = "Name for the ECS cluster"
  default     = "sharebite-cluster"
}

provider "aws" {
  region = var.aws_region
}

# Application Secrets and Environment Variables
variable "database_url" { description = "Database connection string" }
variable "jwt_secret" { description = "JWT Secret" }
variable "r2_account_id" { description = "Cloudflare R2 Account ID" }
variable "r2_access_key_id" { description = "Cloudflare R2 Access Key" }
variable "r2_secret_access_key" { description = "Cloudflare R2 Secret" }
variable "r2_bucket_name" { description = "Cloudflare R2 Bucket" }
variable "r2_public_domain" { description = "Cloudflare R2 Public Domain" }
variable "next_public_mapbox_token" { description = "Mapbox token" }
variable "redis_url" { description = "Redis connection url" }
variable "internal_ws_url" { description = "Internal WS URL" }
variable "openai_api_key" { description = "OpenAI API Key" }
variable "resend_api_key" { description = "Resend API Key" }
variable "next_public_cloudflare_turnstile_site_key" { description = "Turnstile site key" }
variable "cloudflare_turnstile_secret_key" { description = "Turnstile secret key" }
