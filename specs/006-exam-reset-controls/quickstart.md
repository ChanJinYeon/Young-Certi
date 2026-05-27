# Quickstart: Control Re-placement & Exam Home-Reset (006)

Reuses the existing local stack — no new services.

## Run

```bash
make dev          # docker compose: minio + api + web
# open: http://localhost:5173/
```

## Acceptance walkthrough

1. **Practice** (`/sap-c02/practice`): 이전/다음 are now **top-right**, 제출 (or 다시
   풀기 after submitting) is **bottom-right**; 홈으로 top-left, 문제집에 추가
   bottom-left. All controls still work.
2. **Exam** (`/sap-c02/exam`, start): the question heading reads the **exam position
   (1…N)** matching the left-list active item; 이전/다음 top-right, 시험 제출
   bottom-right, 홈으로 top-left.
3. **Exam home-reset**: click 홈으로 → a warning appears ("시험이 초기화됩니다").
   Confirm → land on home; re-enter exam mode → the **start screen** (new exam), not
   a resumed one. Cancel → the exam keeps running.
4. **Reload still resumes**: during an exam, reload the page (don't press 홈으로) →
   the exam resumes with the correct remaining time.

## Verify

| Check | Expected |
|---|---|
| Practice positions | 이전/다음 top-right, 제출 bottom-right (SC-001) |
| Exam positions | 이전/다음 top-right, 시험 제출 bottom-right (SC-001) |
| Exam heading 1…N | heading = position, matches left list (SC-002) |
| Home warning + reset | warning → confirm discards + home; cancel keeps (SC-003) |
| New exam on re-entry | after reset, exam shows start screen (SC-004) |
| Reload resumes | reload mid-exam still resumes (SC-005) |
| No regression | other practice/exam behavior unchanged (SC-006) |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
```
