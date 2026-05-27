# Research: Practice Retry & Home Buttons (003)

**Feature**: 003-practice-retry-home
**Date**: 2026-05-27

Additive, frontend-only change over 001/002. Only the delta is recorded.

## Decision Log

### D-001 — Retry scope

**Decision**: "다시 풀기" resets the **current question only**, not the whole session.

**Rationale**: Clarified 2026-05-27. The practice screen is per-question, so the
current question is the natural target. A full-session reset is out of scope (and
would be destructive from a single button).

**Alternatives**: Whole-session reset (rejected — too broad for a per-question control).

---

### D-002 — Retry is a real delete, not a visual clear

**Decision**: "다시 풀기" deletes the saved `PerQuestionResult` for the current
`{examSlug, number}` (then resets local `selected`/`submitted`), so the reset
persists across navigation/reload and the side-menu status reverts to unattempted.

**Rationale**: A retry that reappears as "already answered" after navigating away
would be confusing. Deleting the saved result makes the reset truthful (SC-002).
Implementation adds a `clearResult` method to the existing `usePerQuestionResult`
hook.

**Alternatives**: Clear only in-memory UI state (rejected — the saved result and
side-menu dot would still show the old attempt).

---

### D-003 — Home button target

**Decision**: "홈으로" navigates to the root home `/` (feature-002 multi-cert home).

**Rationale**: Clarified 2026-05-27. "홈 화면" maps to the top-level home, not the
per-exam landing.

**Alternatives**: `/:examSlug/` exam landing (rejected — that is one level down, not
"home").

---

### D-004 — Visibility & isolation

**Decision**: "다시 풀기" appears only after submission; both controls touch nothing
beyond the current question's result (favorites, question sets, other results,
saved position unchanged).

**Rationale**: Before submission there is nothing to reset (FR-004). Isolation keeps
the action predictable (FR-003/SC-003).

---

### D-005 — No new dependency / reuse stack

**Decision**: Reuse react-router + the 001 localStorage hooks; reuse 001 button
styling for the new controls. No new dependency, no backend/contract change.

## Open Questions

None. Both spec ambiguities (retry scope, home target) were resolved in
/speckit-clarify.
