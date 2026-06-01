resource "aws_ecr_repository" "main" {
  name                 = var.repository_name
  image_tag_mutability = var.image_tag_mutability
  force_delete         = var.force_delete

  # Repository 단위 스캔
  # image_scanning_configuration {
  #   scan_on_push = true
  # }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = var.tags
}

# ECR의 오래된 이미지 자동 정리 정책
resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 20 images"

        selection = {
          tagStatus   = "any"                # 모든 Images
          countType   = "imageCountMoreThan" # 이미지 개수
          countNumber = 20                   # 20개 이상
        }

        action = {
          type = "expire" # 오래된 것 delete
        }
      }
    ]
  })
}
