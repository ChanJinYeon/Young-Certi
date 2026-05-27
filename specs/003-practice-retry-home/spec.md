# Feature Specification: Practice Screen — Retry & Home Buttons

**Feature Branch**: `003-practice-retry-home`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Add two controls to the question-practice screen:
(1) a 다시 풀기 (retry) button, (2) a 홈 화면으로 가는 (go to home) button."

## Clarifications

### Session 2026-05-27

- Q: Does "다시 풀기" reset the current question only, or the whole session? → A: The current question only — clears its selection, feedback, and saved result; other questions, favorites, and question sets are unchanged.
- Q: Where does "홈으로" navigate — the root home `/` or the exam landing `/:examSlug/`? → A: The root home `/` (the feature-002 multi-certification home).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retry the current question (Priority: P1)

After submitting an answer and seeing the green/red feedback, the learner wants to
attempt the same question again from scratch. They click "다시 풀기"; the selection
and feedback clear, and the question returns to its un-submitted state so they can
choose and submit again.

**Why this priority**: This is the primary requested capability — practicing a
question is far more useful if you can re-attempt it. Independently shippable.

**Independent Test**: Submit an answer, click "다시 풀기", confirm the choices reset
(no selection, no feedback), then answer and submit again successfully.

**Acceptance Scenarios**:

1. **Given** the learner has submitted an answer to the current question, **When**
   they click "다시 풀기", **Then** the selection and the green/red feedback clear and
   the question returns to its un-submitted state.
2. **Given** the learner clicked "다시 풀기", **When** they navigate away and back to
   that question (or reload), **Then** the question is still in the fresh,
   un-submitted state (the prior attempt was cleared, not just visually hidden).
3. **Given** the current question is reset via "다시 풀기", **When** the learner looks
   at the side menu, **Then** that question's status reverts to unattempted (gray),
   and no other question's status, favorites, or question sets change.

---

### User Story 2 - Return to the home screen (Priority: P2)

While practicing, the learner wants to go back to the home screen (e.g., to pick a
different mode later). They click "홈으로" and arrive at the home.

**Why this priority**: A basic navigation affordance now that a home screen exists
(feature 002). Useful but secondary to the retry capability.

**Independent Test**: From the practice screen, click "홈으로" and confirm the home
screen loads with session state (favorites, sets, saved position) intact.

**Acceptance Scenarios**:

1. **Given** the learner is on the practice screen, **When** they click "홈으로",
   **Then** the home screen (`/`) loads.
2. **Given** the learner returns to practice afterward, **When** the practice screen
   opens, **Then** their saved position and other session state are unchanged.

### Edge Cases

- "다시 풀기" before any submission → the control is absent or inert (there is no
  attempt to reset).
- "다시 풀기" on a question whose result was never saved → no error; the question is
  simply in its fresh state.
- "홈으로" then back to practice → resumes at the same question (feature 001/002
  saved-position behavior is unaffected).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The practice screen MUST provide a "다시 풀기" control that resets the
  **current** question to its un-submitted state — clearing the learner's selection
  and the submitted feedback so the question can be re-attempted.
- **FR-002**: "다시 풀기" MUST clear the saved per-question result for the current
  question, so the reset persists: after navigating away/back or reloading, the
  question is fresh and its side-menu status reverts to unattempted.
- **FR-003**: "다시 풀기" MUST affect only the current question — other questions'
  saved results, favorites, and question sets remain unchanged.
- **FR-004**: "다시 풀기" MUST be available only when there is an attempt to reset
  (i.e., after submission); before submission it is absent or inert.
- **FR-005**: The practice screen MUST provide a "홈으로" control that navigates to
  the home screen (`/`).
- **FR-006**: Navigating home MUST NOT discard other session state — favorites,
  question sets, other questions' results, and the saved current-question position
  all remain in localStorage.
- **FR-007**: Both controls MUST be additive — existing practice behavior, URLs, and
  other controls (이전 / 다음 / 제출 / 즐겨찾기 / 문제집에 추가) remain unchanged.
- **FR-008**: Both controls MUST use Korean labels, require no login, and keep all
  state client-side / session-only (constitution VI).

### Key Entities *(include if feature involves data)*

- **PerQuestionResult** (client localStorage, owned by feature 001): "다시 풀기"
  deletes the entry for the current `{examSlug, number}`; no new entity is
  introduced. Other entities (Favorite, QuestionSet, CurrentQuestion) are untouched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After "다시 풀기", the current question shows no prior selection and no
  feedback, and the learner can answer and submit it again — verified by a second
  submission producing fresh feedback.
- **SC-002**: After "다시 풀기", that question's side-menu status reverts to
  unattempted and stays unattempted across a full-page reload.
- **SC-003**: "다시 풀기" never changes any other question's result, any favorite, or
  any question set (100% isolation to the current question).
- **SC-004**: From the practice screen, "홈으로" reaches the home in one click with
  all session state preserved.
- **SC-005**: Neither control requires an email, password, or any account credential.
- **SC-006**: Existing practice controls and behavior continue to work unchanged
  (no regression in 001/002).

## Assumptions

- "다시 풀기" resets the **current question only**, not the whole session. (A
  per-question screen makes the current question the natural target; a full-session
  reset is out of scope here.)
- "다시 풀기" clears the saved `PerQuestionResult` for the current question (a true
  reset, not just a visual clear), so the reset survives navigation/reload.
- "다시 풀기" appears after submission (when an attempt exists to reset).
- "홈으로" navigates to the feature-002 home at `/`.
- Frontend-only, additive change reusing feature 001/002 (React/TS/Vite/Tailwind,
  localStorage hooks, design-system tokens). No backend, contract, or dependency
  change. Korean UI, desktop-first with non-breaking mobile baseline.
