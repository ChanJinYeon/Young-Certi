# 작업 목록 — 문제 풀이 화면: 다시 풀기 & 홈으로 버튼 (003)

> 명세 (Spec): ./spec.md
> 계획 (Plan): ./plan.md
> 계약 (Contracts): 신규 없음 — 001 OpenAPI 재사용
> 생성/갱신: 2026-05-27 · /task-init

## 가정 (Assumptions)

- 로컬 실행/검증은 모두 docker compose 컨테이너 안에서 수행한다.
- 구현(프론트엔드 코드·테스트)은 Codex가 담당하고, 마지막 large-task에서 Claude가 UI/UX 종합 정리를 한다. **커밋은 large-task당 1개** — Codex가 각 Mxx 검증 통과 후 커밋, 마지막 Claude large-task만 Claude 커밋(push 안 함). — young-certi 정책.
- **003은 프론트엔드 전용 additive feature**. 백엔드·계약·의존성 변경 없음.
- 재사용: 001/002 스택·디자인 토큰·localStorage 훅. **001/002 동작·URL·테스트 무변경**.
- 확정(clarify): "다시 풀기"=현재 문제만 리셋(저장된 결과 삭제), "홈으로"=루트 `/`.

## 미해결 질문 (Open Questions)

- 없음. clarify에서 reset 범위·홈 대상 모두 확정.

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

## [x] M01 — 다시 풀기 + 홈으로 버튼 구현

- **목적 (Purpose)**: practice 화면에 "다시 풀기"(현재 문제 리셋)와 "홈으로"(`/` 이동) 버튼을 추가하고, `usePerQuestionResult`에 `clearResult`를 더한다.
- **명세 참조**: spec.md FR-001~008/US1·US2, plan.md §Eng Review, research.md D-001~005, data-model.md(PerQuestionResult delete)
- **주 Executor**: codex
- **Skill routing**:
  - `vercel-react-best-practices` — React 상태/훅/컴포넌트 (Vite SPA, 의도만)
- **완료 정의 (DoD)**:
  - [x] `usePerQuestionResult`에 `clearResult(examSlug, number)` 추가 (해당 키 삭제)
  - [x] "다시 풀기": 제출 후에만 노출, 클릭 시 현재 문제 결과 삭제 + `selected/submitted` 리셋 → 사이드 dot 미응시로 복귀
  - [x] "홈으로": `/`로 네비, localStorage(즐겨찾기·문제집·다른 결과·현재 위치) 보존
  - [x] 현재 문제에만 영향(다른 문제·즐겨찾기·문제집 불변)
  - [x] practice-page 테스트 확장(리셋·재제출·무영향·홈 네비) 통과
  - [x] test/typecheck/lint/build 통과 + 001/002 무회귀
- **테스트 전략**: vitest + RTL. 제출→다시 풀기→상태 초기화·결과 삭제·재제출, 홈 네비, 격리. fetch/localStorage stub.
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm test`
  - `docker compose run --rm web pnpm typecheck`
  - `docker compose run --rm web pnpm lint`
  - `docker compose run --rm web pnpm build`
- **예상 커밋 메시지 (영문)**: `feat(web): practice screen 다시 풀기 (retry) + 홈으로 (home) buttons (M01)`

### 하위 작업 (Subtasks, 구현 순서대로)

- [x] **T010** — RED: practice-page 테스트 확장 — 제출 후 다시 풀기 → 선택·피드백 클리어 + 저장 결과 삭제 + 재제출, 다른 문제 무영향, 홈으로→`/` 네비 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T011** — GREEN: `hooks/usePerQuestionResult.ts`에 `clearResult(examSlug, number)` 추가 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T012** — GREEN: `pages/PracticePage.tsx` — "다시 풀기"(제출 후 노출, clearResult+상태 리셋) + "홈으로"(`/` Link) 버튼, 기존 버튼 행에 배치 (executor: codex, skill: `vercel-react-best-practices`)
- [x] **T013** — 검증: test/typecheck/lint/build 통과, 001/002 무회귀 (executor: codex, skill: none)

---

## [ ] M02 — UI/UX 종합 정리 (Claude)

- **목적 (Purpose)**: 추가된 두 버튼을 001 디자인 시스템에 맞춰 일관성·접근성 관점에서 정리하고 커밋한다.
- **명세 참조**: spec.md(UX), plan.md §Design(001 버튼 토큰 재사용), M01 결과
- **주 Executor**: claude
- **Skill routing** (고정):
  - `frontend-design:frontend-design` — 버튼 디자인 정합성
  - `web-design-guidelines` — 접근성·반응형·motion
  - `design-review` — practice 화면 라이브 시각 감사
  - `vercel-react-best-practices` — React 구조 재점검
- **완료 정의 (DoD)**:
  - [ ] 두 버튼이 001 버튼 토큰(ghost/secondary·focus ring·44px·간격)과 일관
  - [ ] "다시 풀기"가 시각적으로 적절한 위계(파괴적 아님, 2차/secondary), "홈으로" 명확
  - [ ] a11y: 키보드·focus·대비·라벨, 제출 전 다시 풀기 미노출 확인
  - [ ] `design-review` practice 화면 라이브 점검 통과
  - [ ] 최종 git commit
- **검증 명령 (컨테이너 기반)**:
  - `docker compose run --rm web pnpm build`
  - `docker compose up -d minio api web && design-review` 라이브 점검(`/sap-c02/practice`)
- **예상 커밋 메시지 (영문)**:
  - `style(web): 003 retry/home button UI/UX polish + a11y (M02)`

### 하위 작업 (Subtasks, 고정 순서)

- [ ] **T201** — 디렉터리/구조 점검(003 신규분: PracticePage 편집·훅 메서드) (executor: claude, skill: `vercel-react-best-practices`)
- [ ] **T202** — 버튼 일관성 감사: 001 토큰·기존 버튼 행과 정합 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T203** — 디자인 polish(위계·간격) 적용 (executor: claude, skill: `frontend-design:frontend-design`)
- [ ] **T204** — a11y/responsive/motion sweep (executor: claude, skill: `web-design-guidelines`)
- [ ] **T205** — `design-review`로 practice 화면 라이브 감사 (executor: claude, skill: `design-review`)
- [ ] **T206** — 최종 git commit (executor: claude, skill: none)
