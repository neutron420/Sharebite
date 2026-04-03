locals {
  alloy_config = <<-ALLOY
prometheus.scrape "sharebite_web" {
  targets = [{
    __address__ = "${var.domain_name}",
    __scheme__  = "https",
  }]

  metrics_path    = "/api/metrics"
  scrape_interval = "15s"
  forward_to      = [prometheus.remote_write.metrics_hosted_prometheus.receiver]
}

prometheus.scrape "sharebite_ws" {
  targets = [{
    __address__ = "ws.${var.domain_name}",
    __scheme__  = "https",
  }]

  metrics_path    = "/metrics"
  scrape_interval = "15s"
  forward_to      = [prometheus.remote_write.metrics_hosted_prometheus.receiver]
}

prometheus.remote_write "metrics_hosted_prometheus" {
  endpoint {
    name = "hosted-prometheus"
    url  = sys.env("GRAFANA_CLOUD_PROM_REMOTE_WRITE_URL")

    basic_auth {
      username = sys.env("GRAFANA_CLOUD_PROM_USERNAME")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
}
  ALLOY

  alloy_config_b64       = base64encode(local.alloy_config)
  alloy_bootstrap_command = "mkdir -p /tmp/alloy && echo '${local.alloy_config_b64}' | base64 -d > /tmp/alloy/config.alloy && exec /bin/alloy run /tmp/alloy/config.alloy"
}

resource "aws_cloudwatch_log_group" "monitoring_logs" {
  name              = "/ecs/sharebite-monitoring"
  retention_in_days = 14
}

resource "aws_security_group" "monitoring_tasks" {
  name        = "sharebite-monitoring-tasks-sg"
  description = "Allow outbound traffic for monitoring collector"
  vpc_id      = module.vpc.vpc_id

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_task_definition" "monitoring_alloy" {
  family                   = "sharebite-monitoring-alloy-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.monitoring_alloy_cpu
  memory                   = var.monitoring_alloy_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "alloy"
      image     = var.monitoring_alloy_image
      essential = true

      entryPoint = ["/bin/sh", "-c"]
      command    = [local.alloy_bootstrap_command]

      environment = [
        { name = "GRAFANA_CLOUD_PROM_REMOTE_WRITE_URL", value = var.grafana_cloud_prom_remote_write_url },
        { name = "GRAFANA_CLOUD_PROM_USERNAME", value = var.grafana_cloud_prom_username },
        { name = "GRAFANA_CLOUD_API_KEY", value = var.grafana_cloud_api_key }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.monitoring_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "alloy"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "monitoring_alloy_service" {
  name            = "sharebite-monitoring-alloy-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.monitoring_alloy.arn
  desired_count   = var.monitoring_alloy_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.monitoring_tasks.id]
    subnets          = module.vpc.private_subnets
    assign_public_ip = false
  }
}
