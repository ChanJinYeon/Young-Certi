# 작업 목록 — YoungCerti 홈/랜딩 화면 (002)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001의 ../001-question-practice/contracts/openapi.yaml 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다 (cloud/k8s 이전 용이성).
- 구현(프론트엔드 코드·테스트)은 전부 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 수행한다. **커밋은 large-task당 1개**로 Codex가 각 Mxx 검증 통과 후 직접 커밋하고, 마지막 Claude large-task만 Claude가 커밋한다(push는 안 함). — young-certi 정책.
- **002는 프론트엔드 전용 additive feature**. 백엔드·크롤러·인프라·계약 변경 없음. 기존 001 read-only API(`/exams`, `/exams/{slug}/questions`)만 소비.
- 기존 001 자산 재사용: React 19+TS+Vite+Tailwind 4 스택, 디자인 시스템 토큰, localStorage 훅(session·current·favorites·sets), `api/client.ts`/`api/types.ts`, react-router·react-query·zod.
- **001 URL·동작·테스트 무변경**(FR-010). 001의 `/:examSlug/practice`와 그 상태 모델은 건드리지 않는다.
- 신규 의존성 0. 한국어 UI, 로그인 없음, 세션 전용 상태(헌법 VI).

## 미해결 질문 (Open Questions — 반드시 해결할 것)

- 없음. spec의 모호점 3건(멀티-시험 홈, 이어 풀기 포함, 총 문항 수 표시)은 /speckit-clarify에서 모두 해소됨.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01 → M03까지 전부 Codex, 마지막 M04는 Claude UI/UX 종합 정리.

흐름: 1. M01 홈(`/`) + exams API + 라우팅 → 2. M02 시험 랜딩(`/:examSlug/`) → 3. M03 로컬 E2E + 001 무회귀 → 4. M04 Claude UI/UX polish.

**Large-task 내부 subtask 순서** (Codex 작업): (계약=001 재사용, DB 없음) → 프론트엔드 RED → 프론트엔드 GREEN → 검증.

## Executor 룰

- **기본 executor는 codex.** 프론트엔드 코드·테스트까지 전부 Codex가 담당한다.
- **마지막 large-task(M04)만 claude.** 디렉터리 점검, 컴포넌트 일관성, 디자인 시스템 polish, a11y/responsive/motion, 라이브 렌더 점검, UI/UX polish 커밋.
- **커밋은 large-task당 1개.** 각 Mxx의 codex subtask가 전부 끝나고 검증 통과 후 Codex가 해당 Mxx "예상 커밋 메시지"로 커밋한다. M04는 Claude가 커밋. 경계는 large-task — subtask 단위 커밋 금지, 검증 실패 시 커밋 금지. `git push`는 안 함(사용자/Claude가 수행).
- 각 subtask의 `skill: <name>`은 `/task-run` 시 Skill 도구로 호출되고, Codex CLI에서는 해당 스킬의 의도를 따라야 한다. `vercel-react-best-practices`는 Next.js 전제이므로 **의도만 차용**(Vite SPA — SSR/RSC 무시, 컴포넌트·번들·상태 패턴만).
- **모든 로컬 실행은 docker compose 컨테이너 안에서.** 호스트 직접 실행 금지.

---

## [ ] M01 — 홈 화면(`/`) + exams API 클라이언트 + 라우팅

