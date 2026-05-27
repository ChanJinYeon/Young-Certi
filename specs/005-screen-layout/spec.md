# Feature Specification: Practice & Exam Screen Layout

**Feature Branch**: `005-screen-layout`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: reposition the controls on the practice and exam
screens to fixed corners around the question, and give the exam screen a left
question list (numbered 1–75) plus a home button. (Question sets is a separate
feature.)

## Clarifications

### Session 2026-05-27

- Q: How should "문제 좌상단/우상단/좌하단/우하단" be implemented structurally? → A: As control rows around the question — one row above (left = 홈으로, right = 제출), one row below (left = 문제집에 추가, right = 이전/다음). Not absolute/page corners. The exam uses the same scheme with a left question-list sidebar.
- Q: How should the exam's left question list look/behave? → A: Like the practice screen's side menu (flat scrollable list, click-to-jump, status marker, active highlight), numbered 1…N by exam position.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent corner controls on the practice screen (Priority: P1)

While practicing, the learner finds the main controls in predictable corners around
the question: leave-to-home at the top-left, submit at the top-right, prev/next at
the bottom-right, and add-to-set at the bottom-left. The control positions stay the
same as they move between questions.

**Why this priority**: The primary requested change; a predictable layout reduces
hunting and is the bulk of the work. Independently shippable on the practice screen.

**Independent Test**: Open the practice screen and confirm each control sits in its
specified corner, and that submit/prev/next/add-to-set/home all still work from
their new positions.

**Acceptance Scenarios**:

1. **Given** the practice screen, **When** it renders, **Then** 홈으로 is at the
   top-left, 제출 (or 다시 풀기 after submitting) at the top-right, 이전/다음 at the
   bottom-right, and 문제집에 추가 at the bottom-left, around the question.
2. **Given** the new layout, **When** the learner uses each control, **Then** every
   control behaves exactly as before (no behavior regression from 001/003); only the
   position changed.

---

### User Story 2 - Exam screen with a left question list and corner controls (Priority: P1)

In an exam, the question list appears as a **left sidebar** numbered **1 to 75** (by
exam position), and the controls sit in corners: 홈으로 top-left, 시험 제출
top-right, 이전/다음 bottom-right. A 홈으로 button is added (the exam previously had
none).

**Why this priority**: Brings the exam screen to the same predictable layout as
practice and adds the missing home exit. Core to this feature.

**Independent Test**: Start an exam and confirm the question list is a left sidebar
numbered 1–75, 홈으로 is present at the top-left, 시험 제출 at the top-right, and
이전/다음 at the bottom-right; all controls work.

**Acceptance Scenarios**:

1. **Given** an in-progress exam, **When** it renders, **Then** the question list is
   a left sidebar that looks and behaves like the practice screen's side menu (flat
   scrollable list, click-to-jump, status marker, active highlight), listing positions
   **1–75** (the count matches the number of exam questions).
2. **Given** the exam screen, **When** it renders, **Then** 홈으로 is at the
   top-left, 시험 제출 at the top-right, and 이전/다음 at the bottom-right.
3. **Given** the exam screen, **When** the learner clicks 홈으로, **Then** they go to
   the home (`/`) and the in-progress exam is preserved (resumable; the wall-clock
   timer keeps running).

### Edge Cases

- A pool with fewer than 75 questions → the exam list is numbered 1–N (N = the actual
  count), not always 75.
- After submitting on the practice screen, the top-right control shows 다시 풀기 in
  place of 제출 (the swap from 003) — still top-right.
- Narrow / mobile viewport → corners may stack into a non-overlapping order; controls
  must remain reachable and not overlap the question (corner placement is the desktop
  target, mobile must not break — consistent with the existing mobile baseline).
- Leaving the exam via 홈으로 then returning → the exam resumes at the same position.

## Requirements *(mandatory)*

### Functional Requirements

**Practice screen**

