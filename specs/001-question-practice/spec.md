# Feature Specification: YoungCerti — Question Practice MVP

**Feature Branch**: `001-question-practice`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: YoungCerti, a certification question-practice
site. First exam pool: AWS SAP-C02 (to be crawled, out of scope for this
spec). MVP focuses on practicing questions one at a time, marking favorites,
and building personal question sets. No login (session-only state). Future
home page will route to "question practice", "exam practice", and "question
sets" sections, so URL paths must be unambiguously namespaced from day one.

## Clarifications

### Session 2026-05-25

- Q: How does the backend serve the question pool? → A: An in-cluster
  REST API on EKS loads the question pool into memory at container
  start and serves it over HTTP. No external database is involved at
  request time.
- Q: What language are the app UI and the question text in? → A: Both
  the app UI (menus, buttons, messages) and the question text /
  explanations are in Korean. No i18n layer is needed in the MVP.
- Q: How is the question pool structured in the UI? → A: A single
  flat pool. The left side menu lists every question number in one
  scrollable list. No chapter / section / topic grouping in the MVP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Solve one question and see the result (Priority: P1)

A learner opens the practice screen for AWS SAP-C02. The current question
fills the main panel; a left side menu lists every question in the pool so
they can jump to any number. The learner reads the question, picks one or
more choices (single-select when the question has one correct answer,
multi-select when it has several), and submits. The selected choices and
the canonical answer are then revealed: every choice the learner picked
correctly is shown in green, every choice they picked incorrectly is shown
in red, and the explanation appears below. Prev / Next buttons move to the
adjacent question without losing the result they just saw.

**Why this priority**: This is the entire purpose of the MVP — without it
the site has no reason to exist. Every other story depends on a working
single-question loop.

**Independent Test**: With a seeded local pool of at least 10 questions
(mixed single- and multi-answer), a user can open the practice URL, answer
each question, see correct/incorrect feedback per choice, read the
explanation, and navigate prev/next end-to-end without any other feature
being present.

**Acceptance Scenarios**:

1. **Given** a single-answer question is displayed, **When** the learner
   selects one choice and submits, **Then** that choice is shown in green
   (if correct) or red (if incorrect), the canonical correct choice is
   highlighted, and the explanation is visible.
2. **Given** a multi-answer question with three correct choices is
   displayed, **When** the learner selects two correct choices and one
   incorrect choice and submits, **Then** the two correctly chosen items
   are green, the incorrectly chosen item is red, the missed correct item
   is marked as a missed correct answer, and the explanation is visible.
3. **Given** a single-answer question, **When** the learner tries to
   select a second choice, **Then** the previously selected choice is
   deselected (radio-style behavior).
4. **Given** a multi-answer question, **When** the learner toggles
   choices, **Then** any number from zero up to all choices may be
   selected before submitting (checkbox-style behavior).
5. **Given** the learner has just submitted an answer, **When** they
   press Next, **Then** the next question loads in its initial,
   un-submitted state and the previous question's result is preserved
   if they navigate back via Prev.
6. **Given** the left side menu lists every question, **When** the
   learner clicks question number N, **Then** the main panel jumps to
   question N and the side menu indicates which item is current.

---

### User Story 2 — Mark a question as a favorite (Priority: P2)

While practicing, the learner clicks a Favorite button on the current
question. The question is now marked as favorite, indicated by a small
yellow star (or equivalent small yellow marker) both on the question
itself and next to its number in the left side menu, so the learner can
later visually scan for the questions they wanted to revisit. Clicking
the button again removes the favorite mark.

**Why this priority**: Adds value on top of the core loop but the core
loop is fully usable without it. Cheap to build once Story 1 exists.

**Independent Test**: With Story 1 working, a user can toggle the
Favorite button on at least three questions, navigate away and back,
and still see the small yellow favorite marker on those questions and
their side-menu entries (within the same session).

**Acceptance Scenarios**:

1. **Given** the current question is not a favorite, **When** the
   learner clicks Favorite, **Then** a small yellow favorite marker
   appears on the question and next to its number in the side menu.
2. **Given** the current question is a favorite, **When** the learner
   clicks Favorite again, **Then** the marker is removed from both the
   question view and the side menu.
3. **Given** the learner has favorited several questions and navigates
   away to a different question and back, **When** they look at the
   side menu, **Then** the favorite markers are still present for the
   duration of their session.

---

### User Story 3 — Add a question to a question set (Priority: P3)

While practicing, the learner clicks "Add to question set". A small
picker appears showing the learner's existing question sets (if any)
and an option to create a new one by name. Selecting an existing set
adds the current question to it; creating a new one creates the set and
adds the current question in a single action. Question sets persist for
the duration of the learner's session.

**Why this priority**: Useful but optional. The core practice loop and
favoriting both work without it. Question sets become much more valuable
once the future "question sets" landing screen exists; in the MVP they
exist primarily to validate the data shape and URL surface.

