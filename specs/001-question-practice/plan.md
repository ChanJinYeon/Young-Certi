# Implementation Plan: YoungCerti — Question Practice MVP

**Branch**: `001-question-practice` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-question-practice/spec.md`

## Summary

Ship the first usable slice of YoungCerti: a one-question-at-a-time
practice screen for the AWS SAP-C02 exam (Korean question text), with a
left-side flat scrollable menu, single/multi-select answer behavior
enforced by the answer key, green/red per-choice feedback after
submission, explanation reveal, prev/next navigation, favorites (small
yellow marker, session-only), and add-to-question-set (session-only).
All learner state lives in browser localStorage; the backend is
read-only for user state.

Technical approach: a small **FastAPI** backend reads a single
`questions.json` artifact from a private S3 bucket at container start,
holds it in memory, and serves a tiny REST API. A **React + TypeScript
+ Tailwind 4** SPA consumes that API and stores all per-learner state
in localStorage. A separate **Go** crawler (run on demand, not part of
the running stack) produces `questions.json` while respecting krdump
rate limits. The frontend is served from **S3 + CloudFront**
(static, cached, near-zero cost); the backend runs in an ephemeral
**EKS + Karpenter + Spot** cluster behind an ALB. The two are on
different origins, so the backend ships **CORS** headers scoped to
the CloudFront domain. Everything runs in containers, locally via
`docker compose` and in AWS provisioned by **Terraform** with state
in S3.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x on Node 22 LTS, React 19, Vite 6
- Backend: Python 3.12
- Crawler: Go 1.23
- IaC: Terraform >= 1.15 (AWS provider >= 5.60). The S3 backend uses
  `use_lockfile = true` (S3 native state locking, GA in 1.11+); no
  DynamoDB lock table is provisioned.

**Primary Dependencies**:
- Frontend: react, react-dom, react-router-dom, tailwindcss v4, vite,
  @tanstack/react-query (REST cache), zod (schema validation of API
  responses), vitest + @testing-library/react. The API base URL is
  injected at build time via `VITE_API_BASE_URL` (the ALB hostname in
  prod, `http://localhost:8000` in dev) so the SPA can call across
  origins.
- Backend: fastapi, uvicorn (standard), pydantic v2, boto3,
  orjson, pytest, pytest-asyncio, httpx (test client), schemathesis
  (OpenAPI contract tests). CORS is enabled via
  `fastapi.middleware.cors.CORSMiddleware` with an allow-list driven
  by `CORS_ALLOWED_ORIGINS` env var (single value in dev, the
  CloudFront domain in prod). A small middleware injects a
  per-request `X-Request-Id` (UUIDv4) into the response headers and
  into every log record; the unified error envelope echoes it as
  `requestId`. The OpenAPI document at `contracts/openapi.yaml` is
  exported from the live FastAPI app by a make/CI target
  (`python -m young_certi_api.export_openapi > contracts/openapi.yaml`)
  and the schemathesis contract test fails if the committed file
  drifts from the runtime app.
- Crawler: colly or net/http, golang.org/x/time/rate (token-bucket
  limiter), goquery (HTML parsing), aws-sdk-go-v2 (S3 upload), zerolog
- Infra: Terraform AWS provider, kubernetes / helm providers,
  community modules for VPC and EKS (terraform-aws-modules/eks),
  Karpenter Helm chart, External Secrets (only if a secret store is
  introduced later)

**Storage**:
- **No runtime database.** Backend loads the question pool from S3
  into memory at container start; no per-request DB lookup.
- **Pool refresh**: a background task in the backend issues an S3
  `HeadObject` against `questions.json` every 5 minutes and compares
  the returned `ETag` against the in-memory copy's ETag. On change,
  it downloads the new object, validates it against the pydantic
  schema, and atomically swaps the in-memory pool (old pool kept
  until the new one is fully loaded; readers never see a
  half-swapped state). Failed validation logs the error and keeps
  the previous pool. No manual rolling restart is required to ship
  a new crawl; rolling restart remains the manual escape hatch.
