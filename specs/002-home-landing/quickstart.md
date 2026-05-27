# Quickstart: Home / Landing Screen (002)

Reuses the 001 local stack — no new services. See
`specs/001-question-practice/quickstart.md` for the base setup.

## Run

```bash
make dev          # docker compose: minio (seeds real questions.json) + api + web
# then open:
#   http://localhost:5173/              → home (certification list)
```

## Acceptance walkthrough (P1 + P2 + P3)

1. Open `http://localhost:5173/` → **home** shows the AWS SAP-C02 certification as
   a card (with its question count).
2. Click the SAP-C02 card → **landing** (`/sap-c02/`) shows:
   - 문제 풀이 (active), 시험 모드 / 문제집 (disabled, "준비 중"),
   - the total question count,
   - "이어 풀기" only if you previously solved something this session.
3. Click 문제 풀이 → existing practice screen (`/sap-c02/practice`), unchanged.
4. Click a 준비 중 card → nothing navigates; it is clearly non-interactive.
5. Solve/navigate a question, return to `/sap-c02/` → "이어 풀기" now resumes at
   your last question.

## Verify

| Check | How | Expected |
|---|---|---|
| Home lists cert | open `/` | SAP-C02 card with count |
| Two clicks to practice | `/` → card → 문제 풀이 | practice screen (SC-001) |
| Reserved entries inert | click 시험 모드 / 문제집 | no navigation, "준비 중" shown (SC-003) |
| Resume | with saved position, open `/sap-c02/` | "이어 풀기" resumes exact question (SC-004) |
| No 001 regression | open `/sap-c02/practice` directly | works as before (SC-006) |
| Graceful no-data | api down, open `/` | screen renders, count omitted |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test        # incl. home.test, exam-landing.test
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
docker compose up -d minio api web && docker compose run --rm web pnpm e2e
```
