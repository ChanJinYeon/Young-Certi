# 작업 목록 — 시험 모드 (타이머 모의시험) (004)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001 OpenAPI 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다.
- 구현(프론트엔드 코드·테스트)은 전부 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 한다. **커밋은 large-task당 1개** — Codex가 각 Mxx 검증 통과 후 커밋, 마지막 Claude large-task만 Claude 커밋(push 안 함). — young-certi 정책.
- **004는 프론트엔드 전용 additive feature**. 백엔드·계약·의존성 변경 없음. 기존 001 read-only API(`/exams/{slug}/questions`, `/exams/{slug}/questions/{n}`)만 소비(문항·정답·해설).
- 재사용: 001/002 스택·디자인 토큰·localStorage 훅·ChoiceList(피드백 suppress)·002 모달 패턴. **001/002/003 동작·URL·테스트 무변경**(002 시험 모드 카드 활성화만 예외).
- 확정(clarify): 타이머=180분 + 선택적 30분(ESL), 문제 선택=랜덤 75(시도마다 재추출), 합격=정답률 ≥75%(정보용).
- 신규 의존성 0(타이머는 `setInterval` + 저장된 `startedAt` wall-clock). 한국어 UI, 로그인 없음, 세션 전용(헌법 VI).

## 미해결 질문 (Open Questions)

- 없음. 타이머·선택·합격선은 clarify에서 확정.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01 → M03까지 전부 Codex, 마지막 M04는 Claude UI/UX 종합 정리.

흐름: 1. M01 ExamAttempt 상태/훅/라우트 → 2. M02 응시 UI(타이머·네비·무피드백·제출/자동제출) → 3. M03 결과/리뷰 + E2E → 4. M04 Claude UI/UX polish.

**Large-task 내부 subtask 순서** (Codex): (계약=001 재사용, DB 없음) → 프론트엔드 RED → 프론트엔드 GREEN → 검증.

## Executor 룰

- **기본 executor는 codex.** 프론트엔드 코드·테스트 전부.
- **마지막 large-task(M04)만 claude.** 디렉터리 점검·디자인 일관성·a11y·라이브 점검·UI/UX 커밋.
- **커밋은 large-task당 1개.** 각 Mxx의 codex subtask 전부 끝 + 검증 통과 후 Codex가 "예상 커밋 메시지"로 커밋. M04는 Claude. subtask 단위 커밋 금지, 검증 실패 시 커밋 금지, `git push` 안 함.
- `skill:` 태그는 `/task-run` 시 Skill 도구로 호출. `vercel-react-best-practices`는 Vite SPA라 의도만 차용(SSR/RSC 무시).
- **모든 로컬 실행은 docker compose 컨테이너 안에서.**

---

## [x] M01 — ExamAttempt 상태 + useExamAttempt 훅 + 라우트

