# Research: Home / Landing Screen (002)

**Feature**: 002-home-landing
**Date**: 2026-05-27

Decisions for an additive, frontend-only feature on top of the shipped 001 MVP.
Most context is inherited from 001 (`specs/001-question-practice/`); only the
delta is recorded here.

## Decision Log

### D-001 — Home vs single landing

**Decision**: Build two screens — a multi-certification home at `/` (cert cards)
and a per-certification landing at `/:examSlug/` (mode entry cards).

**Rationale**: User clarification (2026-05-27) chose the multi-certification home
now rather than redirecting `/` to the single exam. Matches the reserved URL
surface (001 D-009) and generalizes cleanly when a second certification lands.

**Alternatives**: `/` → redirect to `/sap-c02/` (rejected by user; simpler but no
top-level home).

---

### D-002 — No new backend or contract

**Decision**: Reuse the existing read-only API unchanged; add no endpoints.

**Rationale**: The screens only need exam metadata that already exists. Constitution
V/VI: no new contract, no per-user write. Keeps 002 a pure frontend change.

**Alternatives**: A dedicated `/home` aggregate endpoint (unneeded; over-engineering
for one cert).

---

### D-003 — Total question count source

**Decision**: Read `total` from `GET /exams/{slug}/questions` for the landing's
count; render the screen without the count if the call fails.

**Rationale**: That response already carries `total` + `numbers`; no extra shape
needed. Graceful degradation satisfies FR-007 / edge cases.

**Alternatives**: Trust `ExamSummary` from `/exams` if it carries a count (used for
the home list); the landing's authoritative count is the questions endpoint.

---

### D-004 — Home certification list source

**Decision**: List certifications from `GET /exams` (ExamSummary: slug, name,
version, …). One card today (sap-c02).

**Rationale**: Single existing read-only endpoint for the exam set; react-query
caches it.

---

### D-005 — Resume ("이어 풀기") source

**Decision**: Read-only read of 001's `current` localStorage map
(`young-certi/v1/<sessionId>/current` → `{ [examSlug]: number }`). Show "이어 풀기"
only when an entry exists; activating it navigates to `/:examSlug/practice` where
001 restores the question.

**Rationale**: State already persisted by 001; 002 only reads it. No new entity, no
write. Zero coupling change to 001.

---

### D-006 — Reuse 001 design system and stack

**Decision**: No new dependency. Reuse Pretendard + JetBrains Mono, zinc/emerald/
rose/amber tokens, card/focus/motion patterns, react-router, react-query, zod,
vitest/Playwright from 001.

**Rationale**: Consistency + zero added bundle/ops cost (constitution III, IV).

## Open Questions

None. The three spec ambiguities were resolved in /speckit-clarify
(multi-cert home, resume in-scope, total-count display).
