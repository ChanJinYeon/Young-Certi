# 작업 목록 — 문제집 화면 (007)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001 OpenAPI 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다.
- 구현(프론트엔드 코드·테스트)은 전부 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 한다. **커밋은 large-task당 1개** — Codex가 각 Mxx 검증 통과 후 커밋, 마지막 Claude large-task만 Claude 커밋(push 안 함). — young-certi 정책.
- **007은 프론트엔드 전용 additive feature**. 백엔드·계약 변경 없음(신규 SetResult localStorage 저장소 1개·useQuestionSets 연산 추가).
- 확정(clarify): 세트 열기=practice 스코프드 풀이, 결과=**세트별 별도(SetResult, practice와 격리)**, 관리=삭제+문항 제거(rename 보류).
- 재사용: 001 ChoiceList/ResultFeedback/SideMenu·질문 API·디자인 토큰, 005/006 컨트롤 배치. **001~006 동작 무회귀**(002 문제집 카드 활성화만 예외).
- 신규 의존성 0. 한국어, 로그인 없음, 세션 전용(헌법 VI).

## 미해결 질문 (Open Questions)

- 없음. 풀이 모델·결과 격리·관리 범위는 clarify에서 확정.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01·M02 Codex, 마지막 M03 Claude UI/UX 종합 정리.

흐름: 1. M01 세트 목록+관리+라우팅 → 2. M02 세트 풀이+SetResult+E2E → 3. M03 Claude UI/UX.

**Large-task 내부**: (계약 없음) → 프론트엔드 RED → 프론트엔드 GREEN → 검증.

## Executor 룰

- **기본 executor는 codex.** 프론트엔드 코드·테스트.
- **마지막 large-task(M03)만 claude.** 디자인 일관성·a11y·라이브 점검·UI/UX 커밋.
- **커밋은 large-task당 1개.** M01·M02는 Codex가 검증 통과 후 각각 커밋, M03는 Claude. subtask 단위 커밋 금지, 검증 실패 시 커밋 금지, `git push` 안 함.
- `skill:` 태그는 `/task-run` 시 Skill 도구로 호출. `vercel-react-best-practices`는 Vite SPA라 의도만 차용.
- **모든 로컬 실행은 docker compose 컨테이너 안에서.**

---

## [x] M01 — 세트 목록 + 관리 + 라우팅 + 002 카드 활성화

- **목적 (Purpose)**: `/:examSlug/sets` 세트 목록 화면(이름·문항 수·빈 상태·삭제)과 `useQuestionSets` 삭제/문항제거 연산을 만들고, 라우팅 + 002 문제집 카드를 활성화한다.
- **명세 참조**: spec.md FR-001/002/006/US1·US3, plan.md §Eng·§Design Review, research.md D-001/D-004
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트·상태 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [x] `App.tsx`에 `/:examSlug/sets`·`/:examSlug/sets/:setId` 라우트(후자는 M02 스텁)
  - [x] `pages/SetsListPage.tsx` — 세트 목록(이름 + N문항), 열기 링크, 빈 상태("문제집에 추가" 안내)
  - [x] `useQuestionSets`에 `deleteSet(id)`(세트+SetResult 정리)·`removeQuestion(setId, ref)` 추가
  - [x] 세트 삭제 = 확인 모달(기존 패턴, destructive rose), 다른 세트 무영향
  - [x] `pages/ExamLandingPage.tsx` 문제집 EntryCard 활성화 → `/:examSlug/sets`
  - [x] sets-list 테스트(목록·빈 상태·열기·삭제) 통과
  - [x] test/typecheck/lint/build 통과 + 001~006 무회귀
