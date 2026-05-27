# Quickstart: Question Sets Screen (007)

Reuses the existing local stack — no new services.

## Run

```bash
make dev          # docker compose: minio + api + web
# open: http://localhost:5173/
```

## Acceptance walkthrough

1. **Create a set first** (existing 001): on practice, use "문제집에 추가" to put a
   question into a new set (e.g., "오답노트").
2. **Open 문제집** from the certification landing (`/sap-c02/`) — the 문제집 card is
   now active → `/sap-c02/sets`. The set list shows each set with name + "N문항".
   (No sets → empty state pointing to "문제집에 추가".)
3. **Open a set** → solve its questions practice-style (choices, 제출 → 녹/적 +
   해설, 이전/다음 within the set only).
4. **Per-set isolation**: answering in the set does NOT change the same question's
   result on the practice screen (and vice versa).
5. **Manage**: delete a set (confirm) → it leaves the list; remove a question from an
   opened set → the count drops; other sets unchanged.

## Verify

| Check | Expected |
|---|---|
| List | sets show name + count; empty state when none (SC-001/SC-005) |
| Open & solve | set-scoped practice; prev/next stay in the set (SC-002) |
| Per-set results | set answers isolated from practice + other sets (SC-003) |
| Delete / remove | delete removes set; remove drops a question; others intact (SC-004) |
| Missing question | unavailable item, nav not broken (FR-007) |
| No regression | 001–006 unchanged; 002 문제집 entry now active (SC-006) |

## Tests (containerized)

```bash
docker compose run --rm web pnpm test        # incl. sets-list, set-solve (isolation)
docker compose run --rm web pnpm typecheck
docker compose run --rm web pnpm lint
docker compose run --rm web pnpm build
docker compose up -d minio api web && docker compose run --rm web pnpm e2e
```
