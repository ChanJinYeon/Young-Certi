# Research: Exam Mode (004)

**Feature**: 004-exam-mode
**Date**: 2026-05-27

Additive frontend feature over 001/002/003. Only the delta is recorded.

## Decision Log

### D-001 — Route & view model

**Decision**: One route `/:examSlug/exam` with a status-driven view: no attempt →
start/confirm; `in-progress` → exam UI; `submitted` → result/review.

**Rationale**: A single route keeps resume trivial (revisiting the URL shows the
current state) and matches the reserved D-009 URL surface.

**Alternatives**: Separate `/exam`, `/exam/result` routes (more routing, no benefit).

---

### D-002 — Timer is wall-clock

**Decision**: `remaining = startedAt + durationMinutes*60s − now`, recomputed each
tick (1s `setInterval`), never accumulated. On mount, if `in-progress` and remaining
≤ 0 → auto-submit immediately.

**Rationale**: Survives reload/leave with correct remaining time (FR-004/SC-002) and
handles "time expired while away". No timer dependency needed.

**Alternatives**: Accumulated countdown (drifts, breaks on reload — rejected).

---

### D-003 — ExamAttempt entity + useExamAttempt

**Decision**: New localStorage key `young-certi/v1/<sessionId>/exam/<examSlug>`
holding `{ examSlug, questionNumbers[], answers, startedAt, durationMinutes, status,
submittedAt, score }`. A `useExamAttempt` hook owns start/answer/submit/resume +
grading. Separate from practice `results`/`favorites`/`sets`.

**Rationale**: Isolation (FR-009/SC-004); resume stability; no backend write
(constitution VI).

---

### D-004 — Question selection

**Decision**: On start, shuffle the pool's `numbers` and take 75 (or all if fewer);
persist the chosen set in the attempt so resume shows the same questions.

**Rationale**: Random per attempt (clarified) + stable across reload.

---

### D-005 — Grading & pass

**Decision**: At submit, ensure all selected questions are fetched (react-query
cache), grade client-side with the 001 `score` helper per `answerKey`; result =
correct/total + percent; pass = percent ≥ 75 (informational).

**Rationale**: Reuses existing answer keys + scoring; the real scaled score is not
reproducible from raw answers (clarified).

---

### D-006 — No in-exam feedback; confirm modal

**Decision**: Exam renders ChoiceList with `submitted={false}` always (selection
only, no correct/incorrect coloring); explanations/feedback appear only on the
result view. Manual submit uses a confirm modal (reuse the 002 picker modal
pattern); auto-submit on timeout skips the confirm.

**Rationale**: Mirrors the real exam (FR-003); reuses existing components/patterns.

---

### D-007 — Reuse stack & design system

**Decision**: No new dependency; reuse react-router/react-query/zod, the 001
localStorage/session model, and the 001/002 design tokens. The only net-new visual
pattern is the countdown timer.

## Open Questions

None. Timer duration, selection, and pass threshold were resolved in
/speckit-clarify (2026-05-27).
