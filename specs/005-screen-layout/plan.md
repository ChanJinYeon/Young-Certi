# Implementation Plan: Practice & Exam Screen Layout

**Branch**: `005-screen-layout` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-screen-layout/spec.md`

## Summary

A frontend layout refactor over existing screens. Practice and exam controls move to
**control rows around the question** — above: 홈으로 (left) / 제출·다시 풀기 (right);
below: 문제집에 추가 (left) / 이전·다음 (right). The exam screen gains a **left
question-list sidebar** reusing the practice side-menu pattern (numbered 1…N by exam
position, status + active highlight, click-to-jump) and a **홈으로** control that
preserves the in-progress attempt. The certification landing drops the now-redundant
**이어 풀기** button. No behavior, backend, contract, or data change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Vite 6 (inherited). Frontend only.

**Primary Dependencies**: Existing only — react-router (홈으로 links), the 001 SideMenu pattern, design tokens. **No new dependency.**

**Storage**: None new. Reads the same client state (current question, exam attempt, results/favorites/sets) and read-only API as before.

**Testing**: vitest + RTL — practice control positions + still-functional; exam left sidebar (1…N, jump, status, active), 홈으로 preserves attempt, corner controls; landing no longer renders 이어 풀기. Reuse/adjust existing practice-page / exam-page / exam-landing tests; all stay green.

**Target Platform**: Modern desktop browsers; non-breaking mobile baseline.

**Project Type**: Web application (frontend SPA layout change only).

**Performance Goals**: No new fetches; pure layout/markup change.

**Constraints**: Behavior must not regress (FR-004/009). Corner = rows above/below the question (clarified), not absolute corners. Mobile non-breaking; ≥44px targets; visible focus. Korean labels; no login.

**Scale/Scope**: Edits to PracticePage, ExamPage, ExamLandingPage; generalize/reuse SideMenu for the exam list (or a thin exam variant). ~200–350 LOC frontend, no new entity.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

- **I / II / VII**: no infra/crawler change. PASS (N/A).
- **III. Cost-Aware / No RDBMS**: no backend/storage change. PASS.
- **IV. Incremental Learning Steps**: one feature (layout); question sets is separate (006). PASS.
- **V. REST Contract Discipline**: no contract change. PASS.
- **VI. Stateless / Session-Only**: client-side only; no per-user backend write. PASS.

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/005-screen-layout/
├── plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

(No `contracts/` — no API change.)

### Source Code (repository root)

```text
frontend/src/
├── pages/
│   ├── PracticePage.tsx        # EDIT — controls into above/below rows around the question card
│   ├── ExamPage.tsx            # EDIT — left sidebar list, corner controls, add 홈으로
│   └── ExamLandingPage.tsx     # EDIT — remove the 이어 풀기 button (FR-012)
├── components/
│   ├── SideMenu.tsx            # REUSE/GENERALIZE — drive the exam left list (1…N positions, answered status)
│   └── ExamNavigator.tsx       # RETIRE or repurpose — replaced by the left sidebar list
frontend/tests/
├── practice-page.test.tsx      # UPDATE — control positions, behavior unchanged
├── exam-page.test.tsx          # UPDATE — left sidebar 1…N, 홈으로 preserves attempt, corner controls
└── exam-landing.test.tsx       # UPDATE — 이어 풀기 removed
```

**Structure Decision**: Pure layout refactor. Practice/exam wrap the question in an
above-row and below-row of controls. The exam top navigator grid is replaced by a
**left sidebar** built from the SideMenu pattern — preferably by generalizing the
existing `SideMenu` (accept position labels 1…N + an "answered" status set, make the
favorite star optional) so practice and exam share one component; `ExamNavigator` is
retired (or kept as a thin wrapper). The landing simply drops the resume `Link`.

## Eng Review (plan-eng-review summary)

- **Shared list component**: generalize `SideMenu` to cover both — props for the item
  label (question number for practice, exam position 1…N for exam), a status map
  (correct/incorrect dot for practice; answered/unanswered for exam), optional
  favorites. This avoids a divergent second list and keeps the "like practice"
  requirement literal (FR-005). `ExamNavigator` (top grid) is removed.
- **Exam position vs pool number**: the sidebar shows 1…N (exam position i ↔
  `attempt.questionNumbers[i-1]`); selecting position i sets the current index. No
  data change — just a label/index mapping.
- **Control rows**: both screens render an above-row (홈으로 left / 제출·다시 풀기 or
  시험 제출 right) and below-row (문제집에 추가 left / 이전·다음 right) flexed
  `justify-between`; favorite stays in the practice card header. Behavior handlers are
  unchanged — only JSX position moves (FR-004/009).
- **Exam 홈으로**: a `Link`/navigate to `/` that does not mutate the ExamAttempt, so
  the wall-clock timer + answers resume on return (FR-006/SC-003).
- **Landing**: remove the `currentQuestion` resume `Link` block (FR-012); 문제 풀이
  already resumes.
- **No regression**: existing tests updated for new positions/markup; behavior
  assertions unchanged.

Test coverage: practice/exam control positions + functionality, exam sidebar 1…N +
jump + status + 홈으로-preserves-attempt, landing-no-resume. **Verdict: CLEAR — no
blockers; main care is keeping behavior/test assertions intact while markup moves.**

## Design Review (plan-design-review summary)

Reuses the 001 design system; no new visual language.

- **Control rows**: above/below the question card, `flex justify-between`, reusing the
  shared ghost/primary button tokens (the inline-flex-centered ones). Primary action
  (제출 / 시험 제출) emphasized top-right; 홈으로 a quiet ghost top-left.
- **Exam left sidebar**: identical look to practice SideMenu (flat scrollable list,
  status dot, active row with left border, 44px rows), labels 1…N, answered = filled
  dot. Consistency is the goal (the user asked for "like practice").
- **Landing**: removing 이어 풀기 declutters; 문제 풀이 stays the single primary entry.
- **a11y**: control rows keep tab order logical (home → submit → question → add-to-set
  → prev/next is acceptable; DOM order can stay reading-order while CSS places
  corners — keep DOM order sensible for keyboard); visible focus; ≥44px; mobile stacks
  rows without overlap (no absolute corners — clarified).
- **Anti-slop**: no absolute-positioned floating controls, no new decoration.

**Verdict: CLEAR — layout reshuffle within the existing system; the one structural
change (shared SideMenu for exam) is scoped above.**

## Complexity Tracking

No constitution violations — not applicable.
