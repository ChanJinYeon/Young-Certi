# Research: Practice & Exam Screen Layout (005)

**Feature**: 005-screen-layout
**Date**: 2026-05-27

Frontend layout refactor over existing screens. Only the delta is recorded.

## Decision Log

### D-001 — "Corner" placement

**Decision**: Controls live in rows around the question — above: 홈으로 (left) /
제출·다시 풀기 (right); below: 문제집에 추가 (left) / 이전·다음 (right). Not
absolute/page corners.

**Rationale**: Clarified 2026-05-27. Rows flexed `justify-between` read naturally,
stack cleanly on mobile, and need no absolute positioning.

**Alternatives**: Absolute card-corner or fixed page-corner placement (rejected —
overlap/mobile risk).

---

### D-002 — Exam list reuses the practice side-menu

**Decision**: Build the exam left list from the existing `SideMenu` pattern by
generalizing it (label = question number for practice / exam position 1…N for exam;
status map = correct-incorrect for practice / answered-unanswered for exam; optional
favorites). Retire the top `ExamNavigator` grid.

**Rationale**: User asked for "like the practice list" (FR-005); one shared component
keeps them literally consistent and avoids divergence.

**Alternatives**: Keep a separate exam grid (rejected — diverges from practice;
duplicate styling).

---

### D-003 — Exam 홈으로 preserves the attempt

**Decision**: The new exam 홈으로 navigates to `/` without mutating the ExamAttempt;
the wall-clock timer and answers resume on return.

**Rationale**: FR-006/SC-003; consistent with 004's resume model (D-002/004 there).

---

### D-004 — Remove landing 이어 풀기

**Decision**: Remove the certification landing's separate "이어 풀기" control.

**Rationale**: 문제 풀이 already resumes at the last viewed question (001 URL-less
state + localStorage `current`), so the dedicated button is redundant (FR-012).

---

### D-005 — No behavior/data change

**Decision**: Pure presentation/markup change; all handlers, state, API, and entities
unchanged.

**Rationale**: FR-004/009/011 — layout only, no regression.

## Open Questions

None. Corner interpretation, exam-list pattern, and the landing resume removal were
resolved in /speckit-clarify (2026-05-27).