- **FR-001**: The practice screen MUST place 홈으로 at the top-left and 제출 at the
  top-right, above/around the question.
- **FR-002**: After submission, the top-right slot MUST show 다시 풀기 in place of
  제출 (preserving the 003 swap behavior), still at the top-right.
- **FR-003**: The practice screen MUST place 이전/다음 at the bottom-right and 문제집에
  추가 at the bottom-left, below/around the question.
- **FR-004**: All practice controls MUST retain their existing behavior (submit,
  retry, prev/next, add-to-set, home) — only their on-screen position changes.

**Exam screen**

- **FR-005**: The exam screen MUST present the question list as a left sidebar that
  reuses the **practice screen's side-menu pattern** (the 001 SideMenu: a flat
  scrollable list, click-to-jump, per-item status marker, active-item highlight),
  numbered by exam position **1 … N** (N = number of exam questions, normally 75),
  with the current position highlighted and answered positions visually marked.
- **FR-006**: The exam screen MUST add a 홈으로 control at the top-left that
  navigates to the home (`/`); the in-progress exam MUST be preserved (resumable,
  timer continues on wall-clock).
- **FR-007**: The exam screen MUST place 시험 제출 at the top-right and 이전/다음 at
  the bottom-right.
- **FR-008**: The exam list's position numbers (1…N) MUST map to the underlying
  selected questions; navigating by position MUST show the corresponding question.
- **FR-009**: All exam behavior (timer, no in-exam feedback, submit/auto-submit,
  resume, scoring) MUST remain unchanged — only layout and the added 홈으로 change.

**Both**

- **FR-010**: The corner layout MUST keep controls from overlapping the question
  content and MUST remain usable on mobile (non-breaking; desktop is the corner
  target). All controls keep visible focus and ≥44px touch targets.
- **FR-011**: This feature MUST be additive/refactor-only — no backend, contract, or
  data change; reuse the existing design tokens; Korean labels; no login.

### Key Entities *(include if feature involves data)*

- None new. This is a presentation/layout change over existing practice (001/003) and
  exam (004) screens; it reads the same client state and read-only API as before.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the practice screen, 100% of the four controls render in their
  specified corners (홈으로 top-left, 제출/다시 풀기 top-right, 이전/다음 bottom-right,
  문제집에 추가 bottom-left) and remain functional.
- **SC-002**: On the exam screen, the question list renders as a left sidebar
  numbered 1–N, 홈으로/시험 제출/이전·다음 render in their specified corners, and all
  remain functional.
- **SC-003**: 홈으로 from an in-progress exam returns to the home and the exam
  resumes at the same position with the correct remaining time (no exam-state loss).
- **SC-004**: No behavior regression — every existing practice/exam control works
  exactly as before the layout change (verified by the existing + updated tests).
- **SC-005**: The layout does not break on mobile (no overlap, no horizontal scroll,
  ≥44px targets) and keeps visible focus on every control.

## Assumptions

- "Top-left / top-right / bottom-left / bottom-right" are interpreted **relative to
  the question area** — a control row above the question (home left, submit right)
  and a control row below the question (add-to-set left, prev/next right). The exam
  uses the same corner scheme around its question, with the question list as a left
  sidebar beside it.
- Practice: the 즐겨찾기 (favorite) toggle stays in the question card header; only the
  four named controls are repositioned. 다시 풀기 shares the top-right slot with 제출
  (swap from 003).
- Exam list numbering 1…N is by exam position (1st…Nth selected question), not by the
  underlying pool number; normally N = 75 (fewer if the pool is smaller).
- The exam left sidebar reuses the practice screen's side-menu pattern (ideally the
  shared SideMenu component, generalized for exam-position labels + answered status)
  for visual and interaction consistency.
- Frontend-only layout/refactor reusing 001/002/004 components, design tokens, and
  state. No backend/contract/dependency change. Desktop-first with a non-breaking
  mobile baseline, consistent with prior features.
