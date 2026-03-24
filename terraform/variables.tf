variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "sharebite"
}

variable "github_repository_url" {
  description = "The URL of the GitHub repository"
  type        = string
}

variable "github_access_token" {
  description = "GitHub OAuth or Access Token for Amplify to read the repo"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Your custom domain name"
  type        = string
}

variable "database_url" {
  description = "The database URL for production"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "The Redis URL for production"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "r2_account_id" {
  type = string
}

variable "r2_access_key_id" {
  type = string
}

variable "r2_secret_access_key" {
  type      = string
  sensitive = true
}

variable "r2_bucket_name" {
  type = string
}

variable "r2_public_domain" {
  type = string
}

variable "mapbox_token" {
  type = string
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "resend_api_key" {
  type      = string
  sensitive = true
}

variable "cloudflare_turnstile_site_key" {
  type = string
}

variable "cloudflare_turnstile_secret_key" {
  type      = string
  sensitive = true
}

