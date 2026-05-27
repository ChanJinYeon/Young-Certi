# Quickstart: Exam Mode (004)

Reuses the 001/002 local stack — no new services.

## Run

```bash
make dev          # docker compose: minio (real questions.json) + api + web
# open: http://localhost:5173/  → cert → 시험 모드
```

## Acceptance walkthrough

1. From the certification landing (`/sap-c02/`), the **시험 모드** card is now active.
   Activate it → exam starts (`/sap-c02/exam`) with 75 questions and a countdown
   (180 min; toggle +30 min ESL at start if offered).
2. Navigate freely (next / prev / jump via the navigator), select answers → **no**
   correct/incorrect feedback appears.
3. Reload mid-exam → the same questions + your answers persist; the timer shows the
   correct remaining time.
4. Click **제출** → confirm → result screen: score (correct/total, percent),
   **합격/불합격** badge (pass ≥ 75%), and a per-question review (your answer vs
   correct + explanation).
5. (Timeout) With little time left, wait for the countdown to hit 0 → the exam
   auto-submits and shows the result.

## Verify

| Check | Expected |
|---|---|
| Start & selection | 75 questions (or all if fewer), random per attempt (FR-002) |
| No in-exam feedback | no correct/incorrect coloring during the exam (FR-003, SC-001) |
| Wall-clock timer | remaining time correct after reload; auto-submit at 0 (FR-004/005, SC-002) |
| Resume | in-progress exam survives reload with answers (US2, SC-006) |
| Result | score + 합격(≥75%) + per-question review (FR-007, SC-003) |
| Isolation | practice results/favorites/sets unchanged by an exam (FR-009, SC-004) |
| No regression | 001/002/003 unchanged; 002 시험 모드 entry now active |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test        # incl. exam.test (selection, timer/auto-submit, resume, scoring, isolation)
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
docker compose up -d minio api web && docker compose run --rm web pnpm e2e
```