- **테스트 전략**: vitest + RTL. 목록 렌더·빈 상태·열기 네비·삭제 확인·격리. localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): question sets list + manage (delete/remove) + activate 002 entry (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T010** — RED: SetsListPage + useQuestionSets delete/remove 테스트(목록·빈 상태·열기·삭제 확인·격리) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T011** — GREEN: `useQuestionSets`에 `deleteSet`/`removeQuestion` (+삭제 시 SetResult 정리 훅 포인트) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T012** — GREEN: `App.tsx` 라우트 + `pages/SetsListPage.tsx`(목록·빈 상태·삭제 모달) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T013** — GREEN: `ExamLandingPage` 문제집 카드 활성화(→ `/:examSlug/sets`) (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T014** — 검증: test/typecheck/lint/build 통과, 001~006 무회귀 (executor: codex, skill: none)

---

## [ ] M02 — 세트 풀이 + SetResult(per-set 격리) + E2E

- **목적 (Purpose)**: `/:examSlug/sets/:setId` 세트 스코프드 풀이 화면과, practice와 격리된 per-set 결과(SetResult), 문항 제거, 그리고 E2E를 만든다.
- **명세 참조**: spec.md FR-003/004/005/007/US2/SC-002·003, plan.md §Eng·§Design Review, research.md D-002/D-003/D-005, data-model.md(SetResult)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트·상태·E2E
- **완료 정의 (DoD)**:
  - [ ] `hooks/useSetResults.ts` — per-set 결과(`{setId}` 키, `{number: result}`), save/get/clear; 001 `score` 재사용
  - [ ] `pages/SetSolvePage.tsx` — 세트 문항 1개씩(ChoiceList·ResultFeedback), 이전/다음 세트 범위 내, 좌측 SideMenu(세트 항목), 005/006 컨트롤 배치
  - [ ] 세트 풀이 결과는 SetResult에만 기록 — practice·다른 세트 무영향(격리)
  - [ ] 현재 문항 "세트에서 제거" 동작(`removeQuestion`)
  - [ ] 풀에 없는 문항 = unavailable 표시·스킵, 네비 비파괴
  - [ ] Playwright: 랜딩 문제집 → 세트 열기 → 풀이 → 피드백
  - [ ] test/typecheck/lint/build + e2e 통과
- **테스트 전략**: vitest + RTL(격리·스코프드 네비·제거·missing) + Playwright full-stack.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose up -d minio api web && docker compose run --rm web pnpm e2e`
  - `docker compose down -v`
- **예상 커밋 메시지 (영문)**: `feat(web): set-scoped solve + per-set results (SetResult) + e2e (M02)`

### 하위 작업 (Subtasks)

- [ ] **T020** — RED: useSetResults·SetSolvePage 테스트(스코프드 네비, 피드백, **per-set 격리**, 제거, missing 문항) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T021** — GREEN: `hooks/useSetResults.ts` (per-set 결과 저장소) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T022** — GREEN: `pages/SetSolvePage.tsx` (스코프드 풀이 + SideMenu + 제거 + missing 처리) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T023** — RED+GREEN: Playwright 랜딩→세트 열기→풀이 happy-path (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T024** — 검증: 전체 test/e2e 통과, 격리 확인, `down -v` 정상 (executor: codex, skill: none)

---

## [ ] M03 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: codex가 만든 세트 목록·세트 풀이 화면을 plan.md §Design(001 토큰) 기준으로 일관성·접근성·디렉터리 위생 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(UX), plan.md §Design Review, M01~M02 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — UI 컴포넌트 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion·타이포그래피
  - `design-review` — 세트 목록·세트 풀이 라이브 시각 감사
  - `vercel-react-best-practices` — React 구조·성능 재점검
- **완료 정의 (DoD)**:
  - [ ] 프론트엔드 디렉터리 점검(007 신규: SetsListPage·SetSolvePage·useSetResults)
  - [ ] 컴포넌트 일관성 — 001 토큰(카드·버튼·SideMenu·focus ring·44px·간격) 적용
  - [ ] 디자인 polish: 세트 카드·빈 상태·삭제(rose)·세트 풀이 레이아웃(005/006 배치), anti-slop
  - [ ] a11y/responsive/motion: 모달 trap·Esc, 색 외 신호, 모바일 스택, 44px
  - [ ] `design-review` 세트 목록·세트 풀이 라이브 점검 통과
  - [ ] 최종 git commit
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/sap-c02/sets`, 세트 풀이)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 007 question sets UI/UX consolidation + a11y (M03)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T301** — 프론트엔드 디렉터리 전수 워크(007 신규분) (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T302** — 컴포넌트 일관성 감사: 001 토큰·primitive 재사용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T303** — 디자인 시스템 polish 전 화면 적용(세트 카드·빈 상태·풀이) (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T304** — a11y / responsive / motion sweep (executor: claude, skill: `web-design-guidelines`)
- [ ] **T305** — `design-review`로 세트 목록·세트 풀이 라이브 감사 (executor: claude, skill: `design-review`)
- [ ] **T306** — 최종 git commit (executor: claude, skill: none)
