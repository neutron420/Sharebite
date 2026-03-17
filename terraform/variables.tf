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

variable "container_port" {
  description = "The port the container listens on"
  type        = number
  default     = 3000
}

variable "app_count" {
  description = "Number of docker containers to run"
  type        = number
  default     = 2
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
