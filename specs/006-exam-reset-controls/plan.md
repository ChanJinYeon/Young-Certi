# Implementation Plan: Control Re-placement & Exam Home-Reset

**Branch**: `006-exam-reset-controls` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-exam-reset-controls/spec.md`

## Summary

A small frontend change over 005: swap the top-right and bottom-right control slots
on both screens — **이전/다음 → top-right**, **제출 / 시험 제출 → bottom-right**
(홈으로 stays top-left, practice 문제집에 추가 stays bottom-left). The exam heading
shows the **exam position 1…N** (top-left) instead of the pool number. The exam
**홈으로 now resets the exam**: it opens a warning, and on confirm discards the
in-progress attempt and navigates home, so re-entry starts a new exam — while a plain
page reload still resumes (button-only reset; 004 reload-resume retained). No backend,
contract, or data-shape change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Vite 6 (inherited). Frontend only.

**Primary Dependencies**: Existing only — react-router, the existing confirm-modal pattern, design tokens. **No new dependency.**

**Storage**: `ExamAttempt` (004) unchanged in shape. New: a `reset()`/`discard()` on `useExamAttempt` that deletes the attempt key (used by the exam 홈으로). Reload still reads the key (resume retained).

**Testing**: vitest + RTL — control positions on practice/exam (이전/다음 top-right, submit bottom-right) + still functional; exam heading = position 1…N; exam 홈으로 shows warning → confirm discards + navigates + re-entry shows start screen; cancel keeps exam; reload still resumes. Update existing practice-page / exam-page tests; keep behavior assertions.

**Target Platform**: Modern desktop; non-breaking mobile baseline.

**Project Type**: Web application (frontend SPA change only).

**Performance Goals**: No new fetches; layout + one delete action.

**Constraints**: Reversal is button-only — reload-resume (004 SC-006) retained (FR-008). Behavior otherwise unchanged (FR-003). Mobile non-breaking; ≥44px; visible focus. Korean labels; no login.

**Scale/Scope**: Edits to PracticePage, ExamPage, useExamAttempt (+ reset). ~150–250 LOC frontend, no new entity.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

- **I / II / VII**: no infra/crawler change. PASS (N/A).
- **III. Cost-Aware / No RDBMS**: no backend/storage change. PASS.
- **IV. Incremental Learning Steps**: one cohesive feature (exam/practice control + exam reset). PASS.
- **V. REST Contract Discipline**: no contract change. PASS.
- **VI. Stateless / Session-Only**: client-side only; reset deletes a local key; no per-user backend write. PASS.

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/006-exam-reset-controls/
├── plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

(No `contracts/` — no API change.)

### Source Code (repository root)

```text
frontend/src/
├── pages/
│   ├── PracticePage.tsx   # EDIT — top row: 홈으로 / 이전·다음; bottom row: 문제집에 추가 / 제출·다시 풀기
│   └── ExamPage.tsx        # EDIT — top row: 홈으로 / 이전·다음; bottom row: 시험 제출; heading = position 1…N;
│                           #        홈으로 → warning modal → confirm: reset attempt + navigate "/"
├── hooks/
│   └── useExamAttempt.ts   # EDIT — add reset()/discard() that deletes the ExamAttempt key
frontend/tests/
├── practice-page.test.tsx  # UPDATE — new control positions, behavior unchanged
└── exam-page.test.tsx      # UPDATE — positions, heading 1…N, home-reset warning + discard + new-start, reload-resume kept
```

**Structure Decision**: Pure layout reshuffle + one new `reset()` on the exam hook +
a 홈으로 warning on the exam. Reuse the existing confirm-modal pattern (the 시험 제출
dialog) for the 홈으로 warning. Practice 홈으로 stays a plain navigation (no attempt to
reset there).

## Eng Review (plan-eng-review summary)

- **Control rows (both screens)**: keep two flex `justify-between` rows around the
  question; move 이전/다음 into the top row (right) and the submit action into the
  bottom row (right). 홈으로 (top-left) and 문제집에 추가 (bottom-left, practice)
  unchanged. Handlers unchanged — JSX moves only (FR-001/003).
- **Exam heading**: render `currentIndex + 1` (position) instead of `currentNumber`
  (pool) — matches the left list (FR-004). Pure label change.
- **Exam home-reset**: 홈으로 opens a warning (reuse the confirm-modal pattern). On
  confirm → `examAttempt.reset()` (delete the localStorage key) then `navigate("/")`;
  on cancel → close, exam continues (FR-005/006). `useExamAttempt` gains `reset()`.
- **Reload-resume retained**: only the 홈으로 button deletes the attempt; mounting/
  reload still reads it (FR-008/SC-005) — no change to the resume/auto-submit effects.
- **Re-entry after reset**: with the attempt deleted, `/:examSlug/exam` shows the
  start screen (FR-007).
- **No regression**: practice 홈으로 unchanged; submit/retry/prev-next behaviors
  unchanged; tests updated for positions + the new warning flow.

Test coverage: positions (both), exam heading 1…N, home warning → confirm discards +
navigates + re-entry start, cancel keeps exam, reload still resumes. **Verdict:
CLEAR — no blockers; main care is keeping reload-resume while the button resets.**

## Design Review (plan-design-review summary)

Reuses the 005/001 system; no new visual language.

- **Control rows**: same ghost/primary tokens; primary submit now bottom-right,
  prev/next ghost top-right. Reading/tab order stays sensible (home → prev/next →
  question → add-to-set → submit).
- **Exam home warning**: reuse the centered confirm modal (Esc/backdrop/focus-trap)
  with clear copy — "홈으로 가면 시험이 초기화됩니다. 계속할까요?" — destructive
  confirm styled as the primary action, cancel as ghost.
- **Exam heading**: "문제 {position}" 1…N; consistent with the left list's active item.
- **a11y**: warning modal traps focus + Esc/cancel; controls keep focus rings + 44px;
  mobile rows stack without overlap.
- **Anti-slop**: no new decoration; reuses existing patterns.

**Verdict: CLEAR — layout swap + a reused warning modal; no new design debt.**

## Complexity Tracking

No constitution violations — not applicable.
