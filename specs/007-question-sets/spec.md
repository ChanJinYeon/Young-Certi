# Feature Specification: Question Sets Screen

**Feature Branch**: `007-question-sets`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: build the 문제집 (question sets) feature — activate the
reserved 문제집 entry from feature 002 so the learner can see their saved sets, open
a set and solve the questions in it, and manage sets. (Sets are already created via
001's "문제집에 추가".)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See and open my question sets (Priority: P1)

The learner opens the 문제집 entry from the certification landing and sees a list of
the sets they created (each with its name and question count). Selecting a set opens
it.

**Why this priority**: The core of the feature — without a way to see and open sets,
the existing "문제집에 추가" has no payoff. Independently shippable.

**Independent Test**: With one or more saved sets, open the 문제집 screen, confirm
each set shows its name and count, and selecting one opens that set.

**Acceptance Scenarios**:

1. **Given** saved sets exist, **When** the learner opens the 문제집 screen, **Then**
   each set is listed with its name and the number of questions it contains.
2. **Given** the set list, **When** the learner selects a set, **Then** that set
   opens (its questions become available to solve).
3. **Given** no sets exist yet, **When** the learner opens the 문제집 screen, **Then**
   an empty state explains that sets are created from "문제집에 추가" on the practice
   screen.

---

### User Story 2 - Solve the questions in a set (Priority: P1)

After opening a set, the learner solves its questions one at a time — the same
practice experience (choices, green/red feedback, explanation, prev/next) but scoped
to just that set's questions.

**Why this priority**: Solving a set is the reason to make sets. Core value.

**Independent Test**: Open a set with N questions, confirm you can move through the N
questions (prev/next stays within the set), answer, and see feedback like practice.

**Acceptance Scenarios**:

1. **Given** an opened set with N questions, **When** the learner solves a question,
   **Then** they see the same green/red feedback + explanation as practice, and
   prev/next move only within the set's N questions.
2. **Given** a set question the learner answered before in practice, **When** it is
   shown in the set, **Then** its saved result is consistent (results are shared by
   question — answering in a set and in practice refer to the same question).

---

### User Story 3 - Manage sets (Priority: P2)

The learner can delete a set they no longer want, and remove a single question from a
set.

**Why this priority**: Housekeeping; useful but secondary to viewing/solving.

**Independent Test**: Delete a set and confirm it disappears from the list; remove a
question from a set and confirm the set's count decreases.

**Acceptance Scenarios**:

1. **Given** the set list, **When** the learner deletes a set (with a confirm),
   **Then** the set is removed and no longer listed.
2. **Given** an opened set, **When** the learner removes a question from it, **Then**
   that question is dropped from the set and the count decreases; other sets are
   unaffected.

### Edge Cases

- A set references a question number that is not in the current pool → that item is
  shown as unavailable/skipped without breaking navigation within the set.
- The last question is removed from a set, leaving it empty → the set shows an empty
  state (or is offered for deletion); navigation does not break.
- Opening a set with one question → prev/next are disabled appropriately.
- Same question added to multiple sets → each set tracks it independently; solving it
  updates the shared per-question result once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a question-sets screen at the reserved path
  `/:examSlug/sets`, and the feature-002 landing's 문제집 entry MUST become active and
  link to it (replacing its "준비 중" placeholder).
- **FR-002**: The sets screen MUST list every saved set for the certification with
  its name and question count; an empty state MUST explain that sets are created via
  "문제집에 추가" on the practice screen.
- **FR-003**: Selecting a set MUST open it for solving (e.g., at
  `/:examSlug/sets/:setId`), presenting its questions one at a time.
- **FR-004**: Solving within a set MUST reuse the practice experience — choice
  selection (single/multi), green/red feedback, explanation — with prev/next scoped
  to the set's questions only.
- **FR-005**: Per-question results MUST be shared by question identity — answering a
  question in a set and in practice refer to the same saved result (no separate
  per-set result store).
- **FR-006**: The learner MUST be able to delete a set (with a confirm) and remove a
  single question from an opened set; these MUST affect only the targeted set.
- **FR-007**: A set referencing a question missing from the current pool MUST degrade
  gracefully (item marked unavailable/skipped) without breaking set navigation.
- **FR-008**: This feature MUST add no backend, contract, or new persistent entity
  beyond extending the existing `QuestionSet` operations; sets remain in localStorage
  (constitution VI). Korean UI; no login.

### Key Entities *(include if feature involves data)*

- **QuestionSet** (client localStorage, owned by 001): `id`, `name`, `createdAt`,
  `questionRefs[{examSlug, number}]`. 007 adds **delete-set** and **remove-question**
  operations to the existing `useQuestionSets` hook; no shape change.
- **PerQuestionResult / Question** (001): reused read — set solving reads questions
  from the existing API and shares the practice per-question results (FR-005).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the landing, the learner reaches their question sets in one click,
  and each set shows its name and count.
- **SC-002**: Opening a set lets the learner solve its questions with practice-style
  feedback, and prev/next never leave the set (stay within its N questions).
- **SC-003**: Answering a question in a set and viewing the same question in practice
  show the same result (shared per-question result), 100% of the time.
- **SC-004**: Deleting a set removes it from the list; removing a question decreases
  that set's count — with no effect on other sets (verified).
- **SC-005**: With no sets, the screen shows a clear empty state pointing to "문제집에
  추가"; no crash or blank screen.
- **SC-006**: No login or credential is required; existing 001–006 behavior is
  unchanged except activating the 002 문제집 entry.

## Assumptions

> Scope-significant items (marked) should be confirmed in /speckit-clarify.

- **Solve model (confirm in clarify)**: opening a set reuses the practice paradigm
  scoped to the set's questions (one-at-a-time, feedback, prev/next within the set) —
  not a read-only list. Likely a set-scoped variant of the practice screen.
- **Results shared (confirm in clarify)**: set solving shares the practice
  per-question results (same question identity), rather than a separate per-set
  result.
- **Management (confirm in clarify)**: delete-set and remove-question are in scope;
  rename-set is deferred unless requested.
- Sets are created by 001's "문제집에 추가" (already shipped); 007 only adds the
  viewing/solving/management screen.
- Frontend-only, additive; reuses 001 ChoiceList/ResultFeedback/SideMenu patterns,
  the question API, localStorage, and design tokens. No backend/contract/dependency
  change. Korean UI; desktop-first, non-breaking mobile.
