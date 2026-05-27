# Feature Specification: Home / Landing Screen

**Feature Branch**: `002-home-landing`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "YoungCerti home/landing screen (feature 002). The
001-question-practice MVP is reachable only via a deep URL; the home screen was
deferred. Build the landing shown at the root `/` and the reserved `/:examSlug/`
path. Goal: let a visitor see the certification (currently AWS SAP-C02) and enter
'question practice'. Per the constitution/spec note 'Future home page will route
to question practice, exam practice, and question sets sections', only question
practice is active now; exam practice and question sets are reserved placeholders
(cards) shown disabled. No login, session-only state (constitution VI). Korean UI.
Existing 001 spec and URL (`/:examSlug/practice`) are unchanged — this is added
alongside."

## Clarifications

### Session 2026-05-27

- Q: Should root `/` redirect to the single certification's landing, or be a real multi-certification home now? → A: Build the multi-certification home now — root `/` lists certifications (currently one card, AWS SAP-C02); a per-certification landing lives at `/:examSlug/`.
- Q: Include "이어 풀기" (resume at the last viewed question) in this feature? → A: Yes — reuse feature-001's localStorage saved position.
- Q: How much should the landing display? → A: Certification name + entry cards + the total available-question count (from the read-only API); full per-question progress stats are out of scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter question practice from the landing (Priority: P1)

A visitor opens the site (root `/`) and arrives at a landing for the AWS SAP-C02
certification. The landing shows the certification name and an entry to start
solving questions. The visitor clicks "문제 풀이" and is taken into the existing
practice screen.

**Why this priority**: This is the whole point of the home screen — turning the
site from "deep-URL-only" into something a first-time visitor can actually enter.
Without it, the landing delivers no value. It is independently shippable as the MVP
of this feature.

**Independent Test**: Load `/` with no prior state, confirm the SAP-C02 landing
renders, click "문제 풀이", and confirm the practice screen loads. Delivers the
core "discover → enter" value on its own.

**Acceptance Scenarios**:

1. **Given** a visitor with no prior session, **When** they open the site root,
   **Then** they see a home listing the AWS SAP-C02 certification as a selectable
   card; selecting it opens the certification landing with a clearly clickable
   "문제 풀이" entry.
2. **Given** the SAP-C02 landing is shown, **When** the visitor activates "문제
   풀이", **Then** the existing practice screen opens and behaves exactly as in
   feature 001 (no regression).
3. **Given** the visitor reaches the practice screen via the landing, **When** they
   later return to the landing, **Then** the existing deep-entry behavior and saved
   session state are unaffected.

---

### User Story 2 - Understand which modes exist now vs later (Priority: P2)

The landing communicates the product's shape: question practice is available now,
while exam mode and question sets are coming. The visitor can see all three but is
not misled into thinking the reserved ones work yet.

**Why this priority**: Sets expectations and previews the roadmap without building
those features. Valuable for orientation, but the site is usable without it.

**Independent Test**: On the landing, confirm three entries are visible, exactly
one ("문제 풀이") is active, and the other two are visibly marked as not-yet-available
and do nothing when clicked.

**Acceptance Scenarios**:

1. **Given** the landing is shown, **When** the visitor scans it, **Then** they see
   entries for 문제 풀이 (active), 시험 모드 (reserved), and 문제집 (reserved).
2. **Given** a reserved entry (시험 모드 or 문제집), **When** the visitor clicks it,
   **Then** nothing navigates and the entry clearly indicates it is not yet
   available (e.g., a "준비 중" label / disabled state).

---

### User Story 3 - Resume where I left off (Priority: P3)

A returning visitor who previously solved questions sees an option to continue from
their last viewed question instead of starting over.

**Why this priority**: A convenience that leverages state already persisted by
feature 001. Nice-to-have; the landing is complete without it.

**Independent Test**: With a saved last-question in the same browser, load the
landing and confirm a "이어 풀기" entry appears and opens the practice screen at the
saved question. With no saved state, confirm the entry is absent (or starts at the
first question).

**Acceptance Scenarios**:

1. **Given** a saved last-viewed question exists for SAP-C02, **When** the visitor
   opens the landing, **Then** an "이어 풀기" entry is offered that resumes at that
   question.
2. **Given** no saved state, **When** the visitor opens the landing, **Then** the
   resume entry is not shown and "문제 풀이" starts from the first question.

### Edge Cases

