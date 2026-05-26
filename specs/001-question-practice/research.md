# Research: YoungCerti Question Practice MVP

**Feature**: 001-question-practice
**Date**: 2026-05-25

This document consolidates every architectural / product / design decision
made during /speckit-specify → /speckit-clarify → /speckit-plan
(eng-review + design-review). Each decision lists what was chosen, why,
and what was rejected.

## Decision Log

### D-001 — Question pool source (build vs scrape vs LLM-generate)

**Decision**: Scrape krdump SAP-C02 with a Go crawler; raw JSON in
private S3.

**Rationale**: Constitution VII permits ethical scraping (robots.txt,
rate limit, single machine, truthful UA). The portfolio artifact is
the crawler engineering — rate-limit handling, idempotency,
resumability — not the data. Public datasets are too thin; LLM
generation has quality-control overhead.

**Alternatives**: AWS Skill Builder public sample (insufficient volume);
LLM self-generation (quality bar + curation work).

---

### D-002 — Runtime persistence

**Decision**: No runtime database. Backend loads `questions.json`
from S3 into memory at container start; user state lives 100% in
browser `localStorage`.

**Rationale**: Constitution III forbids managed RDBMS, demands cost
minimum. Spec mandates no login. The set of writes from the app is
trivially expressible client-side; making the server stateless lets
EKS pods scale horizontally with zero coordination.

**Alternatives**: PostgreSQL in pod with EBS PVC (extra cost +
operational complexity for zero gain); DynamoDB on-demand (extra
cost for trivial dataset); server-side sessions with Redis
(violates "no per-user backend writes").

---

### D-003 — Pool refresh strategy

**Decision**: Backend issues `S3 HeadObject` every 5 minutes, compares
ETag, atomically swaps the in-memory pool on change.

**Rationale**: No manual operator step needed for a new crawl; survives
ephemeral cluster rebuilds; transparent to learners; old pool retained
until new one passes pydantic validation, so readers never see a
half-loaded state.

