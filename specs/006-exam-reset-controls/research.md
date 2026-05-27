# Research: Control Re-placement & Exam Home-Reset (006)

**Feature**: 006-exam-reset-controls
**Date**: 2026-05-27

Frontend change over 005. Only the delta is recorded.

## Decision Log

### D-001 — Control placement swap

**Decision**: 이전/다음 → top-right row, 제출 / 시험 제출 → bottom-right row (both
screens). 홈으로 top-left, 문제집에 추가 bottom-left unchanged.

**Rationale**: User request; revises 005 (which had submit top-right / prev-next
bottom-right). Handlers unchanged — JSX position only.

---

### D-002 — Exam heading by position

**Decision**: The exam current-question heading shows `currentIndex + 1` (exam
position 1…N), not the pool number.

**Rationale**: Consistency with the left list (already 1…N); the pool number is an
implementation detail the learner shouldn't see.

---

### D-003 — Exam home-reset (button-only)

**Decision**: Exam 홈으로 opens a warning; confirm → delete the ExamAttempt
(`useExamAttempt.reset()`) → `navigate("/")`; cancel → keep the exam. Re-entry then
shows the start screen. A page **reload** still resumes (only the button resets).

**Rationale**: User wants leaving via 홈으로 to abandon the exam (clear intent), but a
3-hour exam must survive an accidental reload (clarified: 홈으로만 초기화). Reverses
004/005 "home preserves" for the button only; 004 SC-006 reload-resume retained.

---

### D-004 — Reuse confirm-modal pattern

**Decision**: The 홈으로 warning reuses the existing 시험 제출 confirm modal pattern
(centered, Esc/backdrop/focus-trap). `useExamAttempt` gains `reset()` that removes the
attempt's localStorage key.

**Rationale**: No new component/pattern; consistent UX; minimal change.

## Open Questions

None. Placement swap and reset scope (button-only) were settled up front and recorded
in the spec's Clarifications.
