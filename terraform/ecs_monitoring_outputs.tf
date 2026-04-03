output "monitoring_alloy_service_name" {
  description = "ECS service name for the Alloy monitoring collector"
  value       = aws_ecs_service.monitoring_alloy_service.name
}

output "monitoring_alloy_task_definition_arn" {
  description = "Task definition ARN for the Alloy monitoring collector"
  value       = aws_ecs_task_definition.monitoring_alloy.arn
}
