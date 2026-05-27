# Feature Specification: Exam Mode (Timed Mock Exam)

**Feature Branch**: `004-exam-mode`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Add exam mode (시험 모드): 75 questions, 180 min + 30
min. Activates the reserved 시험 모드 entry from feature 002." (Question sets is a
separate feature, 005.)

## Clarifications

### Session 2026-05-27

- Q: How should "180분 + 30분" be interpreted? → A: 180 minutes base, with an optional +30 minutes (ESL accommodation) the learner can toggle when starting the exam.
- Q: How are the 75 questions chosen? → A: Random 75 from the pool, re-randomized for each new exam attempt.
- Q: How is pass shown (the real scaled score is not reproducible)? → A: Show pass when ≥ 75% correct (informational threshold).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take a timed mock exam (Priority: P1)

The learner starts an exam from the certification landing. A fixed set of 75
questions is presented one at a time with a running countdown timer. They navigate
freely (next / previous / jump) and answer, but see **no** correct/incorrect
feedback during the exam (mirroring the real test). They submit when done — or the
exam auto-submits when time runs out — and then see their score and a review.

**Why this priority**: This is the core of exam mode and the headline value
("important" per the user). Independently shippable.

**Independent Test**: Start an exam, answer some questions with free navigation and
no feedback, submit, and see a score with a per-question review. Auto-submit on
timeout is separately verifiable by simulating elapsed time.

**Acceptance Scenarios**:

1. **Given** the certification landing, **When** the learner activates 시험 모드,
   **Then** an exam starts with 75 questions and a countdown timer showing the full
   duration.
2. **Given** an exam in progress, **When** the learner navigates between questions
   and selects answers, **Then** no correct/incorrect feedback or explanation is
   shown until the exam ends.
3. **Given** an exam in progress, **When** the learner clicks submit (and confirms),
   **Then** the exam ends and a result screen shows the score and a per-question
   review.
4. **Given** an exam in progress, **When** the countdown reaches zero, **Then** the
   exam auto-submits with whatever answers exist and shows the result.

---

### User Story 2 - Resume an in-progress exam (Priority: P2)

The learner accidentally reloads or leaves mid-exam. When they return to the exam,
it resumes with their answers intact and the timer showing the correct **remaining**
time (the clock kept running in real time).

**Why this priority**: An exam that resets on reload would be unusable for a
3-hour test. Important, but secondary to the core take-the-exam flow.

**Independent Test**: Start an exam, answer a few questions, reload, and confirm the
answers persist and the remaining time reflects elapsed real time.

**Acceptance Scenarios**:

1. **Given** an exam in progress, **When** the learner reloads or revisits exam mode,
   **Then** the same questions and their saved answers reappear and the timer shows
   the correct remaining time.
2. **Given** an exam whose time expired while the learner was away, **When** they
   return, **Then** the exam is shown as already auto-submitted with its result.

---

### User Story 3 - Review a finished exam (Priority: P3)

After submitting, the learner reviews each question: their answer vs the correct
answer, with the explanation, plus the overall score and a pass/fail indication.

**Why this priority**: Turns the exam into a learning tool. Valuable but after the
take + submit flow exists.

**Independent Test**: Submit an exam and confirm the review shows each question's
chosen vs correct answer with explanation and an overall score.

**Acceptance Scenarios**:

1. **Given** a submitted exam, **When** the learner opens the result, **Then** they
   see the overall score (number correct / total and percent) and a pass/fail
   indicator.
2. **Given** the result screen, **When** the learner reviews a question, **Then**
   their selection, the correct answer, and the explanation are shown.

### Edge Cases

- The pool has fewer than 75 questions → the exam uses all available questions and
  states the reduced count.
- Reload mid-exam → resume with saved answers and correct remaining time (US2).
- Time expires while the learner is away → on return, the exam is auto-submitted.
- Learner navigates to the home or practice mid-exam → the in-progress exam is
  preserved (the timer keeps running on wall-clock) and can be resumed.
- Starting a new exam while one is in progress → the learner is asked to confirm
  (starting fresh discards the in-progress attempt).