- **목적 (Purpose)**: 루트 `/`에 자격증 목록 홈을 만들고, `GET /exams`를 소비하는 API 클라이언트와 `/`·`/:examSlug/` 라우트를 추가한다.
- **명세 참조**: spec.md FR-001/FR-002/US1, plan.md §Project Structure·§Eng Review, research.md D-001/D-004, data-model.md(ExamSummary)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — React 컴포넌트/상태/데이터 패칭 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [ ] `api/client.ts`에 `fetchExams()` (`GET /exams`) 추가 + `api/types.ts`에 ExamSummary zod 스키마 (001 스키마 재사용/확장)
  - [ ] `App.tsx`에 `/`(HomePage)·`/:examSlug/`(ExamLandingPage) 라우트 추가, `/:examSlug/practice`는 그대로
  - [ ] `pages/HomePage.tsx` — 자격증 카드 목록(현재 SAP-C02 1개), 카드 클릭 시 `/:examSlug/`로 이동
  - [ ] `components/CertCard.tsx` — 자격증 카드(이름 + 문항 수)
  - [ ] exams 조회 실패 시 화면은 렌더(목록/카운트 graceful degrade)
  - [ ] 홈 컴포넌트 테스트 통과 (목록 렌더 + 네비게이션)
  - [ ] test/typecheck/lint/build 통과
- **테스트 전략**: vitest + RTL, 사용자 상호작용(카드 클릭→네비) 기반. API는 fetch stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): home page (/) listing certifications + exams API client (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [ ] **T010** — API: `fetchExams()` + ExamSummary zod 스키마 (`GET /exams`), 001 client/types 패턴 재사용 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T011** — 라우팅: `App.tsx`에 `/`·`/:examSlug/` 라우트 추가(랜딩은 M02에서 채울 최소 스텁), 기존 `/:examSlug/practice`·`*` 리다이렉트 보존 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T012** — RED: HomePage/CertCard 테스트 (목록 렌더, 카드 클릭→`/:examSlug/` 네비, exams 실패 graceful) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T013** — GREEN: `pages/HomePage.tsx` + `components/CertCard.tsx` 구현 (기능 우선, 비주얼은 M04) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T014** — 검증: test/typecheck/lint/build 통과 + 001 테스트 무회귀 확인 (executor: codex, skill: none)

---

## [ ] M02 — 시험 랜딩(`/:examSlug/`): 진입 카드 + 총 문항 수 + 이어 풀기

- **목적 (Purpose)**: `/:examSlug/`에 진입 카드(문제 풀이 active, 시험 모드·문제집 disabled "준비 중") + 총 문항 수 + 이어 풀기를 구현한다.
- **명세 참조**: spec.md FR-003~005/FR-007/FR-008/FR-011/US2/US3, plan.md §Eng·§Design Review, research.md D-003/D-005, data-model.md(total, CurrentQuestion)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트/상태/데이터 패칭 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [ ] `pages/ExamLandingPage.tsx` — 진입 카드 3개(문제 풀이 active → `/:examSlug/practice`, 시험 모드·문제집 disabled)
  - [ ] `components/EntryCard.tsx` — active/disabled("준비 중" 배지 + aria-disabled, 비활성 클릭 시 네비 없음)
  - [ ] 총 문항 수 표시 (`GET /exams/{slug}/questions`의 `total`), 실패 시 카운트 생략하고 렌더
  - [ ] 이어 풀기: 001 `current` localStorage 읽어 저장된 문제 있으면 "이어 풀기" 노출 → `/:examSlug/practice`로 이동, 없으면 미노출
  - [ ] 알 수 없는 `:examSlug` → "해당 시험을 찾을 수 없습니다" + 홈 링크
  - [ ] 랜딩 컴포넌트 테스트 통과
  - [ ] test/typecheck/lint/build 통과
- **테스트 전략**: vitest + RTL. active vs disabled 진입, 카운트 present/absent, 이어 풀기 present/absent, unknown slug. fetch/localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): exam landing (/:examSlug/) — entry cards, total count, resume (M02)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [ ] **T020** — RED: ExamLandingPage/EntryCard 테스트 (active→practice 네비, disabled 무네비+"준비 중", 카운트 present/absent, 이어 풀기 present/absent, unknown slug) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T021** — GREEN: `components/EntryCard.tsx` (active/disabled 상태) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T022** — GREEN: `pages/ExamLandingPage.tsx` (카드 배치 + 총 문항 수 fetch + 이어 풀기 localStorage read + unknown slug 처리) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T023** — 검증: test/typecheck/lint/build 통과 + 001 무회귀 (executor: codex, skill: none)