- Visiting `/:examSlug/` with an unknown slug → graceful "해당 시험을 찾을 수 없습니다"
  state with a way back to the available certification, not a blank screen.
- The question pool/back end is temporarily unavailable → the landing still renders;
  any pool-derived detail (e.g., question count) degrades gracefully rather than
  blocking entry.
- A visitor opens a practice deep link directly → it still works and does not require
  passing through the landing.
- More certifications are added later → the landing structure must accommodate a list
  without redesign (only one certification exists today).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present a landing screen for a certification at the
  reserved per-exam path `/:examSlug/` (e.g., `/sap-c02/`), identifying the
  certification by name in Korean.
- **FR-002**: The site root `/` MUST present a multi-certification home that lists
  the available certifications as selectable cards (currently one: AWS SAP-C02).
  Selecting a certification MUST open that certification's landing (`/:examSlug/`).
  Reaching question practice from the root MUST take no more than two clicks.
- **FR-003**: The landing MUST present three labelled entries — 문제 풀이, 시험 모드,
  문제집 — with exactly one (문제 풀이) active in this release.
- **FR-004**: Activating "문제 풀이" MUST open the existing practice screen
  (`/:examSlug/practice`) with its feature-001 behavior unchanged.
- **FR-005**: The 시험 모드 and 문제집 entries MUST be visibly present but clearly
  marked as not yet available (disabled state with a "준비 중" indication) and MUST
  NOT navigate anywhere when activated.
- **FR-006**: The landing MUST require no login and MUST NOT trigger any per-user
  back-end write; all state remains client-side/session-only (constitution VI).
- **FR-007**: The landing MUST display the certification's total available-question
  count, sourced from the existing read-only question API; it MUST NOT introduce a
  new write path, and MUST render gracefully (omitting the count) when that metadata
  is unavailable. Per-question progress stats are out of scope for this feature.
- **FR-008**: When a saved last-viewed question exists for the certification, the
  landing MUST offer a resume entry that opens practice at that question; otherwise
  the resume entry MUST be absent and practice starts at the first question.
- **FR-009**: All learner-facing text on the landing MUST be in Korean.
- **FR-010**: This feature MUST be additive — existing feature-001 URLs, routes, and
  behavior (including `/:examSlug/practice` and its localStorage state) MUST remain
  unchanged.
- **FR-011**: Visiting `/:examSlug/` with an unrecognized slug MUST render a clear
  "not found" state with a path back to an available certification, not a blank or
  broken screen.

### Key Entities *(include if feature involves data)*

- **Certification (Exam)**: The certification a visitor can enter. Read-only,
  reuses feature-001's exam concept — identified by slug (e.g., `sap-c02`), with a
  display name and, optionally, a question count and version. No new persistence.
- **Saved position (CurrentQuestion)**: The last-viewed question per certification,
  already persisted client-side by feature 001; consumed (read-only) to offer resume.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor landing on the site root reaches the SAP-C02
  practice screen in at most two clicks and under 15 seconds.
- **SC-002**: On the landing, a visitor can tell at a glance which mode is usable —
  100% of test users identify 문제 풀이 as the only active entry.
- **SC-003**: 100% of activations of a reserved entry (시험 모드, 문제집) result in
  no navigation and a visible "not yet available" indication.
- **SC-004**: A returning visitor with a saved position resumes at the exact last
  question from the landing in a single click.
- **SC-005**: No screen introduced by this feature requires an email, password, or
  any account credential.
- **SC-006**: Existing feature-001 entry (`/:examSlug/practice`) and its session
  state continue to work with zero regression after this feature ships.

## Assumptions

- Two screens (clarified 2026-05-27): a multi-certification home at root `/` that
  lists certifications (currently one card, AWS SAP-C02), and a per-certification
  landing at `/:examSlug/` with the mode entry cards.
- This matches and refines the reserved URL surface in feature 001 (research D-009):
  `/` = multi-certification home, `/:examSlug/` = per-exam landing,
  `/:examSlug/practice` = practice.
- Exam mode and question sets are placeholders only here; their real functionality
  are separate future features, not part of this spec.
- Certification metadata (name, version, question count) comes from the existing
  read-only backend established in feature 001; this feature adds no backend writes
  and no new persistent entities.
- Korean UI and session-only state, reusing feature 001's client session model.
- Desktop-first with a non-breaking mobile baseline, consistent with feature 001.
