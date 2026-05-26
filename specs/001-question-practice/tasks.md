# 작업 목록 — YoungCerti 문제 풀이 MVP

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): ./contracts/openapi.yaml
> 생성/갱신: 2026-05-25 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다 (cloud/k8s 이전 용이성).
- 구현(크롤러·백엔드·프론트엔드 코드·테스트·Terraform)은 전부 Codex가 담당하고, 마지막 large-task(M09)에서 Claude가 UI/UX 종합 정리를 수행한다. **커밋은 large-task당 1개**로, Codex가 각 Mxx 검증 통과 후 직접 커밋하고 M09만 Claude가 커밋한다(push는 안 함).
- 로컬에서는 **MinIO**가 S3 대역(stand-in)이다. 크롤러와 백엔드는 동일한 S3 API로 MinIO(로컬)와 실제 S3(배포)를 모두 다룬다.
- 크롤러는 단발성 도구다. 클러스터에 배포하지 않고 개발자 머신/CI에서만 실행한다 (constitution VII).
- 사용자 요청 반영: **(1) 크롤링을 먼저** 한다(M02), **(2) AWS 인프라는 S3만 먼저** 만든다(M03, EKS는 M07로 미룸), **(3) S3는 재사용 모듈로** 만들고 인스턴스 2개(tfstate remote backend+locking용, 문제 저장용)를 둔다.
- 런타임 DB 없음: 백엔드는 기동 시 questions.json을 메모리로 로드, 사용자 상태는 100% 브라우저 localStorage (constitution III, VI).
- 프론트는 React+TS+Vite SPA다. `vercel-react-best-practices` 스킬은 Next.js 전제이므로 **의도만 차용**(SSR/RSC 항목은 무시, 번들·성능·컴포넌트 패턴만 적용).

## 미해결 질문 (Open Questions — 반드시 해결할 것)

- 없음. spec.md의 NEEDS CLARIFICATION 2건은 /speckit-clarify에서, 디자인 모호성은 plan-design-review에서 모두 해소됨.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01 → M08까지 전부 Codex, 마지막 M09는 Claude UI/UX 종합 정리.

사용자 지정 순서를 반영한 흐름:
1. M01 docker compose 토대 → 2. **M02 크롤러(크롤링 먼저)** → 3. **M03 Terraform S3 모듈만** → 4. M04 백엔드 → 5. M05 프론트엔드 코드 → 6. M06 로컬 E2E 통합 → 7. M07 EKS+Karpenter(로컬 검증 후) → 8. M08 FE 배포+CI/CD → 9. M09 Claude UI/UX.

**Large-task 내부 subtask 순서** (Codex 작업, 해당되는 단계만):
계약 → (DB 없음) → 백엔드 RED → 백엔드 GREEN → 프론트엔드 RED → 프론트엔드 GREEN → 검증

## Executor 룰

- **기본 executor는 codex.** 크롤러, 백엔드, 계약, 테스트, 프론트엔드 코드, Terraform까지 전부 Codex가 담당한다.
- **마지막 large-task(M09)만 claude.** 디렉터리 구조 점검, 컴포넌트 일관성, 디자인 시스템 정리, a11y/responsive/motion, 라이브 렌더 점검, 그리고 UI/UX polish 커밋.
- **커밋은 large-task당 1개.** 각 Mxx의 codex subtask가 전부 끝나고 **검증 명령이 통과한 뒤**, Codex가 그 작업물을 해당 Mxx의 "예상 커밋 메시지"로 커밋한다. M09는 Claude가 커밋한다. (이전 "Codex는 절대 커밋 안 함 / M09 일괄" 정책은 폐기됨.)
  - 경계는 large-task다 — **subtask 단위 커밋 금지**. 검증 실패 시 커밋하지 않는다.
  - `git push`는 하지 않는다(커밋까지만). push는 사용자/Claude가 수행.
  - 커밋 메시지는 영문 conventional commit, 끝에 `(Mxx)` 표기. co-author 트레일러는 실행 에이전트 기준.
- 각 subtask의 `skill: <name>`은 `/task-run` 시 Skill 도구로 호출되고, Codex CLI에서는 해당 스킬의 의도를 따라야 한다.
- **모든 로컬 실행은 docker compose 컨테이너 안에서.** 호스트에서 직접 실행하지 않는다.