- **목적 (Purpose)**: 시험 attempt를 관리하는 localStorage 상태와 `useExamAttempt` 훅(시작/응답/제출/재개/채점·타이머 도출)을 만들고 `/:examSlug/exam` 라우트를 추가한다. (UI는 M02)
- **명세 참조**: spec.md FR-002/004/005/008/009, plan.md §Eng Review, research.md D-002~005, data-model.md(ExamAttempt)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 훅·상태·persistence (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [x] `hooks/useExamAttempt.ts` — ExamAttempt localStorage(`.../exam/<examSlug>`): start(랜덤 75 추출·startedAt·duration), answer, submit(채점·score), resume, status
  - [x] 타이머 도출: `startedAt + durationMinutes`에서 remaining 계산(wall-clock), 0 이하면 만료 판정
  - [x] 채점: 001 `score`로 정답률 계산, `pass = percent >= 75`
  - [x] practice `results`/`favorites`/`sets`와 격리(별도 키)
  - [x] `App.tsx`에 `/:examSlug/exam` 라우트 추가(화면은 M02 최소 스텁)
  - [x] 훅 단위 테스트(선택 75/부족 시 전체, remaining 계산, 만료, 채점·합격선, resume, 격리) 통과
  - [x] test/typecheck/lint/build 통과 + 001/002/003 무회귀
- **테스트 전략**: vitest. fake timers + 과거 `startedAt`으로 만료/remaining, fetch/localStorage stub로 선택·채점·resume·격리.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): exam attempt state + useExamAttempt hook + /exam route (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T010** — RED: `useExamAttempt` 테스트 — start(랜덤 75/부족), answer, submit 채점(정답률·pass≥75%), remaining(wall-clock)·만료, resume, 격리 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T011** — GREEN: `hooks/useExamAttempt.ts` + ExamAttempt 타입/스토리지 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T012** — GREEN: `App.tsx` `/:examSlug/exam` 라우트 + `pages/ExamPage.tsx` 최소 스텁(상태 표시) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T013** — 검증: test/typecheck/lint/build 통과, 001/002/003 무회귀 (executor: codex, skill: none)

---

## [x] M02 — 응시 UI: 타이머·네비게이터·무피드백·제출/자동제출

- **목적 (Purpose)**: `/:examSlug/exam` 응시 화면 — 카운트다운 타이머, 문제 네비게이터, 피드백 없는 풀이, 수동 제출(확인 모달) + 시간 만료 자동 제출. 002 시험 모드 카드 활성화.
- **명세 참조**: spec.md FR-001/003/004/005/006/011/US1·US2, plan.md §Eng·§Design Review, research.md D-001/D-006
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트·타이머·상태 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [x] `pages/ExamPage.tsx` 상태 구동(미시작=시작/+30 토글 → 진행 → 제출됨)
  - [x] `components/ExamTimer.tsx` — wall-clock 카운트다운, 잔여 적으면 amber→rose, `aria-live=polite`(매초 announce 금지)
  - [x] `components/ExamNavigator.tsx` — 문항 그리드(응답/미응답·현재 표시), 점프, prev/next
  - [x] ChoiceList 재사용하되 **시험 중 피드백 없음**(`submitted=false`), 선택만 ExamAttempt에 기록
  - [x] 수동 제출 = 확인 모달(002 picker 패턴, focus trap), 자동 제출 = 만료 시 즉시(확인 생략)
  - [x] 002 `ExamLandingPage`의 시험 모드 EntryCard 활성화 → `/:examSlug/exam` 링크
  - [x] 응시 UI 컴포넌트/통합 테스트 통과(무피드백·네비·제출 확인·자동제출·resume)
  - [x] test/typecheck/lint/build 통과
- **테스트 전략**: vitest + RTL, fake timers로 자동제출, fetch/localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): exam-taking UI — timer, navigator, no-feedback, submit/auto-submit (M02)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T020** — RED: ExamTimer/ExamNavigator/ExamPage 테스트(무피드백, 네비·점프, 수동 제출 확인 모달, 만료 자동제출, resume) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T021** — GREEN: `components/ExamTimer.tsx` (wall-clock·임계 색·aria-live) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T022** — GREEN: `components/ExamNavigator.tsx` (문항 그리드·점프) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T023** — GREEN: `pages/ExamPage.tsx` 진행 화면(타이머+네비+ChoiceList 무피드백+제출 확인 모달+자동제출) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T024** — GREEN: `pages/ExamLandingPage.tsx` 시험 모드 카드 활성화(→ `/:examSlug/exam`) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T025** — 검증: test/typecheck/lint/build 통과 (executor: codex, skill: none)

---

## [x] M03 — 결과/리뷰 + 로컬 E2E