- Multi-answer questions follow the same selection rules as practice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an exam mode at the reserved path
  `/:examSlug/exam`, and the feature-002 landing's 시험 모드 entry MUST become active
  and link to it (replacing its "준비 중" placeholder state).
- **FR-002**: Starting an exam MUST select 75 questions at random from the
  certification's pool, re-randomized for each new attempt; if the pool has fewer
  than 75, it MUST use all available questions and surface the actual count.
- **FR-003**: During an exam, the learner MUST be able to navigate freely between
  questions (next / previous / jump to a question) and change answers, and the
  system MUST NOT reveal correct/incorrect feedback or explanations until the exam
  ends.
- **FR-004**: The exam MUST show a countdown timer for the exam duration — 180
  minutes, with an optional +30 minutes (ESL accommodation) the learner may enable
  when starting; the timer MUST be wall-clock based and persist across reload/leave
  so it resumes with the correct remaining time.
- **FR-005**: When the timer reaches zero, the system MUST auto-submit the exam with
  whatever answers exist and show the result.
- **FR-006**: The learner MUST be able to submit the exam manually at any time, with
  a confirmation step.
- **FR-007**: On submission, the system MUST show a result with the overall score
  (number correct / total, and percent), a pass indication when the score is ≥ 75%
  correct (informational), and a per-question review (chosen answer vs correct
  answer + explanation).
- **FR-008**: Exam attempt state (selected question set, answers, start time,
  duration, status, score) MUST persist client-side (localStorage); no per-user
  backend write (constitution VI).
- **FR-009**: Exam mode MUST be isolated from practice mode — taking an exam MUST
  NOT change practice per-question results, favorites, or question sets, and vice
  versa.
- **FR-010**: All exam-mode text MUST be in Korean; no login is required.
- **FR-011**: The feature MUST be additive — existing 001/002/003 behavior, URLs,
  and tests remain unchanged except for activating the 002 시험 모드 entry.

### Key Entities *(include if feature involves data)*

- **ExamAttempt** (client localStorage, new): the in-progress or finished exam —
  `examSlug`, the selected question numbers (e.g., 75), a map of chosen answers per
  question, `startedAt` (wall-clock), `durationMinutes`, `status`
  (in-progress / submitted), `submittedAt`, and the computed `score`. One active
  attempt per certification at a time.
- **Question / AnswerKey** (server, reused from 001): exam questions and grading come
  from the existing read-only question API; no new endpoint.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can start an exam, answer questions with free navigation and
  no in-exam feedback, and submit to see a score — in one continuous flow.
- **SC-002**: The timer is wall-clock accurate: after a reload, the remaining time
  reflects the real elapsed time; at zero the exam auto-submits.
- **SC-003**: The result shows correct/total and percent, a pass/fail indicator, and
  a per-question review (chosen vs correct + explanation) for 100% of questions.
- **SC-004**: Taking an exam changes no practice result, favorite, or question set
  (full isolation), verified before/after.
- **SC-005**: No screen in exam mode requires an email, password, or credential.
- **SC-006**: An in-progress exam survives a full-page reload and resumes with saved
  answers and the correct remaining time.

## Assumptions

> Scope-significant items were confirmed via `/speckit-clarify` (2026-05-27).

- **Timer duration (confirmed)**: 180 minutes base, with an optional +30 minutes
  (ESL accommodation) the learner enables when starting.
- **Question selection (confirmed)**: 75 questions at random from the pool,
  re-randomized for each new exam attempt.
- **Pass threshold (confirmed)**: 75% correct shown as pass (informational; the real
  exam uses scaled 100–1000 scoring we cannot replicate from raw answers).
- **In-exam feedback**: none until submission (mirrors the real exam); this differs
  from practice mode, which gives immediate feedback.
- **One active exam attempt per certification**; starting a new one prompts to
  discard the in-progress attempt.
- Frontend-only, additive; reuses the 001 question API and localStorage/session
  model and the 001/002 design system. No backend, contract, or dependency change.
  Korean UI, desktop-first with a non-breaking mobile baseline.
