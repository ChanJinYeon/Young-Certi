# Research: Question Sets Screen (007)

**Feature**: 007-question-sets
**Date**: 2026-05-27

Additive frontend feature over 001–006. Only the delta is recorded.

## Decision Log

### D-001 — Routes & entry

**Decision**: `/:examSlug/sets` (list) and `/:examSlug/sets/:setId` (solve). The 002
landing 문제집 entry becomes an active link to `/sets`.

**Rationale**: Matches the reserved D-009 URL surface; a list route + a per-set solve
route is the natural shape.

---

### D-002 — Set solve = practice-scoped

**Decision**: Opening a set reuses the practice composition (ChoiceList,
ResultFeedback, left SideMenu, control rows) but scoped to the set's questions;
prev/next clamp to the set.

**Rationale**: Clarified — same experience as practice, limited to the set. Reuses
shipped components; no read-only-list divergence.

---

### D-003 — Per-set results (separate store)

**Decision**: A new `SetResult` localStorage store, per set, keyed by `{setId,
number}` (`useSetResults` hook). Solving in a set writes only here; practice results
and other sets are untouched. Deleting a set clears its SetResult.

**Rationale**: Clarified — results are separate per set, NOT shared with practice.
Keeps each set's progress independent.

**Alternatives**: Share the practice `PerQuestionResult` (rejected by clarification).

---

### D-004 — Management scope

**Decision**: `useQuestionSets` gains `deleteSet(id)` (with confirm) and
`removeQuestion(setId, ref)`. Rename is deferred.

**Rationale**: Clarified — delete + remove are enough for housekeeping now.

---

### D-005 — Missing question graceful

**Decision**: A set ref whose number is absent from the current pool renders as an
"unavailable" item and is skippable; set navigation does not break.

**Rationale**: FR-007; the pool can change between crawls.

## Open Questions

None. Solve model, per-set results, and management scope were resolved in
/speckit-clarify (2026-05-27).