- Per-learner state (favorites, question sets, per-question results):
  100% browser **localStorage**, keyed by an opaque session id
  generated client-side.
- Source artifact: `s3://young-certi-data-<acct>-<region>/sap-c02/questions.json`
  (private; SSE-S3; versioned).
- Terraform state: `s3://young-certi-tfstate-<acct>-<region>/<env>/terraform.tfstate`
  with S3 native state locking (Terraform >= 1.11, `use_lockfile = true`,
  lockfile co-located with the state object; no DynamoDB lock table
  needed). The bootstrap module that creates the tfstate bucket itself
  uses a local backend and is migrated to remote on first apply.

**Testing**:
- Frontend: vitest unit + React Testing Library component tests;
  Playwright for one happy-path E2E covering the P1 story.
- Backend: pytest unit + httpx integration; schemathesis runs the
  OpenAPI document against the live FastAPI app as a contract test.
- Crawler: Go standard testing + httptest-served fixture pages to
  test rate-limit and parser logic offline.
- Infra: `terraform fmt -check`, `terraform validate`, `tflint`,
  `checkov` static analysis; one `terraform plan` smoke run in CI.

**Target Platform**:
- Frontend: modern desktop browsers (Chrome / Edge / Safari /
  Firefox current and current-1). Mobile must not actively break but
  is not a layout target.
- Backend: Linux container (amd64; arm64 acceptable for Spot
  diversification), Python 3.12 slim base.
- Crawler: Linux/macOS dev workstation invocation; not deployed to
  the cluster.
- Cluster: AWS EKS (Kubernetes 1.31+), Karpenter, Spot worker nodes.

**Project Type**: Web application with two deployable services
(frontend SPA, backend API) plus one offline tool (crawler) and an
infrastructure module set.

**Performance Goals**:
- Backend cold start (container start → readiness): ≤ 5 seconds with
  the SAP-C02 pool (target ≤ 500 questions, ≤ 5 MB JSON).
- API p95 latency for `GET /api/v1/exams/sap-c02/questions/{n}` and
  `GET /api/v1/exams/sap-c02/questions` (number list): ≤ 50 ms
  in-cluster, ≤ 150 ms end-to-end from CloudFront edge.
- Frontend first contentful paint on practice screen over a fresh
  cache: ≤ 2.0 s on a 5 Mbps connection.
- Side-menu scroll with 500 question items: 60 fps; if profiling
  shows jank, introduce a windowed list (react-window) at that point,
  not before.

**Constraints**:
- Hard monthly AWS cost ceiling: **USD 30 / month** when the cluster
  is up; AWS Budgets alert at 50% and 80%; cluster destroyed by the
  operator when not actively demoed.
- No managed RDBMS (RDS, Aurora) — constitution III.
- No long-lived AWS access keys anywhere; CI authenticates via
  GitHub OIDC; in-cluster workloads use IRSA.
- No `kubectl apply -f` of untracked manifests; no AWS console
  mutations — constitution I.
- Crawler MUST respect `robots.txt`, send a truthful `User-Agent`,
  throttle to ≤ 1 request / 2 seconds with exponential backoff on
  4xx/5xx, and run from a single machine — constitution VII.
- Raw crawled artifacts MUST stay in a private S3 bucket; the public
  artifact is the crawler source code, not the data.

**Scale/Scope**:
- Question pool size for the MVP: ~75–500 questions for SAP-C02.
- Concurrent users: design target 10 concurrent practice sessions
  during demo; the in-memory architecture scales horizontally per
  pod with no shared state, so adding pods is the scale knob.
- Code surface for the MVP: ~3k LOC frontend, ~1k LOC backend,
  ~800 LOC crawler, ~500 LOC Terraform across modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version evaluated: **v1.0.0** (`.specify/memory/constitution.md`).

