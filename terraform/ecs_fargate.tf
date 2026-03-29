
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role-sharebite"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Cloudwatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/ecs/sharebite"
  retention_in_days = 14
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "sharebite-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" # 1 vCPU
  memory                   = "2048" # 2 GB
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "sharebite-container"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        },
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "DATABASE_URL", value = var.database_url },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "R2_ACCOUNT_ID", value = var.r2_account_id },
        { name = "R2_ACCESS_KEY_ID", value = var.r2_access_key_id },
        { name = "R2_SECRET_ACCESS_KEY", value = var.r2_secret_access_key },
        { name = "R2_BUCKET_NAME", value = var.r2_bucket_name },
        { name = "R2_PUBLIC_DOMAIN", value = var.r2_public_domain },
        { name = "NEXT_PUBLIC_MAPBOX_TOKEN", value = var.next_public_mapbox_token },
        { name = "REDIS_URL", value = var.redis_url },
        { name = "INTERNAL_WS_URL", value = var.internal_ws_url },
        { name = "NEXT_PUBLIC_WS_URL", value = "wss://ws.${var.domain_name}" },
        { name = "OPENAI_API_KEY", value = var.openai_api_key },
        { name = "RESEND_API_KEY", value = var.resend_api_key },
        { name = "RESEND_FROM_EMAIL", value = var.resend_from_email },
        { name = "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", value = var.next_public_cloudflare_turnstile_site_key },
        { name = "CLOUDFLARE_TURNSTILE_SECRET_KEY", value = var.cloudflare_turnstile_secret_key },
        { name = "GROQ_API_KEY", value = var.groq_api_key },
        { name = "RAPIDAPI_KEY", value = var.rapidapi_key },
        { name = "RAPIDAPI_HOST", value = var.rapidapi_host }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Security Group for ECS Task
resource "aws_security_group" "ecs_tasks" {
  name        = "sharebite-ecs-tasks-sg"
  description = "Allow inbound access from ALB only"
  vpc_id      = module.vpc.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = 3000
    to_port         = 3000
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    protocol        = "tcp"
    from_port       = 8080
    to_port         = 8080
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Service
resource "aws_ecs_service" "app_service" {
  name            = "sharebite-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = module.vpc.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nextjs.arn
    container_name   = "sharebite-container"
    container_port   = 3000
  }
  
  # Register the Same Container in Another Target Group for WebSockets!
  load_balancer {
    target_group_arn = aws_lb_target_group.ws.arn
    container_name   = "sharebite-container"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.https
  ]
}
