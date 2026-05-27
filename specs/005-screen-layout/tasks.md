# 작업 목록 — practice·exam 화면 레이아웃 (005)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001 OpenAPI 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다.
- 구현(프론트엔드 코드·테스트)은 전부 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 한다. **커밋은 large-task당 1개** — Codex가 각 Mxx 검증 통과 후 커밋, 마지막 Claude large-task만 Claude 커밋(push 안 함). — young-certi 정책.
- **005는 프론트엔드 전용 레이아웃 refactor**. 백엔드·계약·데이터·동작 변경 없음(레이아웃·배치만).
- 확정(clarify): 코너 = 문제 위/아래 컨트롤 행(절대 코너 아님), exam 좌측 리스트 = practice SideMenu 패턴(1~N), 랜딩 이어 풀기 제거.
- 재사용: 001 SideMenu 일반화, 001/004 컴포넌트·디자인 토큰. **001~004 동작·URL·테스트 무회귀**(위치/마크업 갱신은 허용).
- 신규 의존성 0. 한국어, 로그인 없음, 세션 전용(헌법 VI).

## 미해결 질문 (Open Questions)

- 없음. 코너 해석·exam 리스트 패턴·랜딩 이어풀기 제거 모두 clarify에서 확정.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01(codex 레이아웃 구현) → M02(claude UI/UX 종합 정리).

**Large-task 내부**: (계약 없음) → 프론트엔드 RED(테스트 갱신) → 프론트엔드 GREEN → 검증.

## Executor 룰

- **기본 executor는 codex.** 프론트엔드 코드·테스트.
- **마지막 large-task(M02)만 claude.** 디자인 일관성·a11y·라이브 점검·UI/UX 커밋.
- **커밋은 large-task당 1개.** M01은 Codex가 검증 통과 후 커밋, M02는 Claude. subtask 단위 커밋 금지, 검증 실패 시 커밋 금지, `git push` 안 함.
- `skill:` 태그는 `/task-run` 시 Skill 도구로 호출. `vercel-react-best-practices`는 Vite SPA라 의도만 차용.
- **모든 로컬 실행은 docker compose 컨테이너 안에서.**

---

## [ ] M01 — 컨트롤 코너 배치 + exam 좌측 리스트 + 랜딩 정리

- **목적 (Purpose)**: practice·exam 컨트롤을 문제 위/아래 행으로 재배치하고, exam 네비를 좌측 SideMenu(1~N)로 바꾸고 홈으로 추가, 랜딩의 이어 풀기를 제거한다. (동작 무변경)
- **명세 참조**: spec.md FR-001~012/US1·US2, plan.md §Eng·§Design Review, research.md D-001~005
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트 일반화·레이아웃 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [ ] `SideMenu` 일반화: 라벨(문제번호/exam 위치 1~N)·상태맵(정오/응답여부)·즐겨찾기 옵셔널 — practice·exam 공용
  - [ ] `PracticePage`: 문제 위 행(좌 홈으로 / 우 제출·다시 풀기), 아래 행(좌 문제집에 추가 / 우 이전·다음). 즐겨찾기는 카드 헤더 유지
  - [ ] `ExamPage`: 좌측 SideMenu(1~N), 위 행(좌 홈으로 / 우 시험 제출), 아래 행(우 이전·다음). top `ExamNavigator` 은퇴. 홈으로는 `/`로(시험 attempt 보존)
  - [ ] `ExamLandingPage`: 이어 풀기 Link 제거
  - [ ] 기존 테스트(practice-page·exam-page·exam-landing) 위치/마크업에 맞춰 갱신, 동작 단언 유지
  - [ ] test/typecheck/lint/build 통과 + 001~004 무회귀
- **테스트 전략**: vitest + RTL. 컨트롤 위치·여전히 동작, exam 좌측 1~N·점프·홈으로 보존, 랜딩 이어풀기 부재. fetch/localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): corner control rows + exam left list (1..N) + landing cleanup (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [ ] **T010** — RED: 테스트 갱신 — practice 컨트롤 위치·동작, exam 좌측 SideMenu(1~N)·점프·홈으로 attempt 보존, 랜딩 이어풀기 제거 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T011** — GREEN: `components/SideMenu.tsx` 일반화(라벨·상태맵·옵셔널 즐겨찾기) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T012** — GREEN: `pages/PracticePage.tsx` 위/아래 컨트롤 행 재배치 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T013** — GREEN: `pages/ExamPage.tsx` 좌측 SideMenu(1~N) + 코너 컨트롤 + 홈으로, `ExamNavigator` 은퇴 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T014** — GREEN: `pages/ExamLandingPage.tsx` 이어 풀기 제거 (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T015** — 검증: test/typecheck/lint/build 통과, 001~004 무회귀 (executor: codex, skill: none)

---

## [ ] M02 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: 재배치된 컨트롤·exam 좌측 리스트를 plan.md §Design(001 토큰) 기준으로 일관성·접근성 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(레이아웃 요구), plan.md §Design Review, M01 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — 레이아웃·컴포넌트 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion(탭 순서·focus·44px·모바일 비파괴)
  - `design-review` — practice·exam 화면 라이브 시각 감사
  - `vercel-react-best-practices` — React 구조 재점검
- **완료 정의 (DoD)**:
  - [ ] 컨트롤 행·exam 좌측 리스트가 001 토큰(버튼·SideMenu·focus ring·44px·간격)과 일관
  - [ ] practice·exam 컨트롤 위계(primary=제출/시험 제출 우상단, 홈으로 ghost 좌상단) 명확
  - [ ] a11y: 탭 순서 합리적(DOM 읽기 순), focus·대비, 모바일 행 스택 비파괴·가로스크롤 없음
  - [ ] `design-review` practice·exam 라이브 점검 통과
  - [ ] 최종 git commit
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/sap-c02/practice`, `/sap-c02/exam`)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 005 practice/exam layout consolidation + a11y (M02)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T201** — 프론트엔드 디렉터리/구조 점검(005 변경분) (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T202** — 일관성 감사: 버튼 행·SideMenu·토큰 정합 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T203** — 디자인 polish(위계·간격·반응형) 적용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T204** — a11y/responsive/motion sweep(탭 순서·focus·모바일 스택) (executor: claude, skill: `web-design-guidelines`)
- [ ] **T205** — `design-review`로 practice·exam 라이브 감사 (executor: claude, skill: `design-review`)
- [ ] **T206** — 최종 git commit (executor: claude, skill: none)