---

## [x] M01 — docker compose 토대 + 리포 스캐폴딩

- **목적 (Purpose)**: 모든 후속 작업이 돌아갈 컨테이너 기반 로컬 개발 환경과 4개 트리(crawler/backend/frontend/infra) 골격을 만든다.
- **명세 참조**: plan.md §Project Structure, §Technical Context, quickstart.md
- **주 Executor**: codex
- **Skill routing**: (없음 — 인프라/설정 작업)
- **완료 정의 (DoD)**:
  - [x] `docker-compose.yml` 동작 (minio + api + web + crawler 서비스)
  - [x] 4개 디렉터리 골격 + 각 서비스 Dockerfile
  - [x] MinIO 부팅 시 `young-certi-data` 버킷 자동 생성 + fixture 업로드
  - [x] `make dev`로 전체 스택 부팅, `make test`/`make test-*` 스텁 동작
  - [x] `.env.example`, `.dockerignore`, 루트 README 골격
- **테스트 전략**: 이 단계는 인프라이므로 "스택이 부팅되고 healthcheck가 녹색"이 검증 기준.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose up -d && docker compose ps` (모든 서비스 healthy)
  - `docker compose run --rm api python -c "print('ok')"`
  - `docker compose down -v`
- **예상 커밋 메시지 (영문)**: `chore(scaffold): docker compose stack + repo skeleton (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T000** — docker compose 인프라: 루트 `docker-compose.yml` (services: `minio`, `api`, `web`, `crawler`, `tf`), 각 `Dockerfile`(api=python3.12-slim, web=node22-alpine, crawler=golang1.23, tf=hashicorp/terraform), `.dockerignore`, healthcheck, named volume(minio), `.env.example` (executor: codex, skill: none)
- [x] **T001** — MinIO 부트스트랩: compose `minio-init` 1회성 컨테이너가 `young-certi-data` 버킷 생성 + `crawler/testdata/fixture-questions.json` 업로드 (executor: codex, skill: none)
- [x] **T002** — `Makefile`: `dev`, `test`, `test-crawler`, `test-backend`, `test-frontend`, `crawl`, `cluster-up`, `cluster-down` 타겟 (전부 docker compose 래핑) (executor: codex, skill: none)
- [x] **T003** — 디렉터리 골격: `frontend/`, `backend/`, `crawler/`, `infra/` 빈 구조 + 각 README 한 줄 (executor: codex, skill: none)
- [x] **T004** — 검증: `docker compose up -d` 후 모든 서비스 healthy, `down -v` 정상 (executor: codex, skill: none)

---

## [x] M02 — 크롤러 (Go): krdump SAP-C02 수집 → S3(MinIO)

- **목적 (Purpose)**: rate-limit을 지키며 SAP-C02 문제를 수집해 검증된 `questions.json`을 S3(로컬은 MinIO)에 업로드한다. **사용자 요청: 크롤링을 가장 먼저 완성.**
- **명세 참조**: spec.md (Out of scope=크롤러는 별도지만 본 MVP의 첫 작업), plan.md §crawler, research.md D-001, constitution VII
- **주 Executor**: codex
- **Skill routing**:
  - `go-go` — Go 핸들러/동시성/에러 처리/테스트
- **정식 소스 (Canonical source)**: `https://www.krdump.com/Amazon.SAP-C02.v2025-11-26.q476.html?p=N`, 범위 **p=2 … p=97**. 페이지당 5문제이며 p=97은 q476 기준 476번 1개만 있어도 정상으로 허용한다.
- **완료 정의 (DoD)**:
  - [x] `questions.json` 스키마가 data-model.md Exam/Question/Choice와 일치
  - [x] rate limiter(1 page/2m) + 429/5xx/too-much-request 10분 대기 후 1회 재시도 단위 테스트 통과
  - [x] robots.txt 준수 + 진실한 User-Agent
  - [x] 단일/다중 정답/선지 1개 파싱 분기 골든 픽스처 테스트 통과
  - [x] 중복 제거 + 정렬 결정성 테스트 통과
  - [x] MinIO로 업로드 성공 (로컬 통합)
  - [x] 네트워크 없이 `crawler/testdata/*.html` 픽스처로 전 분기 테스트 가능
  - [x] 페이지 checkpoint 저장 후 재개 시 저장된 마지막 페이지 다음부터 진행
- **테스트 전략**: httptest/fixture 기반 오프라인 테스트가 기본. 실제 krdump 호출은 `make crawl` 수동 실행에서만 하며 기본값은 p=2..97, 2분 간격, 페이지당 1회 재시도.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm crawler go test ./...`
  - `docker compose run --rm crawler go vet ./...`
  - `docker compose run --rm crawler gofmt -l .` (출력 없어야 함)
- **예상 커밋 메시지 (영문)**: `feat(crawler): krdump SAP-C02 collector — rate-limit, parser, checkpoint, S3 upload (M02)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T010** — 계약: `crawler/internal/pool` 의 Go 타입이 contracts/openapi.yaml의 Question/Choice 스키마와 1:1 매핑되도록 정의 (executor: codex, skill: `go-go`, doc-aligned)
- [x] **T011** — RED: rate-limited fetcher 실패 테스트 (token-bucket, backoff, UA 헤더) — `crawler/internal/fetcher/*_test.go` (executor: codex, skill: `go-go`)
- [x] **T012** — GREEN: 2분 간격 GET + 브라우저형 UA + 10분 대기 후 1회 재시도 fetcher 구현 (executor: codex, skill: `go-go`)
- [x] **T013** — RED: parser 테스트 (well-formed/단일·다중정답/선지 1개/마지막 페이지 예외) 골든 픽스처 (executor: codex, skill: `go-go`)
- [x] **T014** — GREEN: goquery 기반 parser 구현 (executor: codex, skill: `go-go`)
- [x] **T015** — RED+GREEN: pool dedupe+정렬 결정성 + checkpoint/resume + S3 uploader(aws-sdk-go-v2, MinIO endpoint) (executor: codex, skill: `go-go`)
- [x] **T016** — 검증: `go test ./...`, `go vet`, `gofmt -l`, fixture 기반 MinIO 업로드 e2e (executor: codex, skill: none)

---

## [x] M03 — Terraform: 재사용 S3 모듈 + 버킷 2개 (S3만)

- **목적 (Purpose)**: **사용자 요청대로 AWS 인프라 중 S3만 먼저** 만든다. 재사용 S3 모듈 1개 + 인스턴스 2개: (1) tfstate remote backend & locking 버킷, (2) 문제 저장(data) 버킷. EKS는 M07로 미룬다.
- **명세 참조**: plan.md §Technical Context(Storage, tfstate), research.md D-002/D-005, constitution I/III
- **주 Executor**: codex
- **Skill routing**:
  - `terraform-code-generation:terraform-style-guide` — HCL 스타일/모듈 구조/네이밍 컨벤션
  - `terraform-code-generation:terraform-test` — 재사용 s3-bucket 모듈의 네이티브 `terraform test` (.tftest.hcl)
- **완료 정의 (DoD)**:
  - [ ] `infra/modules/s3-bucket/` 재사용 모듈 (versioning, SSE-S3, public access block, 선택적 lifecycle 변수화)
  - [ ] `infra/modules/tfstate-bucket/` — bootstrap(로컬 backend)으로 생성 후 remote로 마이그레이션, `use_lockfile = true` (Terraform >= 1.15)
  - [ ] `infra/modules/data-bucket/` — 문제 저장용, 모듈 재사용, private+versioned
  - [ ] `infra/envs/dev/` 에서 두 버킷 인스턴스화
  - [ ] `modules/s3-bucket/tests/*.tftest.hcl` — versioning on/off, SSE-S3, public-access-block, lifecycle 변수화 검증 (`terraform test` 통과)
  - [ ] `terraform fmt -check`, `validate`, `tflint`, `checkov` 통과
  - [ ] `terraform plan` 스모크 (apply는 사용자 수동)
- **테스트 전략**: 재사용 모듈은 네이티브 `terraform test`(mock provider/plan 기반 assert)로 계약을 고정 + 정적 분석(fmt/validate/tflint/checkov) + plan 스모크. apply는 사용자가 자격증명으로 수동 실행.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev fmt -check -recursive`
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev validate`
  - `docker compose run --rm tf sh -c "cd infra/modules/s3-bucket && terraform init -backend=false && terraform test"`
  - `docker compose run --rm tf sh -c "cd infra/envs/dev && tflint && checkov -d ."`
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev plan` (자격증명 주입 시)
- **예상 커밋 메시지 (영문)**: `feat(infra): reusable S3 module + tfstate/data buckets with terraform tests (M03)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T020** — `modules/s3-bucket`: 재사용 모듈 변수(`name`, `versioning`, `force_destroy`, `lifecycle_rules`) + versioning/SSE/public-access-block 출력 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T021** — `modules/tfstate-bucket`: s3-bucket 모듈 호출 + `backend.tf`(로컬→S3 마이그레이션 절차 주석) + `use_lockfile=true` (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T022** — `modules/data-bucket`: s3-bucket 모듈 재사용, private+versioned, 크롤러 업로드 prefix(`sap-c02/`) 문서화 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T023** — `envs/dev`: 두 모듈 인스턴스화 + provider/version 핀(AWS >=5.60, TF>=1.15) + budget alert 리소스 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T024** — `modules/s3-bucket/tests/`: `.tftest.hcl` 작성 (versioning on/off, SSE-S3, public-access-block, lifecycle 변수화를 plan/mock assert로 검증). 모듈 계약 고정 (executor: codex, skill: `terraform-code-generation:terraform-test`)
- [x] **T025** — 검증: fmt/validate/`terraform test`/tflint/checkov 통과, plan 스모크 (executor: codex, skill: none)

---

## [x] M04 — 백엔드 (FastAPI): 인메모리 풀 + REST + CORS

- **목적 (Purpose)**: S3(MinIO)에서 questions.json을 기동 시 로드하고 5분 ETag 폴링으로 재로드하며, contracts/openapi.yaml대로 REST를 서빙한다.
- **명세 참조**: spec.md FR-020/FR-021, plan.md §Backend, data-model.md §1, contracts/openapi.yaml, research.md D-002/D-003/D-004
- **주 Executor**: codex
- **Skill routing**: (없음 — Python/FastAPI 전용 스킬 미설치, fallback)
- **완료 정의 (DoD)**:
  - [x] OpenAPI 문서가 contracts/openapi.yaml과 drift 없음 (export 타겟)
  - [x] 풀 로더: 기동 로드 + 5분 ETag 폴링 + 원자적 swap + 검증 실패 시 이전 풀 유지
  - [x] S3 unreachable 시 프로세스 non-zero 종료(빈 풀 서빙 금지)
  - [x] `/healthz`, `/readyz`, `/exams`, `/exams/{slug}/questions`, `/exams/{slug}/questions/{n}` 동작
  - [x] 통일 에러 envelope `{code,message,details?,requestId}` + X-Request-Id 미들웨어
  - [x] CORS allow-list(`CORS_ALLOWED_ORIGINS`) 적용
  - [x] schemathesis 계약 테스트 통과
- **테스트 전략**: pytest 단위(풀 로더 분기: 변경/무변경/잘못된 JSON/5xx) + httpx 통합 + schemathesis 계약(**Schemathesis 4.x: 실행 중 api 컨테이너의 라이브 스키마 대상**, 구버전 `--app` 미지원). moto 또는 MinIO로 S3 모킹.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm api pytest`
  - `docker compose run --rm api python -m young_certi_api.export_openapi | diff - contracts/openapi.yaml`
  - `docker compose run --rm api ruff check . && docker compose run --rm api mypy .`
  - `docker compose up -d api && docker compose run --rm api schemathesis run -u http://api:8000 http://api:8000/openapi.json` (Schemathesis 4.x; 구버전 `schemathesis run --app young_certi_api.main:app /openapi.json`는 폐지됨)
- **예상 커밋 메시지 (영문)**: `feat(api): in-memory question pool, REST endpoints, unified errors, CORS (M04)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T030** — 계약 동기화: `export_openapi.py` (FastAPI app → contracts/openapi.yaml) + pydantic v2 스키마(Exam/Question/Choice/ErrorEnvelope) (executor: codex, skill: none)
- [x] **T031** — RED: 풀 로더 테스트 (기동 로드, ETag 무변경 no-op, 변경+유효 swap, 변경+무효 keep-old, S3 5xx keep-old, 기동 실패 시 exit) (executor: codex, skill: none)
- [x] **T032** — GREEN: `pool.py` 인메모리 로더 + 5분 폴링 백그라운드 태스크 + 원자적 swap (executor: codex, skill: none)
- [x] **T033** — RED: 라우터 테스트 (list/single/404 envelope) + 에러 핸들러 테스트 (validation/unhandled→envelope, requestId echo) (executor: codex, skill: none)
- [x] **T034** — GREEN: `routers/questions.py`, `errors.py`(통일 envelope), `X-Request-Id` 미들웨어, CORS 미들웨어 (executor: codex, skill: none)
- [x] **T035** — 계약 테스트: schemathesis가 live app 대비 통과, openapi.yaml drift 0 (executor: codex, skill: none)
- [x] **T036** — 검증: pytest, ruff, mypy, schemathesis 전부 통과 (executor: codex, skill: none)

---

## [x] M05 — 프론트엔드 (React): 문제 풀이 화면 + 컴포넌트 + localStorage

- **목적 (Purpose)**: `/sap-c02/practice/:n` 화면을 구현한다. 사이드 메뉴, 단일/다중 선지, 녹/적 피드백, 해설, 이전/다음, 즐겨찾기, 문제집 모달, localStorage 상태. (코드만 — 비주얼 polish는 M09 Claude)
- **명세 참조**: spec.md User Story 1~3 + FR-001~019, plan.md §Frontend + §Design System, data-model.md §2, research.md D-008~D-013
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — React 컴포넌트/상태/데이터 패칭 패턴 (Vite SPA이므로 SSR/RSC 항목은 무시, 의도만 차용)
- **완료 정의 (DoD)**:
  - [ ] 라우팅 `/:examSlug/practice/:n` + URL reload-stable + 잘못된 n 처리
  - [ ] `ChoiceList` 단일(radio)/다중(checkbox) enforce + 0개 제출 거부
  - [ ] `ResultFeedback` 녹/적/missed-correct + 해설
  - [ ] `SideMenu` flat 스크롤 목록 + 현재 표시 + 상태 dot + 즐겨찾기 별 + 클릭 점프
  - [ ] localStorage 훅 (session/results/favorites/sets) + 재로드 보존 + quota/비활성 폴백
  - [ ] `QuestionSetPicker` 모달(생성/선택, 중복 no-op, 동명 재사용)
  - [ ] API 5xx/404 에러 envelope 렌더 + 재시도
  - [ ] zod로 API 응답 검증, `VITE_API_BASE_URL` 주입
- **테스트 전략**: vitest + React Testing Library, 사용자 상호작용 기반. plan.md 테스트 다이어그램의 FE GAP 전부 커버.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): SAP-C02 practice screen, components, localStorage state (M05)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T040** — 스캐폴드: Vite+React19+TS+Tailwind4 설정, 라우터, `api/` 생성 타입(openapi.yaml 기반), `lib/error.ts`(envelope 파서), zod 스키마 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T041** — RED: localStorage 훅 테스트 (useLocalSession/useFavorites/useQuestionSets/usePerQuestionResult — 생성/중복/재로드/quota/비활성) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T042** — GREEN: localStorage 훅 구현 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T043** — RED: 컴포넌트 테스트 (ChoiceList radio/checkbox/0개거부, ResultFeedback 4 케이스, SideMenu, QuestionSetPicker, FavoriteToggle) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T044** — GREEN: 컴포넌트 + practice 페이지 구현 (기능 우선, 비주얼은 M09에서 polish) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T045** — RED+GREEN: practice 페이지 통합 (fetch happy/404/5xx, prev/next, URL 동기화) + @tanstack/react-query (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T046** — 검증: test/typecheck/lint/build 전부 통과 (executor: codex, skill: none)

---

## [x] M06 — 로컬 E2E 통합

- **목적 (Purpose)**: 전체 스택을 docker compose로 띄워 P1 해피패스를 Playwright로 검증한다. 로컬에서 "진짜 동작"을 확인하는 단계 (사용자: 로컬 테스트 먼저).
- **명세 참조**: spec.md Success Criteria SC-001~006, quickstart.md "P1 acceptance walkthrough", plan.md 테스트 다이어그램 →E2E 항목
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — E2E 셋업 관점
- **완료 정의 (DoD)**:
  - [ ] Playwright happy-path: 문제 풀기→녹/적→해설→다음→뒤로(결과 보존)→즐겨찾기→문제집 추가→새로고침 생존
  - [ ] CORS 프리플라이트가 실제 분리 origin(web→api)에서 동작
  - [ ] SC-002(1→N 네비 무손실), SC-004(20 네비+새로고침 생존), SC-005(URL reload-stable) 검증
- **테스트 전략**: docker compose full-stack + Playwright. CI에서도 동일 컨테이너로 재현.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose up -d minio api web`
  - `docker compose run --rm web pnpm e2e` (Playwright)
  - `docker compose down -v`
- **예상 커밋 메시지 (영문)**: `test(e2e): local full-stack Playwright happy-path + CORS preflight (M06)`

### 하위 작업 (Subtasks)

- [x] **T050** — Playwright 설정 + compose `e2e` 타겟 (web 컨테이너 내 헤드리스) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T051** — RED+GREEN: P1 happy-path 시나리오 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T052** — CORS 분리 origin 검증 테스트 (web origin → api origin 프리플라이트) (executor: codex, skill: none)
- [x] **T053** — 검증: 전체 스택 e2e 통과, `down -v` 정상 (executor: codex, skill: none)

---

## [x] M07 — EKS + Karpenter + Helm 배포 (로컬 검증 후)

- **목적 (Purpose)**: 로컬이 검증된 뒤 ephemeral EKS 클러스터(Terraform) + Karpenter(Spot) + 백엔드 Helm 차트를 만든다. **사용자 요청대로 S3(M03) 다음, 로컬(M06) 이후로 미룬 인프라.**
- **명세 참조**: plan.md §infra(eks, helm), constitution I/II/III, research.md D-006
- **주 Executor**: codex
- **Skill routing**:
  - `terraform-code-generation:terraform-search-import` — VPC/EKS/Karpenter 레지스트리 모듈·프로바이더 버전 탐색
  - `terraform-code-generation:terraform-style-guide` — HCL 스타일/모듈 구조
  - (Helm 차트 T063은 terraform 범위 밖 — skill none)
- **완료 정의 (DoD)**:
  - [ ] `infra/modules/vpc/`, `infra/modules/eks/`(Karpenter + Spot NodePool), `infra/modules/github-oidc/`
  - [ ] `infra/helm/young-certi/` 백엔드 차트 (Deployment, Service, liveness/readiness probe, IRSA ServiceAccount, HPA 또는 KEDA scale-to-zero)
  - [ ] `infra/envs/dev`에 EKS 인스턴스화 (M03 S3 모듈 재사용, tfstate 그대로)
  - [ ] fmt/validate/tflint/checkov 통과, `helm lint` 통과, `terraform plan` 스모크
  - [ ] cluster-up/cluster-down 워크플로 (workflow_dispatch + 수동 destroy)
- **테스트 전략**: 정적 분석 + plan/helm lint. 실제 apply/배포는 사용자 수동 (비용/자격증명).
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev validate`
  - `docker compose run --rm tf sh -c "cd infra/envs/dev && tflint && checkov -d ."`
  - `docker compose run --rm tf helm lint infra/helm/young-certi`
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev plan`
- **예상 커밋 메시지 (영문)**: `feat(infra): ephemeral EKS + Karpenter + backend Helm chart (M07)`

### 하위 작업 (Subtasks)

- [x] **T060** — `modules/vpc` (executor: codex, skill: `terraform-code-generation:terraform-search-import`)
- [x] **T061** — `modules/eks`: 클러스터 + Karpenter Helm + Spot NodePool (executor: codex, skill: `terraform-code-generation:terraform-search-import`)
- [x] **T062** — `modules/github-oidc`: CI용 OIDC role(키 없음) (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T063** — `helm/young-certi`: 백엔드 차트(probe, IRSA, scale) (executor: codex, skill: none)
- [x] **T064** — `envs/dev` EKS 인스턴스화 + cluster-up/down 워크플로 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [x] **T065** — 검증: validate/tflint/checkov/helm-lint/plan 통과 (executor: codex, skill: none)

---

## [ ] M08 — 프론트엔드 배포(S3+CloudFront) + CI/CD

- **목적 (Purpose)**: 프론트엔드를 S3+CloudFront로 배포하는 Terraform과, 4개 GitHub Actions 워크플로(lint/test/build/scan/plan)를 만든다.
- **명세 참조**: plan.md §infra(frontend deploy), §CI/CD, constitution I/III/V
- **주 Executor**: codex
- **Skill routing**:
  - `terraform-code-generation:terraform-style-guide` — frontend-cdn 모듈 HCL 스타일/구조 (워크플로 yaml은 skill none)
- **완료 정의 (DoD)**:
  - [ ] `infra/modules/frontend-cdn/`: S3(정적) + CloudFront + OAC, M03 s3-bucket 모듈 재사용
  - [ ] CORS: 백엔드 ALB가 CloudFront 도메인 allow
  - [ ] `.github/workflows/`: frontend.yaml, backend.yaml(+trivy scan), crawler.yaml, infra.yaml(fmt/validate/tflint/checkov/plan)
  - [ ] 전 워크플로 GitHub OIDC 인증(장기 키 0)
  - [ ] fmt/validate/checkov 통과, plan 스모크
- **테스트 전략**: 정적 분석 + plan. 실제 배포는 사용자 수동/워크플로 dispatch.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev validate`
  - `docker compose run --rm tf sh -c "cd infra/envs/dev && checkov -d ."`
  - `docker compose run --rm tf terraform -chdir=infra/envs/dev plan`
- **예상 커밋 메시지 (영문)**: `feat(infra): frontend S3+CloudFront deploy + GitHub Actions CI/CD (M08)`

### 하위 작업 (Subtasks)

- [ ] **T070** — `modules/frontend-cdn`: S3+CloudFront+OAC, s3-bucket 모듈 재사용 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [ ] **T071** — 백엔드 CORS를 CloudFront 도메인으로 좁히는 변수 배선 (executor: codex, skill: `terraform-code-generation:terraform-style-guide`)
- [ ] **T072** — `.github/workflows/frontend.yaml`, `backend.yaml`(trivy 이미지 스캔 포함) (executor: codex, skill: none)
- [ ] **T073** — `.github/workflows/crawler.yaml`, `infra.yaml`(fmt/validate/tflint/checkov/plan) (executor: codex, skill: none)
- [ ] **T074** — 검증: validate/checkov/plan 통과, 워크플로 yaml lint (executor: codex, skill: none)

---

## [ ] M09 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: codex가 만든 결과물을 전 화면 일관성, 디자인 시스템(plan.md §Design System), 접근성, 디렉터리 위생 관점에서 한 번에 정리하고 최종 커밋한다.
- **명세 참조**: spec.md(UX 요구사항), plan.md §Design System(토큰·상태 매트릭스·a11y baseline), 이전 모든 M-task 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — UI 컴포넌트 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion·타이포그래피
  - `design-review` — 라이브 사이트 시각 감사
  - `vercel-react-best-practices` — React 구조·성능 재점검
- **완료 정의 (DoD)**:
  - [ ] 프론트엔드 디렉터리 구조 점검 보고서 (이상 항목 정리)
  - [ ] 컴포넌트 일관성 (plan.md 토큰: Pretendard/zinc/emerald·rose·amber·간격·radius) 적용
  - [ ] 디자인 시스템 polish 전 화면 적용 (anti-slop: blob/이모지/3-column 금지)
  - [ ] a11y / responsive / motion sweep 통과 (focus ring, 44px, 4.5:1, 모바일 sheet)
  - [ ] `design-review` 라이브 렌더 점검 통과
  - [ ] 최종 git commit 생성
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d web && design-review` 라이브 점검
- **예상 커밋 메시지 (영문)**:
  - `style(web): UI/UX consolidation, design-system polish, a11y/responsive sweep (M09)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T901** — 프론트엔드 디렉터리 전수 워크: orphan/네이밍/위치 드리프트 식별 (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T902** — 컴포넌트 일관성 감사: plan.md 토큰(간격·색·타이포)·primitive 재사용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T903** — 디자인 시스템 polish 전 화면 적용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T904** — a11y / responsive / motion sweep (executor: claude, skill: `web-design-guidelines`)
- [ ] **T905** — `design-review`로 라이브 렌더 시각 감사 (executor: claude, skill: `design-review`)
- [ ] **T906** — 최종 git commit (executor: claude, skill: none)