**Independent Test**: With Story 1 working, a user can add three
different questions to a new question set named "to review", and then
inspect the session state (via a debug endpoint or visible list) to
confirm the set exists and contains exactly those three questions.

**Acceptance Scenarios**:

1. **Given** the learner has no question sets yet, **When** they click
   "Add to question set" and enter a new name, **Then** a new set with
   that name is created and the current question is added to it.
2. **Given** the learner already has at least one question set, **When**
   they click "Add to question set", **Then** the picker lists their
   existing sets and offers a "create new" option.
3. **Given** the learner picks an existing set, **When** they confirm,
   **Then** the current question is appended to that set (without
   duplicating if it is already in the set).

---

### Edge Cases

- Pressing Prev on the first question or Next on the last question: the
  button is disabled (or, if pressed, the navigation is a no-op and the
  current question stays).
- Submitting with zero choices selected: submission is rejected and the
  learner sees a hint to pick at least one choice.
- Single-answer question where the learner submits the wrong choice: the
  wrong pick is red, the canonical correct choice is highlighted (so the
  learner sees which one was correct), explanation appears.
- Multi-answer question where the learner selects all choices: each
  correct choice is green, each incorrect choice is red, explanation
  appears.
- Reloading the page mid-practice: the question loads fresh in its
  un-submitted state; in-session data (favorites, question sets, prior
  per-question results) survives the reload for the same session.
- Closing the browser tab or session expiry: favorites and question
  sets are lost — this is an accepted limitation of the no-login MVP and
  must be visible to the user (e.g., a small "session-only" notice).
- A question with malformed data (missing explanation, missing answer
  key, zero choices) must not crash the screen; the side-menu entry and
  the main panel must show a clear "question unavailable" state and the
  learner can still navigate past it.
- Creating a question set with a name that already exists: the existing
  set is used (no duplicate sets with the same name); the learner sees
  an indication that the name was reused.

## Requirements *(mandatory)*

### Functional Requirements

**Practice loop (P1)**

- **FR-001**: System MUST present one question at a time on a practice
  screen for the AWS SAP-C02 exam, including the question number, the
  question text, the choices, and (after submission) the explanation.
  All learner-facing text — UI chrome and question content — MUST be
  rendered in Korean.
- **FR-002**: System MUST distinguish single-answer from multi-answer
  questions based on the canonical answer key, and enforce single-select
  (radio behavior) for single-answer questions and multi-select
  (checkbox behavior) for multi-answer questions in the UI.
- **FR-003**: System MUST reject submission when zero choices are
  selected and prompt the learner to pick at least one.
- **FR-004**: On submission, system MUST mark each chosen choice green
  (if it is in the canonical answer key) or red (if it is not), MUST
  also highlight any correct choice the learner missed, and MUST reveal
  the explanation.
- **FR-005**: System MUST provide Prev and Next controls that move to
  the adjacent question and MUST disable Prev on the first question and
  Next on the last question of the active pool.
- **FR-006**: System MUST display a left-side menu listing every
  question in the active pool by number as a single flat, scrollable
  list (no chapter / section / topic grouping in the MVP), MUST
  indicate the currently viewed question, and MUST allow direct
  navigation by clicking any number.
- **FR-007**: System MUST preserve per-question result state (chosen
  choices, correctness, whether submitted) for the duration of the
  session, so navigating away and back to a previously-answered question
  re-displays its result instead of resetting it.

**Favorites (P2)**

- **FR-008**: System MUST provide a Favorite toggle on the current
  question; toggling it MUST mark or unmark the question as a favorite
  for the current session.
- **FR-009**: System MUST display a small yellow favorite marker on the
  question view and next to the question's number in the side menu
  whenever the question is currently a favorite.

**Question sets (P3)**

- **FR-010**: System MUST provide an "Add to question set" action on the
  current question. The action MUST present the learner's existing
  question sets and MUST offer to create a new set by name.
- **FR-011**: System MUST allow creating a new question set by name and
  adding the current question to it in one action.
- **FR-012**: System MUST add the current question to an existing
  question set without creating a duplicate entry if the question is
  already in that set.
- **FR-013**: When the learner provides a name that matches an existing
  set, system MUST add the question to the existing set rather than
  creating a second set with the same name, and MUST surface that the
  existing set was used.

**Session, identity, and persistence**

- **FR-014**: System MUST NOT require login or any user-identifying
  account for any feature in this spec.
- **FR-015**: System MUST hold per-learner state (favorites, question
  sets, per-question results) entirely in the learner's browser
  (browser local storage), keyed by an opaque session identifier that
  the browser owns. The backend MUST remain read-only with respect to
  per-learner state: it serves questions and accepts no user-state
  writes. Consequence: state is per-browser and per-device; switching
  browsers or clearing local storage discards it.