| Principle | Status | Note |
|---|---|---|
| I. IaC-Only | PASS | All AWS resources via Terraform; cluster workloads via Helm/Kustomize; no console clicks. |
| II. Ephemeral Cluster by Default | PASS | EKS is created via CI / operator and destroyed when not demoed. No state lives inside the cluster (questions in S3, user state in browser, tfstate in S3). |
| III. Cost-Aware Architecture | PASS | No managed RDBMS. Spot via Karpenter. Budget alerts. Hard ceiling $30/mo. |
| IV. Incremental Learning Steps | PASS (gate handed to `/task-init`) | This plan does not author tasks; `/task-init` MUST decompose work into smallest reviewable units. |
| V. REST Contract Discipline | PASS | OpenAPI 3.1 document checked in under `contracts/openapi.yaml`; unified error envelope `{ code, message, details?, requestId }`; schemathesis contract test gates merges. |
| VI. Stateless App, Session-Only State | PASS | Backend has no per-learner writes. Container is stateless; liveness/readiness probes defined. User state in browser only. |
| VII. Ethical Data Sourcing | PASS | Crawler: robots.txt-aware, rate-limited, single-machine, identifying User-Agent. Raw data in private S3. The crawler source is the public artifact. |

**Result**: PASS, no violations to justify. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-question-practice/
├── plan.md              # this file
├── spec.md              # feature spec (already authored)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (run-local recipe)
├── contracts/
│   └── openapi.yaml     # Phase 1 output
└── checklists/
    └── requirements.md  # from /speckit-specify
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── sap-c02/
│   │       └── practice/       # /:examSlug/practice/:n route lives here
│   ├── components/
│   │   ├── QuestionPanel/
│   │   ├── ChoiceList/         # radio | checkbox per answer-key size
│   │   ├── ResultFeedback/     # green/red per choice + explanation
│   │   ├── SideMenu/           # flat scrollable question-number list
│   │   ├── FavoriteToggle/
│   │   └── QuestionSetPicker/
│   ├── hooks/
│   │   ├── useLocalSession.ts  # session id + localStorage namespace
│   │   ├── useFavorites.ts
│   │   ├── useQuestionSets.ts
│   │   └── usePerQuestionResult.ts
│   ├── api/                    # generated TS types from openapi.yaml
│   └── lib/error.ts            # parses the unified error envelope
└── tests/
    ├── unit/
    ├── component/
    └── e2e/                    # Playwright happy-path

backend/
├── src/
│   └── young_certi_api/
│       ├── main.py             # FastAPI app, lifespan loader
│       ├── pool.py             # in-memory pool + reload-on-start
│       ├── routers/
│       │   └── questions.py
│       ├── schemas.py          # pydantic v2 models
│       ├── errors.py           # unified error envelope + handlers
│       └── settings.py         # env-driven config (12-factor)
└── tests/
    ├── unit/
    ├── integration/
    └── contract/               # schemathesis driver

crawler/
├── cmd/
│   └── crawl-sap-c02/main.go
├── internal/
│   ├── fetcher/                # rate-limited http client
│   ├── parser/                 # krdump HTML → Question
│   ├── pool/                   # dedupe + ordering
│   └── uploader/               # S3 put with versioning
└── testdata/                   # offline fixture HTML pages

infra/
├── modules/
│   ├── vpc/
│   ├── eks/                    # cluster + Karpenter
│   ├── data-bucket/            # private versioned S3 for questions
│   ├── tfstate-bucket/         # bootstrap; chicken-and-egg note
│   └── github-oidc/            # GitHub OIDC role for CI
├── envs/
│   └── dev/                    # only env in MVP
└── helm/
    └── young-certi/            # umbrella chart for frontend + backend

.github/
└── workflows/
    ├── frontend.yaml           # lint, test, build, image push
    ├── backend.yaml            # lint, test, contract, image push, scan
    ├── crawler.yaml            # lint, test, build (artifact upload)
    ├── infra.yaml              # fmt, validate, tflint, checkov, plan
    └── cluster-up.yaml         # manual dispatch: create cluster + deploy

