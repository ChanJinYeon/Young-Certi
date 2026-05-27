# Feature Specification: Control Re-placement & Exam Home-Reset

**Feature Branch**: `006-exam-reset-controls`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: move prev/next to the top-right and submit to the
bottom-right on both screens; number the exam questions 1…N at the top-left; and make
the exam "홈으로" reset the exam (with a warning), so returning starts a new exam.

## Clarifications

### Session 2026-05-27

- Q: How does the new control placement relate to 005? → A: It revises 005 — swap the top-right and bottom-right slots: 이전/다음 move to top-right and 제출 (and 시험 제출) move to bottom-right. 홈으로 stays top-left; 문제집에 추가 stays bottom-left (practice).
- Q: Scope of exam "홈으로 = reset"? → A: Only the 홈으로 button resets (after a warning confirmation). A page reload still resumes the in-progress exam (we do not remove reload-resume from 004).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prev/next at top-right, submit at bottom-right (Priority: P1)

On both the practice and exam screens, the learner finds 이전/다음 at the top-right
and the submit action (제출 / 시험 제출) at the bottom-right, around the question.
홈으로 stays top-left and (practice) 문제집에 추가 stays bottom-left.

**Why this priority**: The requested re-placement; revises the 005 layout. Cheap,
self-contained, applies to both screens.

**Independent Test**: Open practice and exam and confirm 이전/다음 are top-right and
submit is bottom-right, and all controls still work.

**Acceptance Scenarios**:

1. **Given** the practice screen, **When** it renders, **Then** 이전/다음 are in the
   top-right and 제출 (or 다시 풀기 after submitting) is in the bottom-right; 홈으로
   top-left, 문제집에 추가 bottom-left.
2. **Given** the exam screen, **When** it renders, **Then** 이전/다음 are top-right
   and 시험 제출 is bottom-right; 홈으로 top-left.
3. **Given** the new placement, **When** the learner uses each control, **Then**
   behavior is unchanged — only position moved.

---

### User Story 2 - Exam questions numbered 1…N at the top-left (Priority: P2)

In an exam, the current question is labeled by its **exam position (1…N, normally
75)** at the top-left of the question — not by the underlying pool number.

**Why this priority**: Aligns the exam heading with the left list (which is already
1…N) so the learner always sees a consistent position. Small label change.

**Independent Test**: Start an exam and confirm the question heading reads the exam
position (e.g., "문제 1" for the first question), matching the highlighted left-list
item, regardless of the underlying pool number.

**Acceptance Scenarios**:

1. **Given** an in-progress exam on the k-th question, **When** it renders, **Then**
   the top-left heading shows the exam position k (1…N), matching the left list's
   active item.

---

### User Story 3 - Exam home button resets the exam (Priority: P1)

In an exam, clicking 홈으로 warns the learner that leaving will reset the exam. On
confirm, the in-progress exam is discarded and they go home; returning to exam mode
starts a brand-new exam. (Canceling the warning keeps the exam.)

**Why this priority**: A deliberate behavior change so the home exit is unambiguous —
leaving the exam abandons it. Important and user-requested.

**Independent Test**: In an exam, click 홈으로 → see a warning → confirm → land on
home → re-enter exam mode → a fresh exam start screen appears (no resumed attempt).

**Acceptance Scenarios**:

1. **Given** an in-progress exam, **When** the learner clicks 홈으로, **Then** a
   warning appears stating the exam will be reset.
2. **Given** the warning, **When** the learner confirms, **Then** the in-progress
   exam is discarded and they navigate to the home (`/`).
3. **Given** the learner returns to exam mode after confirming, **When** the exam
   screen loads, **Then** it shows the start screen (a new exam), not a resumed one.
4. **Given** the warning, **When** the learner cancels, **Then** the exam continues
   unchanged (timer keeps running).

### Edge Cases

- A page **reload** during an exam (not via 홈으로) still resumes the in-progress
  exam with the correct remaining time — reload-resume from 004 is retained (only the
  홈으로 button resets).
- After submission, the practice bottom-right shows 다시 풀기 (the 003 swap) in place
  of 제출.
- Mobile/narrow viewport → the top and bottom control rows stack without overlapping
  the question; controls remain reachable (≥44px), consistent with the existing
  mobile baseline.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On both the practice and exam screens, 이전/다음 MUST be placed in the
  top-right control row and the submit action (제출 / 시험 제출) MUST be placed in the
  bottom-right control row (revising the 005 placement). 홈으로 stays top-left;
  practice 문제집에 추가 stays bottom-left.
- **FR-002**: After submission on practice, the bottom-right slot MUST show 다시 풀기
  in place of 제출 (preserving the 003 swap).
- **FR-003**: All repositioned controls MUST retain their existing behavior — only
  on-screen position changes.
- **FR-004**: The exam's current-question heading MUST show the **exam position
  (1…N)** at the top-left, consistent with the left list, not the underlying pool
  question number.
- **FR-005**: In an exam, activating 홈으로 MUST first show a warning that leaving
  resets the exam; it MUST NOT navigate or reset until the learner confirms.
- **FR-006**: On confirming the warning, the system MUST discard the in-progress
  ExamAttempt and navigate to the home (`/`); on canceling, the exam MUST continue
  unchanged.
- **FR-007**: After a confirmed 홈으로 reset, returning to exam mode MUST present the
  start screen (a new exam), with no resumed attempt.
- **FR-008**: A page reload during an exam (not via 홈으로) MUST still resume the
  in-progress exam (reload-resume from 004 is retained); only the 홈으로 button
  triggers the reset.
- **FR-009**: This feature MUST be additive/refactor-only beyond the stated behavior
  change — no backend, contract, or data-shape change; reuse existing design tokens
  and the existing confirm-modal pattern; Korean labels; no login.

### Key Entities *(include if feature involves data)*

- **ExamAttempt** (client localStorage, 004): unchanged in shape. The 홈으로 reset
  **deletes** the in-progress attempt (so re-entry starts fresh); reload still reads
  it. No new entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On practice and exam, 이전/다음 render top-right and submit renders
  bottom-right, and all controls remain functional.
- **SC-002**: The exam question heading shows the exam position 1…N matching the left
  list's active item for 100% of questions.
- **SC-003**: Clicking exam 홈으로 always shows a warning first; confirming discards
  the exam and goes home; canceling leaves the exam running unchanged.
- **SC-004**: After a confirmed reset, re-entering exam mode shows a new-exam start
  screen (no resumed attempt) in 100% of cases.
- **SC-005**: A reload during an exam still resumes it with the correct remaining
  time (no regression to 004 reload-resume).
- **SC-006**: No other behavior regression on practice/exam; layout remains usable on
  mobile with visible focus and ≥44px targets.

## Assumptions

- Revises 005's control placement (which had 제출 top-right / 이전·다음 bottom-right)
  by swapping those two slots; 홈으로 (top-left) and 문제집에 추가 (bottom-left)
  positions are unchanged.
- Reverses the 004/005 "홈으로 preserves the attempt" for the **button** only
  (FR-005–007); reload-resume (004 SC-006) is explicitly retained (FR-008) — confirmed
  in clarification.
- The exam warning reuses the existing confirm-modal pattern (Esc/backdrop/focus
  trap) used for 시험 제출.
- Exam position label uses the same 1…N mapping as the left list (position i ↔
  `questionNumbers[i-1]`); normally N = 75.
- Frontend-only; reuses 001/004/005 components, tokens, and state. No backend,
  contract, or dependency change. Korean UI; desktop-first, non-breaking mobile.
