# Implementation Plan: Home / Landing Screen

**Branch**: `002-home-landing` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-home-landing/spec.md`

## Summary

Add two front-end-only screens on top of the shipped 001 MVP so the site is
enterable without a deep link: a **multi-certification home** at `/` (lists
certifications as cards — one today, AWS SAP-C02) and a **per-certification
landing** at `/:examSlug/` (entry cards for 문제 풀이 (active), 시험 모드 and
문제집 (reserved, disabled "준비 중"), the total question count, and a "이어 풀기"
resume when a saved position exists). No backend change: both screens read the
existing read-only API (`/exams`, `/exams/{slug}/questions`). 001's URLs, the
in-page practice state model, localStorage, and tests are untouched.

## Technical Context

**Language/Version**: TypeScript 5 on Node 22, React 19, Vite 6 (inherited from 001). No backend/crawler/infra change.

**Primary Dependencies**: Existing only — react-router-dom (routes for `/`, `/:examSlug/`), @tanstack/react-query (read-only exam metadata fetch), zod (validate API responses), Tailwind 4 (design tokens from 001). **No new dependency.**

**Storage**: No new persistence. Reuses 001 localStorage keys read-only on these screens: `current` (resume target), and reads exam metadata from the backend in-memory pool. No backend writes (constitution VI).

**Testing**: vitest + React Testing Library for the two new screens (home renders cert list + navigates; landing shows active/disabled entries, total count, resume visibility); one Playwright happy-path extension (`/` → cert → landing → 문제 풀이 → practice). Reuses 001 harness; 001 tests stay green.

**Target Platform**: Modern desktop browsers; non-breaking mobile baseline (same as 001).

**Project Type**: Web application (frontend SPA change only).

**Performance Goals**: Home/landing first paint ≤ 1.5 s on a warm cache; reaching practice from root ≤ 2 clicks (SC-001). Total-count fetch is a single cached read-only call.

**Constraints**: Additive only — zero change to 001 routes/behavior/tests (FR-010). No login, session-only (constitution VI). Korean UI. Graceful render when exam metadata is unavailable (FR-007/edge cases).

**Scale/Scope**: ~2 new pages + small shared card primitives; ~300–500 LOC frontend, no backend. One certification today; home generalizes to a list.

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.*

- **I. IaC-Only**: No infra change. PASS (N/A).
- **II. Ephemeral Cluster**: Unaffected. PASS (N/A).
- **III. Cost-Aware / No managed RDBMS**: No new storage, no backend writes, reuses in-memory read-only pool. PASS.
- **IV. Incremental Learning Steps**: Standalone feature `002`, one concept (entry/landing), small PR-sized scope. PASS.
- **V. REST Contract Discipline**: No new endpoints; consumes existing OpenAPI-described `/exams` and `/exams/{slug}/questions`. PASS (no contract change).
- **VI. Stateless App / Session-Only State**: No login; reads localStorage + read-only API; no per-user backend write. PASS.
- **VII. Ethical Data Sourcing**: No crawling involved. PASS (N/A).

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-home-landing/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions
├── data-model.md        # Phase 1 — read-only views (no new persistence)
├── quickstart.md        # Phase 1 — run/verify locally
└── checklists/requirements.md  # from /speckit-specify
```

(No `contracts/` — this feature adds no API surface; it reuses 001's
`specs/001-question-practice/contracts/openapi.yaml` unchanged.)

### Source Code (repository root)

```text
frontend/src/
├── pages/
│   ├── HomePage.tsx          # NEW — route "/", lists certifications
│   ├── ExamLandingPage.tsx   # NEW — route "/:examSlug/", mode entry cards + count + resume
│   └── PracticePage.tsx      # UNCHANGED (001)
├── components/
│   ├── CertCard.tsx          # NEW — certification card (home)
│   └── EntryCard.tsx         # NEW — mode entry card (active / disabled "준비 중")
├── api/
│   ├── client.ts             # reuse fetchQuestionNumbers; add fetchExams (GET /exams) if needed
│   └── types.ts              # reuse ExamSummary / questionNumbers schemas
├── App.tsx                   # add routes "/" and "/:examSlug/"; keep "/:examSlug/practice"
└── hooks/                    # reuse storage/useLocalSession; read `current` for resume
frontend/tests/
├── home.test.tsx             # NEW
├── exam-landing.test.tsx     # NEW
└── e2e/practice.spec.ts      # extend happy-path to start from "/"
```

**Structure Decision**: Frontend SPA only. Two new page components + two small card primitives, two new routes in `App.tsx`. Everything else (design tokens, localStorage hooks, API client, backend) is reused from 001.

## Eng Review (plan-eng-review summary)

Scope is a thin, additive frontend layer over a shipped MVP; no new architecture.
Locked decisions:

- **Routing model**: screens are real routes (`/`, `/:examSlug/`, `/:examSlug/practice`); intra-screen state (the practice question number) stays in localStorage per 001. Consistent and non-conflicting — 002 only *adds* `/` and `/:examSlug/`.
- **Data flow**: home lists certs from `GET /exams` (ExamSummary); landing shows total count from `GET /exams/{slug}/questions` (`total`). Both via react-query (cached, read-only). Degrade gracefully if unavailable (render screen, omit count) — no hard dependency.
- **Resume**: read-only read of the 001 `current` localStorage map; "이어 풀기" shown only when a saved number exists; activating navigates to `/:examSlug/practice` (001 restores it).
- **No-regression guard**: 001 routes/tests untouched; new tests added separately; Playwright happy-path extended to begin at `/`.
- **Edge cases**: unknown `:examSlug` → "not found" state with link home; pool unavailable → screen still renders.

Test coverage: home (list render + navigate), landing (active vs disabled entries, count present/absent, resume present/absent, unknown slug), e2e (root → practice). **Verdict: CLEAR — no blockers.**

## Design Review (plan-design-review summary)

Reuses 001's Design System tokens verbatim (Pretendard + JetBrains Mono, zinc
surfaces, emerald/rose/amber semantics, rounded-lg cards, shadow-sm, focus ring,
44px targets, reduced-motion). New-screen decisions:

- **Home with one card**: avoid the lonely-centered-card AI-slop look — left-aligned page heading ("YoungCerti") + a constrained content column with the cert card as a clear, full-width-of-column actionable card showing name + question count. Generalizes to a grid when more certs exist.
- **Entry cards (landing)**: active "문제 풀이" card visually primary; 시험 모드 / 문제집 cards use a muted/disabled treatment with a small "준비 중" badge, `aria-disabled`, non-interactive — color is not the only signal (badge text + reduced affordance).
- **Resume**: "이어 풀기" as a secondary action on the landing (e.g., below/next to 문제 풀이), only when applicable.
- **a11y**: semantic `<main>`/`<nav>`, cards are real `<a>`/`<button>`, disabled entries announced; Korean labels; mobile single-column, ≥44px targets.

Anti-slop check: no purple gradients, no 3-column filler grid, no decorative blobs/emoji, no centered-everything. **Verdict: CLEAR — applies 001 system, no new design debt.**

## Complexity Tracking

No constitution violations — not applicable.
