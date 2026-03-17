resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30
}

data "aws_caller_identity" "current" {}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-task"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = var.project_name
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
           name = "NODE_ENV"
           value = "production"
        },
        {
           name = "DATABASE_URL"
           value = var.database_url
        },
        {
           name = "REDIS_URL"
           value = var.redis_url
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        },
        {
          name  = "R2_ACCOUNT_ID"
          value = var.r2_account_id
        },
        {
          name  = "R2_ACCESS_KEY_ID"
          value = var.r2_access_key_id
        },
        {
          name  = "R2_SECRET_ACCESS_KEY"
          value = var.r2_secret_access_key
        },
        {
          name  = "R2_BUCKET_NAME"
          value = var.r2_bucket_name
        },
        {
          name  = "R2_PUBLIC_DOMAIN"
          value = var.r2_public_domain
        },
        {
          name  = "NEXT_PUBLIC_MAPBOX_TOKEN"
          value = var.mapbox_token
        },
        {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.public[*].id
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.project_name
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.front_end, aws_iam_role_policy_attachment.ecs_task_execution_role_policy]
}
