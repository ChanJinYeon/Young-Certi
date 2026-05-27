# Implementation Plan: Practice Screen — Retry & Home Buttons

**Branch**: `003-practice-retry-home` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-practice-retry-home/spec.md`

## Summary

Add two controls to the existing practice screen (`/:examSlug/practice`):
**다시 풀기** resets the current question to its un-submitted state — clearing the
selection, the feedback, and the saved `PerQuestionResult` for that question (so the
reset persists and the side-menu dot reverts to unattempted), affecting only the
current question. **홈으로** navigates to the root home `/` (feature 002), with all
session state preserved. Frontend-only, additive; no backend/contract/dependency
change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Vite 6 (inherited). Frontend only.

**Primary Dependencies**: Existing only — react-router-dom (`useNavigate`/`Link` to `/`), the 001 localStorage hooks. **No new dependency.**

**Storage**: No new persistence. Adds a delete path on the existing `PerQuestionResult` localStorage map (001-owned): "다시 풀기" removes the current `{examSlug, number}` entry. Favorites / question sets / CurrentQuestion untouched.

**Testing**: vitest + RTL extensions to the practice-page tests — retry clears selection/feedback + removes the saved result + side-menu reverts; home button navigates to `/`. Reuses 001/002 harness; existing tests stay green.

**Target Platform**: Modern desktop browsers; non-breaking mobile baseline (same as 001/002).

**Project Type**: Web application (frontend SPA change only).

**Performance Goals**: No new network calls; retry/home are instant client-side actions.

**Constraints**: Additive — existing practice controls/URLs/behavior unchanged (FR-007). Reset isolated to the current question (FR-003). No login, session-only (constitution VI). Korean labels.

**Scale/Scope**: ~1 page edit (PracticePage) + 1 hook method (`clearResult`) + 2 small controls; <120 LOC frontend.

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.*

- **I. IaC-Only** / **II. Ephemeral Cluster** / **VII. Ethical Sourcing**: unaffected. PASS (N/A).
- **III. Cost-Aware / No RDBMS**: no storage/backend change. PASS.
- **IV. Incremental Learning Steps**: tiny standalone feature, one concept (per-question retry + home nav). PASS.
- **V. REST Contract Discipline**: no new endpoints. PASS (no contract change).
- **VI. Stateless / Session-Only**: client-side only; deletes a local result; no per-user backend write. PASS.

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-practice-retry-home/
├── plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

(No `contracts/` — no API surface change; reuses 001's OpenAPI unchanged.)

### Source Code (repository root)

```text
frontend/src/
├── pages/PracticePage.tsx        # EDIT — add 다시 풀기 + 홈으로 controls
├── hooks/usePerQuestionResult.ts # EDIT — add clearResult(examSlug, number)
└── (components/*, App.tsx)        # UNCHANGED
frontend/tests/
└── practice-page.test.tsx        # EXTEND — retry reset + home navigation cases
```

**Structure Decision**: Single-page edit + one hook method. `다시 풀기` calls a new
`clearResult` on the existing `usePerQuestionResult` hook and resets local
`selected`/`submitted` state; `홈으로` is a `Link`/navigate to `/`. No new
component is strictly required (controls live in the existing button row), though a
small control may be extracted for clarity during implementation.

## Eng Review (plan-eng-review summary)

Trivial, additive frontend change. Locked decisions:

- **Retry semantics**: `clearResult(examSlug, number)` removes the entry from the
  `PerQuestionResult` map (a real delete, persisted), then the page resets
  `selected=[]`, `submitted=false` for the current question. Side-menu `statuses`
  is derived from results, so it reverts to unattempted automatically (no extra
  wiring). Isolated to the current `{examSlug, number}` (FR-003/SC-003).
- **Visibility**: 다시 풀기 shown only when `submitted` is true (an attempt exists)
  — FR-004.
- **Home nav**: `홈으로` → `/` (002 home) via router; localStorage (favorites, sets,
  current position, other results) is untouched, so returning resumes correctly
  (FR-006).
- **No regression**: existing controls (이전/다음/제출/즐겨찾기/문제집에 추가) and
  001/002 routes unchanged; only additive edits to PracticePage + a new hook method.

Test coverage: retry clears UI + removes saved result + side-menu reverts +
re-submit works; home button navigates to `/`; isolation (other questions/favorites
unchanged). **Verdict: CLEAR — no blockers.**

Design review: not triggered — two controls reusing the existing 001 button styles
(ghost/secondary) on an existing screen; no new screen or non-trivial UI. Visual
polish folded into the codex implementation + a light pass; no separate design-
review large-task needed. (If desired, the final task can run a quick `design-review`
on the practice screen.)

## Complexity Tracking

No constitution violations — not applicable.