- **목적 (Purpose)**: 제출 후 결과 화면(점수·합격 배지·문항별 리뷰)과, 전체 스택 E2E(시작→응답→제출→결과, 자동제출/resume)를 만든다.
- **명세 참조**: spec.md FR-007/US3/SC-001~006, plan.md §Design Review, quickstart.md
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 결과 컴포넌트·E2E
- **완료 정의 (DoD)**:
  - [x] `components/ExamResult.tsx` — 총점(정답/total·%)·합격(≥75%) 배지(emerald/zinc)·문항별 리뷰(내 답 vs 정답 + 해설)
  - [x] ExamPage `submitted` 상태에서 결과 렌더
  - [x] Playwright: 시작→몇 문항 응답→제출→결과 happy-path
  - [x] 자동제출(fake/주입)·resume·practice 격리 시나리오
  - [x] test/typecheck/lint/build + e2e 통과
- **테스트 전략**: vitest 결과 컴포넌트 + Playwright full-stack.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose up -d minio api web && docker compose run --rm web pnpm e2e`
  - `docker compose down -v`
- **예상 커밋 메시지 (영문)**: `feat(web): exam result + per-question review + e2e (M03)`

### 하위 작업 (Subtasks)

- [x] **T030** — RED: ExamResult 테스트(점수·합격선·문항별 리뷰 렌더) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T031** — GREEN: `components/ExamResult.tsx` + ExamPage 결과 연결 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T032** — RED+GREEN: Playwright happy-path(시작→응답→제출→결과) + 자동제출/resume (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T033** — 검증: 전체 test/e2e 통과, practice 격리 확인, `down -v` 정상 (executor: codex, skill: none)

---

## [x] M04 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: codex가 만든 응시·결과 화면을 plan.md §Design(001 토큰) 기준으로 일관성·접근성·디렉터리 위생 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(UX), plan.md §Design Review(타이머 상태·합격 배지·집중 레이아웃·anti-slop), 이전 M01~M03 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — UI 컴포넌트 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion·타이포그래피
  - `design-review` — 라이브 시각 감사(응시·결과)
  - `vercel-react-best-practices` — React 구조·성능 재점검
- **완료 정의 (DoD)**:
  - [ ] 프론트엔드 디렉터리 점검(004 신규: ExamPage·ExamTimer·ExamNavigator·ExamResult·useExamAttempt)
  - [ ] 컴포넌트 일관성 — 001 토큰(Pretendard/zinc/emerald·rose·amber·간격·radius·shadow·focus ring) 적용
  - [ ] 디자인 polish: 타이머 위계(mono·임계 amber/rose)·합격 배지·집중 응시 레이아웃, anti-slop(게이지 기믹·blob·3-column 금지)
  - [ ] a11y/responsive/motion: 타이머 aria-live polite(매초 금지), 네비 라벨, 모달 focus-trap, 색 외 신호(응답/합격 텍스트·아이콘), 44px, 모바일 단일 컬럼
  - [ ] `design-review` 라이브 점검(응시 화면·결과 화면) 통과
  - [ ] 최종 git commit
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/sap-c02/exam`)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 004 exam mode UI/UX consolidation + a11y (M04)`

### 하위 작업 (Subtasks, 고정 순서)

- [x] **T401** — 프론트엔드 디렉터리 전수 워크(004 신규분): orphan/네이밍/위치 (executor: claude, skill: `vercel-react-best-practices`)
- [x] **T402** — 컴포넌트 일관성 감사: 001 토큰·primitive 재사용 (executor: claude, skill: `frontend-design:frontend-design`)
- [x] **T403** — 디자인 시스템 polish 전 화면 적용(타이머·배지·응시 레이아웃) (executor: claude, skill: `frontend-design:frontend-design`)
- [x] **T404** — a11y / responsive / motion sweep (타이머 aria-live·모달·색 외 신호) (executor: claude, skill: `web-design-guidelines`)
- [x] **T405** — `design-review`로 응시·결과 화면 라이브 감사 (executor: claude, skill: `design-review`)
- [x] **T406** — 최종 git commit (executor: claude, skill: none)