- **FR-016**: System MUST visibly communicate to the learner that the
  current build is session-only and that their favorites and question
  sets will not survive losing the session.

**URL surface and routing**

- **FR-017**: All practice URLs MUST follow the exam-first path shape
  `/:examSlug/practice/:questionNumber` (e.g.,
  `/sap-c02/practice/12`). The exam slug is the top-level segment so
  that future exam-specific landing pages, exam-mode screens, and
  question-set screens can be added as siblings under the same exam
  (`/sap-c02/exam/...`, `/sap-c02/sets/:setId`) without colliding with
  or rewriting this MVP's URLs. Adding a new exam in the future MUST
  only require introducing a new top-level slug.
- **FR-018**: Navigating prev / next MUST update the URL so that the
  current question is shareable and reload-stable within the session.

**Data integrity**

- **FR-019**: System MUST render gracefully when a question has missing
  or malformed fields (missing explanation, missing or empty answer key,
  zero choices), showing a clear "question unavailable" state without
  breaking navigation.

**Question delivery**

- **FR-020**: System MUST serve questions through a backend REST API
  that loads the full question pool into memory at process start and
  answers requests from that in-memory copy. No per-request database
  lookup is required for question reads. A pool refresh therefore
  requires a process restart (rolling deploy), which is acceptable
  because the pool changes only when the crawler re-imports.
- **FR-021**: The backend MUST expose an OpenAPI-described REST
  endpoint for fetching the list of question numbers in the active
  pool and an endpoint for fetching a single question's full content
  (text, choices, answer key, explanation), in line with the project
  constitution's REST contract discipline.

**Out of scope (recorded here to prevent scope creep)**

- Crawling AWS SAP-C02 questions from the source site (handled in a
  separate spec; this spec assumes a seeded question pool is available).
- User accounts, login, OAuth, cross-device sync.
- Exam practice mode (timed full-length exam) and the question-sets
  landing screen — only the URL surface is reserved here.
- Statistics dashboards, analytics, progress tracking across sessions.

### Key Entities

- **Question**: A single practice item. Belongs to one exam (e.g.,
  SAP-C02). Has a number (stable within the exam), text, an ordered list
  of choices, a canonical answer key identifying which choice(s) are
  correct, and an explanation.
- **Choice**: One selectable option on a question. Has a label (e.g., A,
  B, C, D) and text.
- **AnswerKey**: The set of choice labels that are correct for a
  question. Size 1 means the question is single-answer; size > 1 means
  multi-answer.
- **Session**: An opaque, login-less identity tied to a single browser
  context. Owns the learner's favorites, question sets, and per-question
  results.
- **PerQuestionResult**: For a given session and question, records the
  learner's selected choices, whether submission has occurred, and the
  computed correctness, so the learner can revisit answered questions
  without losing their result.
- **Favorite**: A per-session marker on a question. Boolean: a question
  is either favorited in this session or not.
- **QuestionSet**: A named, ordered, deduplicated collection of
  questions belonging to one session. Names are unique within a session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can land on the practice URL,
  answer their first question, and see the correct/incorrect feedback
  plus explanation in under 30 seconds (excluding their own reading
  time), with no account creation step.
- **SC-002**: With a seeded pool of at least 50 questions, the learner
  can navigate from question 1 to question 50 using only Next and the
  side menu without any failed transition (no broken state, no lost
  result on previously-answered questions).
- **SC-003**: Multi-answer questions are scored correctly in 100% of
  cases: a learner who picks exactly the canonical answer set is shown
  fully correct, and any subset / superset / mixed selection is shown
  with per-choice green/red feedback that matches the answer key.
- **SC-004**: Within one session, favorites and question sets persist
  across at least 20 page navigations and one full-page reload in the
  same tab.
- **SC-005**: The URL of the currently displayed question is reload-
  stable: copying the URL into a new tab in the same browser loads the
  same question in its un-submitted state.
- **SC-006**: No screen in this MVP requires the user to enter an email,
  password, or any account credential.

## Assumptions

- The AWS SAP-C02 question pool is seeded into the system by a separate
  crawler/import process and is delivered to the backend as a single
  artifact (file or object) that the backend loads into memory at start.
  This spec assumes the pool is present and read-only at runtime.
- The crawled question pool contains Korean question text, choices, and
  explanations (either originally Korean or translated upstream of this
  feature). Rendering does not perform translation at runtime.
- Each question's answer-key size determines whether the UI uses
  single-select or multi-select; there is no separate "exam mode" flag in
  this MVP.
- The learner uses a modern desktop browser with JavaScript and cookies
  / browser storage enabled. Mobile-specific layout is not in scope for
  the MVP, though the layout should not actively break on a phone.
- The "session-only" persistence model is acceptable to the user for the
  first test version; this is explicitly stated in the original request.
- The URL namespace is reserved now for future exam-practice and
  question-sets surfaces; those features are not built in this spec.
