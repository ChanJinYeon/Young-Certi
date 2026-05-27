# Quickstart: Practice & Exam Screen Layout (005)

Reuses the existing local stack — no new services.

## Run

```bash
make dev          # docker compose: minio + api + web
# open: http://localhost:5173/
```

## Acceptance walkthrough

1. **Practice** (`/sap-c02/practice`): 홈으로 at top-left, 제출 at top-right (becomes
   다시 풀기 after submitting), 이전/다음 at bottom-right, 문제집에 추가 at
   bottom-left — around the question. Every control still works.
2. **Exam** (`/sap-c02/exam`, start): the question list is a **left sidebar** like the
   practice side menu, numbered **1…N** (≈75), with answered/active markers and
   click-to-jump. 홈으로 at top-left, 시험 제출 at top-right, 이전/다음 at bottom-right.
3. From an in-progress exam, click **홈으로** → home (`/`); return to the exam → it
   resumes at the same position with the correct remaining time.
4. **Landing** (`/sap-c02/`): the **이어 풀기** button is gone; 문제 풀이 resumes at the
   last viewed question on its own.

## Verify

| Check | Expected |
|---|---|
| Practice corners | 4 controls in their corners, all functional (SC-001) |
| Exam left list | left sidebar, 1…N, jump/status/active like practice (SC-002) |
| Exam corners | 홈으로 TL, 시험 제출 TR, 이전/다음 BR (SC-002) |
| Exam home preserves | 홈으로 → / then back → exam resumes, timer correct (SC-003) |
| Landing resume removed | no 이어 풀기 button; 문제 풀이 still resumes (FR-012) |
| No regression | all prior practice/exam behavior unchanged (SC-004) |
| Mobile | no overlap, no horizontal scroll, ≥44px (SC-005) |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
```
