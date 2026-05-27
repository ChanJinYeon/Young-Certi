# Implementation Plan: Question Sets Screen

**Branch**: `007-question-sets` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-question-sets/spec.md`

## Summary

Build the 문제집 feature, activating the reserved 002 entry. A sets-list screen
(`/:examSlug/sets`) shows saved sets (name + count, delete, empty state); opening a
set (`/:examSlug/sets/:setId`) solves its questions **practice-style** but scoped to
the set, with **per-set results** stored separately from practice (new `SetResult`
store). Sets can be deleted and have a question removed. Frontend-only: extends
`useQuestionSets`, adds a `SetResult` store, reuses the question API + practice
components. No backend, contract, or dependency change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Vite 6 (inherited). Frontend only.

**Primary Dependencies**: Existing only — react-router (routes `/sets`, `/sets/:setId`), @tanstack/react-query (fetch set questions), the 001 ChoiceList/ResultFeedback/SideMenu patterns, design tokens. **No new dependency.**

**Storage**: New `SetResult` localStorage store — per-set per-question results keyed by `{setId, number}` (separate from practice `PerQuestionResult`). Extend `useQuestionSets` with `deleteSet(id)` and `removeQuestion(setId, ref)`; deleting a set also clears its SetResult. No backend write (constitution VI).

**Testing**: vitest + RTL — sets list (render name/count, empty state, open, delete confirm), set solve (scoped prev/next, feedback, per-set result isolation from practice + other sets), remove-question, missing-question graceful. One Playwright happy-path (landing 문제집 → open set → solve → see feedback). Reuse 001 harness; existing tests stay green.

**Target Platform**: Modern desktop; non-breaking mobile baseline.

**Project Type**: Web application (frontend SPA change only).

**Performance Goals**: Set questions fetched lazily as visited and cached; no new network shape.

**Constraints**: Per-set results isolated (FR-005). Additive — 001–006 unchanged except activating the 002 문제집 entry. Korean UI; no login; ≥44px; visible focus; mobile non-breaking.

**Scale/Scope**: 2 new pages (SetsListPage, SetSolvePage) + a `useSetResults` hook + `useQuestionSets` ops + activate 002 card. ~500–700 LOC frontend; one new localStorage store, no new entity shape on the server.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

- **I / II / VII**: no infra/crawler change. PASS (N/A).
- **III. Cost-Aware / No RDBMS**: no backend/storage service; client localStorage only. PASS.
- **IV. Incremental Learning Steps**: one feature (question sets). PASS.
- **V. REST Contract Discipline**: no new endpoint; reuses 001 OpenAPI. PASS.
- **VI. Stateless / Session-Only**: no login; SetResult is client-side; no per-user backend write. PASS.

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/007-question-sets/
├── plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

(No `contracts/` — reuses 001's OpenAPI unchanged.)

### Source Code (repository root)

```text
frontend/src/
├── pages/
│   ├── SetsListPage.tsx        # NEW — /:examSlug/sets: list sets (name/count), delete, empty state, open
│   └── SetSolvePage.tsx        # NEW — /:examSlug/sets/:setId: set-scoped practice solve + remove-question
├── hooks/
│   ├── useQuestionSets.ts      # EDIT — add deleteSet(id), removeQuestion(setId, ref)
│   └── useSetResults.ts        # NEW — per-set per-question results (SetResult), keyed by {setId, number}
├── components/
│   ├── ChoiceList.tsx          # REUSE — selection + feedback
│   ├── ResultFeedback.tsx      # REUSE — explanation/feedback
│   └── SideMenu.tsx            # REUSE — set question list (positions/numbers + status)
├── pages/ExamLandingPage.tsx   # EDIT (002) — activate 문제집 EntryCard → /:examSlug/sets
└── App.tsx                     # EDIT — add routes /:examSlug/sets and /:examSlug/sets/:setId
frontend/tests/
├── sets-list.test.tsx          # NEW
├── set-solve.test.tsx          # NEW (incl. per-set result isolation)
└── e2e/sets.spec.ts            # NEW — landing → open set → solve
```

**Structure Decision**: Two new routed pages. The sets-list reuses card styling; the
set-solve reuses the practice composition (left SideMenu scoped to the set, control
rows per the 005/006 placement, ChoiceList + ResultFeedback) but reads/writes the new
`SetResult` store instead of practice results. `useQuestionSets` gains delete/remove;
deleting a set clears its results. The 002 문제집 card is activated.

## Eng Review (plan-eng-review summary)

- **SetResult store**: a `useSetResults(sessionId, setId)` hook over a localStorage
  key (e.g., `young-certi/v1/<sessionId>/set-results/<setId>` → `{ [number]: result }`).
  Solving in a set writes here only — practice `results` and other sets are untouched
  (FR-005/SC-003). Grading reuses the 001 `score` helper.
- **Set-scoped navigation**: position/index over `set.questionRefs`; prev/next clamp
  to the set; the left SideMenu lists the set's items with per-set answered/correct
  status.
- **Management**: `useQuestionSets.deleteSet(id)` (with confirm) removes the set and
  its SetResult; `removeQuestion(setId, ref)` drops one ref and decreases the count;
  both scoped to the target set (FR-006).
- **Graceful missing question**: a ref whose number isn't in the pool renders an
  "unavailable" item and is skippable without breaking set nav (FR-007).
- **Activate 002 entry**: ExamLandingPage 문제집 EntryCard → active link to `/sets`.
- **No regression**: reuses practice components read-only; practice/exam results
  untouched; existing tests unaffected.

Test coverage: list (name/count/empty/open/delete), solve (scoped nav, feedback,
per-set isolation), remove-question, missing-question, e2e. **Verdict: CLEAR — no
blockers; main care is keeping SetResult isolated from practice.**

## Design Review (plan-design-review summary)

Reuses the 001/002 design system; no new visual language.

- **Sets list**: a left-aligned column of set cards (name + "N문항" mono count + a
  quiet delete affordance), reusing the card/token styling; clear empty state with a
  pointer to "문제집에 추가" (no slop, no lonely-centered card).
- **Set solve**: same composition as practice — left SideMenu (set items), control
  rows per 005/006 (홈으로 top-left, 이전/다음 top-right, 제출 bottom-right), a
  "세트에서 제거" action for the current question, ChoiceList + ResultFeedback.
- **Delete/remove confirms**: reuse the confirm-modal pattern; delete-set styled as
  the destructive (rose) action (consistent with 006's exam reset).
- **a11y**: focus rings, ≥44px, modal focus-trap/Esc, status not by color alone
  (SideMenu carries status in aria-label), mobile stacks.
- **Anti-slop**: reuse patterns; no new decoration.

**Verdict: CLEAR — composes existing patterns; the only net-new surface is the sets
list, scoped above.**

## Complexity Tracking

No constitution violations — not applicable.
