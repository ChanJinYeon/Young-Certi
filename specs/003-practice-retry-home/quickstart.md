# Quickstart: Practice Retry & Home Buttons (003)

Reuses the 001/002 local stack — no new services.

## Run

```bash
make dev          # docker compose: minio (real questions.json) + api + web
# open: http://localhost:5173/  → cert → 문제 풀이
```

## Acceptance walkthrough

1. Open practice, select a choice, click **제출** → see green/red feedback.
2. Click **다시 풀기** → selection and feedback clear; the question is fresh.
3. Navigate to another question and back (or reload) → the reset question is still
   fresh (saved result was cleared); its side-menu dot is gray (unattempted).
4. Confirm another previously-answered question still shows its result (isolation).
5. Click **홈으로** → the home (`/`) loads; favorites / question sets / saved
   position are intact. Return to practice → resumes at the same question.

## Verify

| Check | Expected |
|---|---|
| Retry clears UI | no selection, no feedback after 다시 풀기 (SC-001) |
| Retry persists | reset question stays unattempted after reload (SC-002) |
| Retry isolated | other questions/favorites/sets unchanged (SC-003) |
| Home nav | 홈으로 → `/` in one click, state intact (SC-004) |
| No regression | existing 제출/이전/다음/즐겨찾기/문제집 unchanged (SC-006) |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test        # incl. extended practice-page cases
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
```
