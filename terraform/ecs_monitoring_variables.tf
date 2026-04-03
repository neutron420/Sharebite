variable "monitoring_alloy_image" {
  description = "Container image for Grafana Alloy"
  type        = string
  default     = "grafana/alloy:latest"
}

variable "monitoring_alloy_desired_count" {
  description = "Desired task count for monitoring Alloy service"
  type        = number
  default     = 1
}

variable "monitoring_alloy_cpu" {
  description = "Fargate CPU units for Alloy task"
  type        = string
  default     = "256"
}

variable "monitoring_alloy_memory" {
  description = "Fargate memory (MiB) for Alloy task"
  type        = string
  default     = "512"
}

variable "grafana_cloud_prom_remote_write_url" {
  description = "Grafana Cloud Hosted Prometheus remote_write URL"
  type        = string
}

variable "grafana_cloud_prom_username" {
  description = "Grafana Cloud Prometheus instance username/id"
  type        = string
}

variable "grafana_cloud_api_key" {
  description = "Grafana Cloud API key with metrics write permission"
  type        = string
  sensitive   = true
}
