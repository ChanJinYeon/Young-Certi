# Quickstart: YoungCerti Question Practice MVP

**Feature**: 001-question-practice
**Audience**: an engineer (or AI agent) checking out this branch for
the first time, wanting to see the practice screen work end-to-end
locally.

## Prerequisites

- Docker + Docker Compose v2 (everything runs in containers per
  constitution).
- `make` (or run the docker compose commands directly if you
  prefer).
- A seeded `questions.json` artifact. For local dev we use a
  small fixture (`crawler/testdata/fixture-questions.json`)
  rather than running the real crawler. See "Seeding the pool"
  below.

You do NOT need: a Python venv on the host, a Node install on
the host, AWS credentials, kubectl, or terraform. Local dev is
container-only.

## One-liner

```sh
make dev          # docker compose up: minio + backend + frontend
open http://localhost:5173/sap-c02/practice/1
```

If you don't have `make`:

```sh
docker compose up --build
```

## What `make dev` does

1. Boots **MinIO** as an S3 stand-in (port 9000, console 9001).
2. On first start, copies `crawler/testdata/fixture-questions.json`
   into the MinIO bucket `young-certi-data/sap-c02/questions.json`.
3. Boots the **backend** (FastAPI on port 8000), which loads the
   fixture from MinIO into memory and starts the 5-minute ETag
   refresh loop.
4. Boots the **frontend** (Vite dev server on port 5173) with
   `VITE_API_BASE_URL=http://localhost:8000`.
5. CORS on the backend is configured to allow
   `http://localhost:5173`.

## Verifying it works

| Check | Command | Expected |
|---|---|---|
| Backend ready | `curl http://localhost:8000/api/v1/readyz` | `{"status":"ok","poolVersion":"fixture",...}` |
| Pool loaded | `curl http://localhost:8000/api/v1/exams/sap-c02/questions` | `{"examSlug":"sap-c02","total":<N>,...}` |
| Single question | `curl http://localhost:8000/api/v1/exams/sap-c02/questions/1` | Question payload with `choices` and `answerKey` |
| Error envelope | `curl -i http://localhost:8000/api/v1/exams/sap-c02/questions/99999` | 404 + `{"code":"NOT_FOUND","message":...,"requestId":...}` |
| Frontend | open `http://localhost:5173/sap-c02/practice/1` | Question rendered, side menu visible, prev/next work |

## P1 acceptance walkthrough (manual)

1. Open `http://localhost:5173/sap-c02/practice/1`.
2. Pick one or more choices (the UI is single-select or
   multi-select depending on the question's `answerKey` size).
3. Click 제출. Choices turn green/red per the rules; explanation
   appears.
4. Click 다음. URL updates to `/sap-c02/practice/2`. Side menu
   highlight moves.
5. Hit browser back. URL returns to `/sap-c02/practice/1` and
   your previous result is still visible (per-question result
   persisted in localStorage).
6. Click ★ to favorite question 1. Small amber star appears
   next to "1" in the side menu.
7. Click "문제집에 추가". Modal opens. Type "오답노트" and
   confirm. Toast appears.
8. Refresh the page (F5). Favorite and question set survive.

## Seeding the pool

For local dev the fixture is committed in
`crawler/testdata/fixture-questions.json`. To regenerate from the
real source (one-time, by a developer):

```sh
make crawl      # runs the Go crawler against krdump with rate
                # limits, writes crawler/build/questions.json,
                # uploads to MinIO (dev) or S3 (prod creds in env)
```

The crawler is OFFLINE-TESTABLE: `make test-crawler` exercises
all parser branches against `crawler/testdata/*.html` fixtures
without hitting the network.

## Running the tests

```sh
make test-frontend     # vitest + RTL component tests
make test-backend      # pytest + httpx + schemathesis
make test-crawler      # go test ./...
make test              # all three
```

## Tearing down

```sh
docker compose down -v     # also removes MinIO volumes
```

## Going to the cluster (optional — not part of this MVP's
local-dev quickstart)

Cluster spin-up is intentionally a separate workflow (per
constitution II: ephemeral by default). When you want to demo
on EKS:

```sh
# 1. From .github/workflows/infra.yaml — open a PR, see plan
# 2. From .github/workflows/cluster-up.yaml — workflow_dispatch
#    to apply infra + deploy
# 3. After the demo:
make cluster-down       # runs terraform destroy
```

Budget alerts (constitution III) will email you long before the
cluster costs anything meaningful, but the operator-driven
destroy step is the primary cost control.
