# 작업 목록 — 컨트롤 재배치 & 시험 홈-초기화 (006)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001 OpenAPI 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다.
- 구현(프론트엔드 코드·테스트)은 전부 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 한다. **커밋은 large-task당 1개** — Codex가 각 Mxx 검증 통과 후 커밋, 마지막 Claude large-task만 Claude 커밋(push 안 함). — young-certi 정책.
- **006은 프론트엔드 전용**. 백엔드·계약·데이터 형태 변경 없음(레이아웃 + ExamAttempt 삭제 동작 1개).
- 확정(clarify, 선반영): 배치 swap(이전·다음 우상단 / 제출·시험 제출 우하단), exam 홈으로=경고 후 초기화(버튼만, 새로고침은 resume 유지), exam 헤더=위치 1~N.
- 재사용: 001/004/005 컴포넌트·디자인 토큰·기존 confirm 모달 패턴. **001~005 동작은 명시 변경 외 무회귀**.
- 신규 의존성 0. 한국어, 로그인 없음, 세션 전용(헌법 VI).

## 미해결 질문 (Open Questions)

- 없음. 배치 swap·홈-초기화 범위는 선확정.

## 구현 순서 (Order Policy)

**Large-task 순서**: M01(codex 구현) → M02(claude UI/UX 종합 정리).

**Large-task 내부**: (계약 없음) → 프론트엔드 RED → 프론트엔드 GREEN → 검증.

## Executor 룰

- **기본 executor는 codex.** 프론트엔드 코드·테스트.
- **마지막 large-task(M02)만 claude.** 디자인 일관성·a11y·라이브 점검·UI/UX 커밋.
- **커밋은 large-task당 1개.** M01은 Codex가 검증 통과 후 커밋, M02는 Claude. subtask 단위 커밋 금지, 검증 실패 시 커밋 금지, `git push` 안 함.
- `skill:` 태그는 `/task-run` 시 Skill 도구로 호출. `vercel-react-best-practices`는 Vite SPA라 의도만 차용.
- **모든 로컬 실행은 docker compose 컨테이너 안에서.**

---

## [ ] M01 — 컨트롤 swap + 시험 위치 헤더 + 시험 홈-초기화

- **목적 (Purpose)**: practice·exam 컨트롤을 swap(이전·다음 우상단 / 제출 우하단)하고, exam 헤더를 위치 1~N으로, exam 홈으로를 경고+초기화로 바꾼다(`useExamAttempt.reset()` 추가). 새로고침 resume은 유지.
- **명세 참조**: spec.md FR-001~009/US1·US2·US3, plan.md §Eng·§Design Review, research.md D-001~004, data-model.md(reset)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — 컴포넌트·상태·레이아웃 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [ ] `PracticePage`: 상단 행(좌 홈으로 / 우 이전·다음), 하단 행(좌 문제집에 추가 / 우 제출·다시 풀기)
  - [ ] `ExamPage`: 상단 행(좌 홈으로 / 우 이전·다음), 하단 행(우 시험 제출)
  - [ ] `ExamPage` 헤더 문제 번호 = 시험 위치 `currentIndex + 1` (1~N), 좌측 리스트와 일치
  - [ ] `useExamAttempt.reset()` 추가(ExamAttempt 키 삭제)
  - [ ] exam 홈으로 = 경고 모달(기존 confirm 패턴 재사용) → 확인 시 reset+`/` 이동, 취소 시 유지. 재진입 시 새 시험 시작 화면
  - [ ] 새로고침은 여전히 resume(버튼만 초기화) — 004 무회귀
  - [ ] practice 홈으로는 기존대로 단순 이동(초기화 아님)
  - [ ] 기존 테스트(practice-page·exam-page) 위치/동작/홈-초기화에 맞춰 갱신
  - [ ] test/typecheck/lint/build 통과 + 001~005 무회귀
- **테스트 전략**: vitest + RTL. 위치·동작, exam 헤더 1~N, 홈 경고→확인 폐기+이동+재진입 새시작·취소 유지, 새로고침 resume. fetch/localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): swap prev-next/submit placement + exam position heading + exam home-reset (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [ ] **T010** — RED: 테스트 갱신 — practice/exam 위치(이전·다음 우상단/제출 우하단), exam 헤더 1~N, 홈 경고→확인 폐기+이동+재진입 새시작·취소 유지, 새로고침 resume (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T011** — GREEN: `hooks/useExamAttempt.ts`에 `reset()` 추가(키 삭제) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T012** — GREEN: `pages/PracticePage.tsx` 상/하단 행 swap (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T013** — GREEN: `pages/ExamPage.tsx` 행 swap + 헤더 위치 1~N + 홈으로 경고 모달(reset+이동) (executor: codex, skill: `vercel-react-best-practices`)
- [ ] **T014** — 검증: test/typecheck/lint/build 통과, 001~005 무회귀 (executor: codex, skill: none)

---

## [ ] M02 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: 재배치된 컨트롤·exam 위치 헤더·홈 경고 모달을 plan.md §Design(001 토큰) 기준으로 일관성·접근성 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(레이아웃·경고), plan.md §Design Review, M01 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — 레이아웃·모달 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion(탭 순서·focus·모달 trap·44px)
  - `design-review` — practice·exam 라이브 시각 감사
  - `vercel-react-best-practices` — React 구조 재점검
- **완료 정의 (DoD)**:
  - [ ] 컨트롤 행·홈 경고 모달이 001 토큰(버튼·모달·focus ring·44px·간격)과 일관
  - [ ] 위계: 제출/시험 제출(primary 우하단), 이전·다음(ghost 우상단), 홈으로(ghost 좌상단); 경고 확인은 destructive primary
  - [ ] a11y: 탭 순서 합리적, 모달 focus-trap+Esc, 색 외 신호, 모바일 행 스택 비파괴
  - [ ] `design-review` practice·exam(+홈 경고) 라이브 점검 통과
  - [ ] 최종 git commit
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/sap-c02/practice`, `/sap-c02/exam`)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 006 control placement + exam home-reset UI/UX + a11y (M02)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T201** — 프론트엔드 디렉터리/구조 점검(006 변경분) (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T202** — 일관성 감사: 버튼 행·홈 경고 모달·토큰 정합 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T203** — 디자인 polish(위계·간격·경고 카피) 적용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T204** — a11y/responsive/motion sweep(탭 순서·모달 trap·모바일) (executor: claude, skill: `web-design-guidelines`)
- [ ] **T205** — `design-review`로 practice·exam·홈 경고 라이브 감사 (executor: claude, skill: `design-review`)
- [ ] **T206** — 최종 git commit (executor: claude, skill: none)