docker-compose.yml              # local: frontend + backend + minio (S3 stand-in)
```

**Structure Decision**: web application (frontend + backend) plus an
offline crawler tool plus an infrastructure module set. Four top-level
trees (`frontend/`, `backend/`, `crawler/`, `infra/`) keep each
deployable boundary owned by its own CI workflow, image, and Helm
sub-chart. The crawler is intentionally not deployed to the cluster
(constitution VII: single-machine).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_None. Constitution Check is fully PASS._

## Test Coverage Diagram (from plan-eng-review)

Traced from the plan's components. Each branch needs at least one test
before /task-init can mark its parent task done.

```
FRONTEND (frontend/)
[+] pages/sap-c02/practice/[n]
  ├── route param invalid (non-numeric n)        → [GAP unit] redirect to first
  ├── question fetch happy                       → [GAP unit] @tanstack/react-query mocked
  ├── question fetch 404                         → [GAP unit] "question unavailable"
  ├── question fetch 5xx                         → [GAP unit] retry + error envelope render
  └── full P1 flow: solve → green/red → next     → [GAP →E2E] Playwright happy path
[+] components/ChoiceList
  ├── single-answer (radio behavior)             → [GAP unit]
  ├── multi-answer (checkbox behavior)           → [GAP unit]
  └── submit with zero choices rejected          → [GAP unit]
[+] components/ResultFeedback
  ├── chose all correct (multi)                  → [GAP unit]
  ├── chose subset of correct                    → [GAP unit] missed-correct marker
  ├── chose superset (correct + incorrect)       → [GAP unit] both green and red
  └── chose only incorrect                       → [GAP unit] reveal correct
[+] components/SideMenu
  ├── 500 items, scroll perf                     → [GAP unit] render count assertion
  ├── current item highlighted                   → [GAP unit]
  └── click jumps + URL updates                  → [GAP unit] router mock
[+] hooks/useLocalSession
  ├── first visit generates session id           → [GAP unit]
  ├── second tab reuses id (same browser)        → [GAP unit] localStorage shared
  └── localStorage disabled fallback             → [GAP unit] graceful in-memory
[+] hooks/useFavorites, useQuestionSets, usePerQuestionResult
  ├── happy add/remove                           → [GAP unit] each
  ├── duplicate add into set is no-op            → [GAP unit]
  └── reload preserves state                     → [GAP unit] localStorage persistence

BACKEND (backend/)
[+] pool.py (load + refresh)
  ├── start: download from S3, parse, validate   → [GAP unit] moto/minio
  ├── start: S3 fails → process exits non-zero   → [GAP unit] (no silent empty pool)
  ├── refresh: ETag unchanged → no-op            → [GAP unit]
  ├── refresh: ETag changed + valid → atomic swap → [GAP unit] readers see complete pool
  ├── refresh: ETag changed + invalid JSON       → [GAP unit] keep old, log error
  └── refresh: S3 transient 5xx                  → [GAP unit] keep old, retry next tick
[+] routers/questions.py
  ├── GET /api/v1/exams/sap-c02/questions        → [GAP unit] list shape
  ├── GET /api/v1/exams/sap-c02/questions/{n}    → [GAP unit] happy
  └── GET .../questions/{n} where n missing      → [GAP unit] 404 + error envelope
[+] errors.py
  ├── pydantic validation error → envelope shape → [GAP unit] {code,message,requestId}
  ├── unhandled exception → envelope + 500       → [GAP unit] requestId echoed
  └── envelope includes echoed X-Request-Id      → [GAP unit]
[+] CORS middleware
  └── preflight from allowed origin succeeds     → [GAP unit] httpx OPTIONS
[+] Contract
  └── schemathesis vs live app                   → [GAP →contract] CI gate

CRAWLER (crawler/)
[+] fetcher (rate-limited http client)
  ├── token-bucket 1 req / 2s respected          → [GAP unit] httptest server, clock fake
  ├── exponential backoff on 429/5xx             → [GAP unit] sequence of fixtures
  └── User-Agent header set + truthful           → [GAP unit]