---

## [ ] M03 — 로컬 E2E + 001 무회귀 검증

- **목적 (Purpose)**: 전체 스택을 띄워 `/` → 자격증 → 랜딩 → 문제 풀이 → practice happy-path를 Playwright로 검증하고, 001 기능이 그대로인지 확인한다.
- **명세 참조**: spec.md SC-001/SC-006, quickstart.md acceptance walkthrough, plan.md §Eng Review
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — E2E 셋업 관점
- **완료 정의 (DoD)**:
  - [ ] Playwright happy-path: `/` 홈 → SAP-C02 카드 → `/sap-c02/` 랜딩 → 문제 풀이 → practice 진입 (2 클릭, SC-001)
  - [ ] disabled 진입(시험 모드/문제집) 클릭 시 무네비 검증 (SC-003)
  - [ ] 이어 풀기: 한 문제 풀고 랜딩 복귀 시 "이어 풀기"가 그 문제로 재개 (SC-004)
  - [ ] 001 deep 진입(`/sap-c02/practice`) 무회귀 + 기존 e2e 통과 (SC-006)
- **테스트 전략**: docker compose full-stack + Playwright. 기존 001 e2e와 공존.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose up -d minio api web`
  - `docker compose run --rm web pnpm e2e`
  - `docker compose down -v`
- **예상 커밋 메시지 (영문)**: `test(e2e): root→practice happy-path + 001 no-regression (M03)`

### 하위 작업 (Subtasks)

- [ ] **T030** — RED+GREEN: 홈→랜딩→practice happy-path 시나리오 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T031** — disabled 진입 무네비 + 이어 풀기 재개 시나리오 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T032** — 검증: 전체 e2e(001 포함) 통과, `down -v` 정상 (executor: codex, skill: none)

---

## [ ] M04 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: codex가 만든 홈·랜딩을 plan.md §Design System(001 토큰) 기준으로 일관성·디자인·접근성·디렉터리 위생 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(UX 요구사항·US2 placeholder), plan.md §Design Review(001 토큰, 1-카드 홈 슬롭 회피, disabled 카드 이중신호), 이전 M01~M03 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — UI 컴포넌트 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion·타이포그래피
  - `design-review` — 라이브 사이트 시각 감사
  - `vercel-react-best-practices` — React 구조·성능 재점검
- **완료 정의 (DoD)**:
  - [ ] 프론트엔드 디렉터리 점검 (002 신규 파일 orphan/네이밍/위치)
  - [ ] 컴포넌트 일관성 — 001 토큰(Pretendard/zinc/emerald·rose·amber·간격·radius·shadow·focus ring) 홈·랜딩·카드에 적용
  - [ ] 디자인 시스템 polish (anti-slop: 1-카드 홈의 외로운-중앙카드/blob/이모지/3-column 금지, disabled 카드 색+배지 이중신호)
  - [ ] a11y/responsive/motion sweep (focus ring, 44px, 4.5:1/3:1, 모바일 단일 컬럼, aria-disabled, 시맨틱 main/nav)
  - [ ] `design-review` 라이브 렌더 점검(홈·랜딩) 통과
  - [ ] 최종 git commit 생성
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/`·`/sap-c02/`)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 002 home/landing UI/UX consolidation + a11y sweep (M04)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T401** — 프론트엔드 디렉터리 전수 워크(002 신규분): orphan/네이밍/위치 드리프트 (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T402** — 컴포넌트 일관성 감사: 001 토큰·primitive 재사용 (홈·랜딩·CertCard·EntryCard) (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T403** — 디자인 시스템 polish 전 화면 적용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T404** — a11y / responsive / motion sweep (executor: claude, skill: `web-design-guidelines`)
- [ ] **T405** — `design-review`로 라이브 렌더 시각 감사(홈·랜딩) (executor: claude, skill: `design-review`)
- [ ] **T406** — 최종 git commit (executor: claude, skill: none)