**Alternatives**: Manual `kubectl rollout restart` (requires operator
ceremony, breaks single-command publish); S3 event → SQS → webhook
(real-time but adds queue infrastructure for a 5-minute SLA we
don't need).

---

### D-004 — Frontend / backend origin

**Decision**: Separate origins — frontend on `S3 + CloudFront`,
backend on EKS behind ALB. Backend ships CORS headers scoped to the
CloudFront domain. SPA reads `VITE_API_BASE_URL` at build time.

**Rationale**: Static frontend on CloudFront costs near-zero at idle
(constitution III); backend can scale or die without affecting page
serving; portfolio shows real CDN architecture; CORS is a well-known
demonstrable competence.

**Alternatives**: Single origin via ALB (simpler, but FE pays compute
cost and never benefits from edge caching); CloudFront with custom
origin pointing at ALB (extra hop, more failure modes).

---

### D-005 — Terraform state locking

**Decision**: Terraform >= 1.15, S3 backend with `use_lockfile = true`
(native S3 state locking, GA in 1.11). No DynamoDB lock table.

**Rationale**: User explicitly asked "Locking은 S3로". Native
support removes a sidecar resource. Saves ~$0.20/mo and one
Terraform module.

**Alternatives**: DynamoDB lock table (extra resource, more provider
permissions, deprecated by S3 native locking); skip locking (unsafe
even for solo work).

---

### D-006 — Cluster shape

**Decision**: AWS EKS, Karpenter for autoscaling, Spot worker pools.
Cluster is fully ephemeral: created by a manual GitHub Actions
workflow dispatch, destroyed by the operator after demos.

**Rationale**: User wants EKS on portfolio + Karpenter experience.
Spot keeps idle bills low. Ephemeral matches the budget ceiling
($30/mo cap with $0 baseline) and the demo-driven use case.

**Alternatives**: EKS Auto Mode (less Karpenter-as-portfolio-skill
signal); k3s on Spot EC2 (cheaper but doesn't say "EKS" on the
portfolio); long-running cluster (busts budget).

---

### D-007 — Tech stack

**Decision**:
- Frontend: React 19 + TypeScript 5 + Vite 6 + Tailwind 4.
- Backend: Python 3.12 + FastAPI + pydantic v2 + uvicorn.
- Crawler: Go 1.23 + colly/net-http + golang.org/x/time/rate.
- Container base: distroless/python and node:22-alpine.

**Rationale**: Matches user's stated stack; FastAPI gives free OpenAPI
generation that the plan leverages for the contract-test gate;
Tailwind 4's CSS-first config simplifies the design tokens added
during design review.

**Alternatives**: Next.js (overkill for this static SPA + free
hosting on S3+CloudFront wins); Flask (no native OpenAPI); Go
backend (loses FastAPI's pydantic dx).

---

### D-008 — Language

**Decision**: App UI in Korean. Question content in Korean (assumed
to come pre-translated in the crawled artifact). No i18n layer.

**Rationale**: User clarification C2. i18n is real work; deferring
it keeps the MVP tight.

**Alternatives**: Bilingual via `react-i18next` (deferred, not
discarded).

---

### D-009 — URL surface

**Decision**: `/<:examSlug>/practice` (e.g., `/sap-c02/practice`).
Reserved siblings: `/<:examSlug>/exam/...`, `/<:examSlug>/sets/:setId`,
`/<:examSlug>/` for the per-exam landing screen.

**Rationale**: Exam-first hierarchy lets each new exam land cleanly;
mode (practice / exam / sets) is the second segment, keeping
intra-exam navigation natural.

**Revised (2026-05-27, user request)**: The question number was removed
from the URL (was `/practice/:n`). The current question is now client
state persisted in localStorage; prev/next switch in-page without a route
change, which also keeps the side menu mounted (scroll preserved). Reload
restores the last question from localStorage. Trade-off accepted: no
per-question shareable/deep-link URL in the MVP. Updates FR-017, FR-018,
SC-005.

**Alternatives**: Mode-first (`/practice/:examSlug/:n`) — rejected
because per-exam landing pages are awkward to insert later. URL-per-
question (`/practice/:n`) — the original decision, reversed above.

---

### D-010 — Side menu shape

**Decision**: Single flat scrollable list of all question numbers,
no grouping. Per-question status dot (gray / emerald / rose) and
favorite star.

**Rationale**: User clarification C3. SAP-C02 has no canonical
section structure; ~500 items fit a single scrollable list at 60
fps without virtualization (will add `react-window` if profiling
shows jank).

**Alternatives**: Chapter grouping (no upstream metadata); virtual
scroll from day 1 (premature optimization).

---

### D-011 — Picker pattern

**Decision**: Centered modal dialog (shadcn-style, max-width 480px)
for "add to question set", handling both "create new" and "pick
existing".

**Rationale**: Decision D1 from design review. Standard pattern, low
ambiguity, no scroll competition with the question content.

**Alternatives**: Right slide-in drawer (deferred — useful when
batch-adding); inline popover (cramped on small viewports).

---

### D-012 — Keyboard shortcuts

**Decision**: None. Mouse-only UX.

**Rationale**: Decision D2 from design review. The real SAP-C02 exam
is mouse-driven; mirroring it is correct domain modeling. Native
Tab order still works.

**Alternatives**: Full keyboard layer (rejected by user, with sound
reasoning).

---

### D-013 — Design system

**Decision**: Inline in plan.md as "Design System (from
plan-design-review)". Tokens: Pretendard Variable, zinc neutrals,
emerald / rose / amber semantics, Tailwind default spacing.

**Rationale**: Avoids over-engineering a separate DESIGN.md for a
single-feature MVP; promote to real DESIGN.md when feature #2 lands.

**Alternatives**: Full `/design-consultation` flow (overkill for
this scope).

## Open Questions

None at plan-finalization time. All NEEDS CLARIFICATION markers in
spec.md were resolved in /speckit-clarify; all design ambiguities
were resolved in plan-design-review.