[+] parser
  ├── well-formed page → Question                → [GAP unit] golden fixture
  ├── single-answer vs multi-answer detected     → [GAP unit] both fixtures
  └── malformed page → skipped, logged           → [GAP unit] (constitution VII)
[+] pool dedupe + ordering
  └── deterministic output                       → [GAP unit] hash assert

INFRA (infra/)
└── terraform fmt / validate / tflint / checkov  → [GAP CI] static gates
└── single `terraform plan` smoke (no apply)     → [GAP CI]

COVERAGE: 0 / 39 paths today (initial commit, no code).
TARGET on first ship: ≥ 35 / 39 (≥90%), with the 4 remaining
documented as deferred.

Legend: GAP = test to be added by /task-init; →E2E = Playwright;
→contract = schemathesis; →CI = pipeline gate.
```

## Failure Modes Registry (from plan-eng-review)

| Codepath | Failure mode | Test? | Error handling? | User sees? |
|---|---|---|---|---|
| Backend start: S3 unreachable | container can't load pool | planned | exits non-zero, k8s restarts | 503 from ALB (acceptable) |
| Backend refresh: bad JSON | new pool malformed | planned | keep old pool, log | nothing (transparent) |
| Backend: question {n} missing | 404 path | planned | envelope `{code:"NOT_FOUND",...}` | "question unavailable" |
| Frontend: API 5xx | network/backend error | planned | error envelope render + retry | retry button + message |
| Frontend: localStorage quota exceeded | huge question-set | planned | catch QuotaExceededError, prompt user to delete a set | clear message |
| Frontend: localStorage disabled (Safari private) | hooks return in-memory state | planned | in-memory fallback + banner | "session-only this tab" banner |
| Crawler: source 429 | rate limited | planned | backoff + retry, max 3, then abort run | operator sees non-zero exit |
| CORS preflight fails | misconfigured ALLOWED_ORIGINS | planned | unit test catches; in prod, browser blocks | broken UI; alarm on 4xx surge |

**Critical gaps**: 0. Every listed failure has a planned test and a
defined user-facing behavior.

## Worktree Parallelization Strategy (from plan-eng-review)

Sequential at the very start (need shared scaffolding), then two
parallel lanes can run from M03 onward:

| Step | Modules touched | Depends on |
|---|---|---|
| M01 Repo scaffolding (docker-compose, dirs, lint configs) | root, all dirs | — |
| M02 Infra bootstrap (tfstate bucket, github-oidc) | `infra/` | M01 |
| M03 Backend skeleton + pool loader | `backend/` | M01 |
| M04 Frontend skeleton + router + design tokens | `frontend/` | M01 |
| M05 Crawler skeleton + parser tests | `crawler/` | M01 |
| M06 Backend REST + OpenAPI + contract test | `backend/` | M03 |
| M07 Frontend practice screen + side menu | `frontend/` | M04 |
| M08 Crawler full run + S3 upload | `crawler/` | M05 |
| M09 EKS module + Helm chart for backend | `infra/`, `infra/helm/` | M02, M06 |
| M10 Frontend deploy (S3+CloudFront) | `infra/` | M02, M07 |
| M11 End-to-end demo on real cluster | all | M08, M09, M10 |

**Lanes**:
- Lane A (BE+infra): M02 → M03 → M06 → M09 → M11
- Lane B (FE): M04 → M07 → M10
- Lane C (crawler): M05 → M08

M03/M04/M05 launch in parallel after M01. Lane A and Lane C share
no module directory. Lane B and Lane A meet only at M11.

**Conflict flags**: M02 and M09 both touch `infra/` — must be
sequential (already encoded above; M09 depends on M02).

## NOT in scope (from plan-eng-review)

- User accounts, OAuth, cross-device sync (spec-locked).
- Exam practice mode (timed) and question-sets landing screen — URL
  namespace reserved only.
- Statistics dashboards, analytics, cross-session progress.
- Crawler scheduling (cron, EventBridge). Crawler is on-demand only.
- DynamoDB or any managed RDBMS at runtime (constitution III).
- Server-side per-user storage (FR-015 — client-only).
- Mobile-first layout (must not actively break, but not a target).
- ARM image builds (amd64-only for MVP; arm64 is a follow-up).

## What already exists (from plan-eng-review)

- Spec-Kit `.specify/` scaffold (constitution, templates, hooks).
- Git extension hooks (`speckit-git-feature`, `speckit-git-commit`,
  `speckit-git-initialize`, `speckit-git-validate`,
  `speckit-git-remote`) — reuse for branching, validation, commits.
- This repo has no application code yet; nothing to refactor or
  reuse beyond the spec-kit machinery. All four trees
  (`frontend/`, `backend/`, `crawler/`, `infra/`) are net-new.

## Design System (from plan-design-review)

No `DESIGN.md` exists in this repo yet. Rather than block the MVP on a
full `/design-consultation` flow, the design decisions below are
inlined here as the source of truth. Promote to a real `DESIGN.md`
when the second feature lands.

### Typography
- **Display + body**: Pretendard Variable (kr-jp-en, free license,
  OFL). Loaded via `@fontsource-variable/pretendard`. No
  `system-ui` / `-apple-system` fallback as the primary font — only
  as the last-resort fallback.
- **Mono** (question id, error code in envelope): JetBrains Mono.
- **Scale (Tailwind classes)**: `text-sm` body, `text-base` choice
  text, `text-lg` question text, `text-2xl` page title. Line height
  `leading-relaxed` on question and explanation bodies (Korean text
  reads worse at tight leading).

### Color tokens (Tailwind v4 `@theme` CSS vars)
- **Neutral surface**: `zinc` palette. App background `zinc-50`,
  surface `white`, border `zinc-200`, muted text `zinc-500`, body
  text `zinc-800`.
- **Semantic — answer feedback**
  - Correct chosen: `emerald-600` text, `emerald-50` background,
    `emerald-200` border.
  - Incorrect chosen: `rose-600` text, `rose-50` background,
    `rose-200` border.
  - Missed correct (multi-answer, learner didn't pick a correct
    choice): `emerald-700` border + small "정답이지만 미선택"
    badge (not red, since it's not a wrong action).
- **Favorite marker**: `amber-400` star (Lucide `Star` filled) at
  `text-xs` size, placed top-right of the question card and
  prefixed to the side-menu number row.
- **Focus ring**: `ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-50`.
- All semantic colors verified ≥ 4.5:1 contrast against the
  matching background.

### Spacing & radius
- Spacing: Tailwind default scale, layout grid on 4px.
- Radius: `rounded-md` (6px) for choices, `rounded-lg` (8px) for
  cards, `rounded-xl` (12px) for modal.
- Shadow: `shadow-sm` for cards, `shadow-xl` for modal. No
  decorative shadows on small elements.

### Components and patterns
- **SideMenu**: fixed-width 240px on `lg` and up; collapses to a
  top sheet (`<details>` or shadcn `Sheet`) on `< md`. Each row
  shows `[★?] <number>` with a 2-color dot left of the number to
  indicate per-question status (gray = unattempted, emerald =
  correct submission, rose = incorrect submission). Active row
  has `bg-zinc-100` and a 2px left border in `zinc-900`.
- **ChoiceList**: each choice is a full-width row with a 24px
  selection indicator (radio circle for single-answer,
  rounded-sm checkbox for multi-answer) on the left and choice
  text right of it. Selection indicator is visible **before**
  hover, not hover-only.
- **ResultFeedback**: after submission, each choice keeps its
  position; the indicator is replaced by an icon (`Check` or
  `X`), and the entire row swaps to the matching semantic
  background. Explanation appears in a card below, separated by a
  full-width divider.
- **QuestionSetPicker**: **modal dialog** (decided D1). Centered,
  max-width 480px, contains a search/filter input, a scrollable
  list of existing sets (with item-count badges), and a "새
  문제집 만들기" inline input at the bottom. Esc and click-outside
  close. Confirm requires explicit button click (no
  double-click-to-add). Same modal handles both "create" and
  "pick" — no separate "create" route.
- **FavoriteToggle**: outlined star → filled amber star on toggle,
  with a 150ms scale 0.9→1 micro-interaction. No long animation.
- **PrevNext**: bottom-right pair, ghost style, disabled state
  visibly dimmed. Mobile: bottom-fixed bar.

### State matrix

| Component | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Pool fetch (initial) | full-screen skeleton (side menu shimmer + center spinner + "문제를 불러오는 중") | "출제 가능한 문제가 없습니다" + 재시도 버튼 | error envelope `code`/`message` rendered + 재시도 버튼 + requestId(small mono) | content render | n/a |
| Question fetch (per item) | inline skeleton inside main panel | n/a | "문제를 불러올 수 없습니다. 다음 문제로" + Next focused | content render | n/a |
| Submission | choices disabled, submit button shows spinner | n/a (validation prevents 0-choice submit) | inline rose toast "제출에 실패했어요. 다시 시도해주세요." | green/red feedback | n/a |
| Favorites | n/a | "아직 즐겨찾기한 문제가 없어요" (only when filtered view exists in future) | localStorage write failed → in-memory + small banner | star toggles | n/a |
| QuestionSetPicker | list area shimmer briefly | "아직 만든 문제집이 없어요. 새로 만들어보세요." (with focused name input) | inline "이름이 비어있어요" | toast "문제집에 추가되었습니다" | n/a |

### Mobile non-break baseline
- Layout `flex flex-col lg:flex-row`. Below `lg`, side menu becomes
  a top `<details>` sheet labeled "문제 목록 (n/N)".
- All touch targets ≥ 44 × 44 px.
- Modal full-screen on `< md`.

### Accessibility baseline
- Semantic HTML: `<main>`, `<nav>`, `<aside>`, `<dialog>` (or
  ARIA `role="dialog"` with focus trap).
- Every interactive element has a visible focus ring (see token
  above). Pure hover states are forbidden as the only
  affordance.
- Color is not the only signal: correct/incorrect rows also gain
  `Check` / `X` icons; favorites gain a "즐겨찾기" `aria-label`.
- Modal traps focus, returns focus to the trigger on close, and
  closes on Esc.
- Contrast: every text-on-background combination verified to ≥
  4.5:1 (body) or 3:1 (large text and non-text indicators).

### Keyboard
- Decided in D2: **no custom keyboard shortcuts** in the MVP.
  Rationale: the real SAP-C02 exam is mouse-driven, so practicing
  mouse-only mirrors test conditions. Browser-native tab order
  must still work end-to-end (tab through choices → submit →
  next).
- Side menu numbers are real `<a>` tags so they participate in
  tab order and are middle-click-openable.

### NOT in scope (design)
- Dark mode (deferred; `zinc` palette is dark-mode-ready when
  enabled later).
- Animations beyond the 150ms favorite micro-interaction.
- Custom illustrations for empty states (use plain prose; no
  generated SVG blobs — constitution-aligned anti-slop).
- Multi-exam home/landing screen (URL path reserved; component
  does not exist in MVP).
- Keyboard shortcut layer (user decision D2).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | Skipped: scope locked by constitution + spec |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 3 P1 architecture findings raised + resolved; test diagram produced (39 paths); 0 critical failure gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score 4/10 → 8/10; 2 decisions made (modal picker, no kbd shortcuts); inline Design System added with tokens/state matrix/a11y baseline |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Skipped per user "tight interaction" directive |
| DX Review | `/plan-devex-review` | Developer experience | 0 | — | No dev-facing surface |

- **UNRESOLVED:** 0
- **VERDICT:** ENG + DESIGN CLEARED — ready for `/task-init`.


