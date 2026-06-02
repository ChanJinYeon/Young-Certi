# Young Certi

AWS 자격증 문제를 더 편하게 풀고, 틀린 문제와 다시 보고 싶은 문제를 모아 반복 학습하기 위한 문제 풀이 서비스입니다.

기존 문제 풀이 사이트로 공부하면서 UI/UX가 불편하고, 틀린 문제만 따로 모아 복습하거나 직접 문제집을 구성하는 흐름이 아쉬웠습니다. 그래서 학습자가 문제를 풀고, 저장하고, 다시 풀고, 결과를 확인하는 경험을 더 단순하게 만들기 위해 이 프로젝트를 시작했습니다.

앱은 Claude Code와 Codex를 활용한 소프트웨어 엔지니어링 흐름으로 구현했고, 이후 DevOps와 클라우드 인프라 학습을 위해 Docker, Terraform, AWS, GitHub Actions, EKS, Argo CD를 사용해 배포 파이프라인까지 구성했습니다.

## 주요 기능

- AWS 자격증 문제 풀이
- 문제별 선택지와 정답 피드백 확인
- 즐겨찾기 기반 복습
- 원하는 문제를 모아 문제집 생성
- 문제집 단위 풀이와 결과 확인
- 브라우저 localStorage 기반 학습 상태 유지
- OpenAPI 계약 기반 API 구조 관리

## 서비스 구조

```text
Frontend
  React + Vite
  -> S3
  -> CloudFront
  -> https://certi.adansonia.cloud

Backend
  FastAPI
  -> Docker image
  -> Amazon ECR
  -> Amazon EKS
  -> AWS Application Load Balancer
  -> https://api.certi.adansonia.cloud

Question Data
  S3 bucket
  -> Backend에서 문제 JSON 로드
```

## 기술 스택

Frontend:

- React
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- Vitest
- Playwright

Backend:

- Python 3.12
- FastAPI
- Uvicorn
- boto3
- pytest
- OpenAPI

Infrastructure and DevOps:

- Docker
- Docker Compose
- Terraform
- AWS S3
- CloudFront
- Route53
- ACM
- ECR
- VPC
- EKS
- AWS Load Balancer Controller
- EKS Pod Identity
- GitHub Actions
- Argo CD
- Kustomize

## 배포 아키텍처

Frontend 배포:

```text
GitHub push
  -> GitHub Actions
  -> pnpm build
  -> S3 sync
  -> CloudFront cache invalidation
  -> certi.adansonia.cloud
```

Backend 배포:

```text
GitHub push
  -> GitHub Actions
  -> backend test
  -> Docker build
  -> ECR push
  -> Kubernetes manifest image tag update
  -> Git commit
  -> Argo CD sync
  -> EKS rollout
  -> api.certi.adansonia.cloud
```

## GitOps 흐름

Backend는 Argo CD가 `k8s/backend` 경로를 감시하는 방식으로 배포됩니다.

GitHub Actions가 새 backend 이미지를 ECR에 push한 뒤 `k8s/backend/kustomization.yaml`의 image tag를 최신 commit SHA로 변경합니다. 이 변경이 다시 Git에 push되면 Argo CD가 이를 감지하고 EKS에 자동 반영합니다.

```text
ECR image push
  -> kustomization.yaml tag update
  -> Git push
  -> Argo CD detect
  -> Kubernetes Deployment rollout
```

## 로컬 개발

Docker Compose로 로컬 환경에서 MinIO, API, Web을 함께 실행할 수 있습니다.

```bash
docker compose up --build -d
```

로컬 포트:

```text
Web:           http://localhost:15173
API:           http://localhost:18000
MinIO API:     http://localhost:19000
MinIO Console: http://localhost:19001
```

정리:

```bash
docker compose down
```

MinIO 데이터까지 삭제하려면:

```bash
docker compose down -v
```

## 프로젝트 구조

```text
backend/      FastAPI backend
frontend/     React frontend
crawler/      question data crawler and fixtures
specs/        OpenAPI contract

infra/        Terraform infrastructure
k8s/          Kubernetes and Argo CD manifests
.github/      GitHub Actions workflows
```

## 진행 이유

이 프로젝트는 단순히 문제 풀이 앱을 만드는 데서 끝나지 않고, 실제 서비스가 배포되는 과정을 끝까지 경험하기 위해 진행했습니다.

앱 개발 단계에서는 Claude Code와 Codex를 활용해 기능 구현, 테스트, UI 개선을 반복했습니다. 이후 직접 Dockerfile과 Docker Compose를 작성하며 컨테이너 실행 구조를 이해했고, Terraform으로 AWS 리소스를 구성하면서 클라우드 인프라를 코드로 관리하는 흐름을 익혔습니다.

마지막으로 GitHub Actions와 Argo CD를 연결해 frontend는 S3/CloudFront로, backend는 ECR/EKS/GitOps로 배포되도록 구성했습니다.

## 배운 점

- 컨테이너 이미지는 실행 환경을 고정하는 단위이고, ECR은 그 이미지를 배포 가능한 형태로 보관하는 저장소입니다.
- EKS는 이미지를 직접 실행하는 것이 아니라 Kubernetes Deployment, Service, Ingress 같은 manifest를 통해 Pod를 생성합니다.
- Argo CD는 ECR을 직접 감시하지 않고 Git에 있는 Kubernetes manifest를 감시합니다.
- GitHub Actions가 image tag를 Git에 반영하면, Argo CD가 이를 보고 클러스터 상태를 동기화합니다.
- CloudFront와 S3는 정적 frontend 배포에 적합하고, API 서버는 EKS와 ALB 뒤에 두는 방식으로 분리할 수 있습니다.
- ACM 인증서는 CloudFront용은 `us-east-1`, ALB용은 ALB가 있는 리전에 필요합니다.
- Terraform state, lock, destroy 순서는 실제 운영에서 매우 중요합니다.

## 현재 상태

- Frontend: S3 + CloudFront + Route53 배포 구성
- Backend: ECR + EKS + ALB + Route53 배포 구성
- CI/CD: GitHub Actions 기반 frontend/backend workflow 구성
- GitOps: Argo CD가 backend Kubernetes manifest를 동기화
- Local: Docker Compose 기반 MinIO/API/Web 실행 가능

## 향후 개선

- Terraform CI 추가
- Argo CD Image Updater 검토
- WAF와 보안 헤더 적용
- ECR enhanced scanning 검토
- 운영 비용 최적화
- 문제 데이터 관리 자동화
