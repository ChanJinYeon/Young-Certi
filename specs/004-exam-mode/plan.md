# Implementation Plan: Exam Mode (Timed Mock Exam)

**Branch**: `004-exam-mode` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-exam-mode/spec.md`

## Summary

Add a timed mock-exam mode at `/:examSlug/exam`, activating the reserved 시험 모드
entry from 002. Starting an exam picks **75 random questions**, runs a **180-minute
(optional +30 ESL)** wall-clock countdown, presents questions with free navigation
and **no in-exam feedback**, then on manual submit or timeout shows a **score
(≥75% = pass, informational)** with a per-question review. The whole attempt
(`ExamAttempt`) lives in localStorage and resumes across reload. Frontend-only:
reuses the existing read-only question API for content + answer keys; no backend,
contract, or dependency change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Vite 6 (inherited). Frontend only.

**Primary Dependencies**: Existing only — react-router (route `/:examSlug/exam`), @tanstack/react-query (fetch + cache the selected questions, incl. answerKey/explanation for grading), zod, Tailwind 4 tokens. **No new dependency.** Timer via `setInterval` over a stored `startedAt` (wall-clock); no timer library.

**Storage**: New localStorage entity `ExamAttempt` (one active per certification): `examSlug`, selected `questionNumbers[]`, `answers` map, `startedAt`, `durationMinutes`, `status`, `submittedAt`, `score`. Read-only consumption of the 001 question API for content + answer keys. No backend write (constitution VI). Isolated from practice `results`/`favorites`/`sets`.

**Testing**: vitest + RTL — selection (75 / fewer), no-feedback during exam, free nav, manual submit + confirm, auto-submit on timeout (fake timers + stored startedAt in the past), resume after reload, scoring + pass threshold, review render, isolation from practice. One Playwright happy-path (start → answer a few → submit → result). Reuses 001/002 harness; existing tests stay green.

**Target Platform**: Modern desktop browsers; non-breaking mobile baseline.

**Project Type**: Web application (frontend SPA change only).

**Performance Goals**: Timer tick ≤ 1s drift over the session (wall-clock derived, not accumulated). Selected questions fetched lazily as visited and cached; all 75 ensured fetched before grading at submit.

**Constraints**: Additive — 001/002/003 unchanged except activating the 002 시험 모드 entry (FR-011). No in-exam feedback (FR-003). Wall-clock timer survives reload (FR-004). No login, session-only (constitution VI). Korean UI.

**Scale/Scope**: ~2–3 new pages/views (exam-taking, result/review; a start/confirm state) + 1 hook (`useExamAttempt`) + small primitives (timer, question navigator). ~600–900 LOC frontend. Reuses ChoiceList for selection (feedback suppressed).

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.*

- **I / II / VII**: no infra/crawler change. PASS (N/A).
- **III. Cost-Aware / No RDBMS**: no backend/storage service; client localStorage only. PASS.
- **IV. Incremental Learning Steps**: one feature (exam mode); question sets explicitly deferred to 005. PASS.
- **V. REST Contract Discipline**: no new endpoint; reuses 001 OpenAPI. PASS (no contract change).
- **VI. Stateless / Session-Only**: no login; ExamAttempt is client-side; no per-user backend write. PASS.

No violations → Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-exam-mode/
├── plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

(No `contracts/` — reuses 001's OpenAPI unchanged.)

### Source Code (repository root)

```text
frontend/src/
├── pages/
│   └── ExamPage.tsx              # NEW — route "/:examSlug/exam": start → in-progress → result (status-driven)
├── components/
│   ├── ExamTimer.tsx             # NEW — wall-clock countdown (aria-live polite; amber/rose as time runs low)
│   ├── ExamNavigator.tsx         # NEW — question grid (answered/unanswered), jump
│   └── ExamResult.tsx            # NEW — score + pass badge + per-question review
├── hooks/
│   └── useExamAttempt.ts         # NEW — start/answer/submit/resume + score; ExamAttempt localStorage
├── components/ChoiceList.tsx     # REUSE — selection without feedback (submitted=false in exam)
├── components/QuestionSetPicker.tsx  # REUSE pattern — submit confirm modal (focus trap)
├── pages/ExamLandingPage.tsx     # EDIT (002) — activate 시험 모드 EntryCard → link /:examSlug/exam
└── App.tsx                       # EDIT — add route "/:examSlug/exam"
frontend/tests/
├── exam.test.tsx                 # NEW — selection, no-feedback, submit, auto-submit, resume, scoring, isolation
└── e2e/exam.spec.ts              # NEW — start → answer → submit → result happy-path
```

**Structure Decision**: Single route `/:examSlug/exam` with a status-driven view
(no attempt → start/confirm; in-progress → exam UI; submitted → result/review). One
`useExamAttempt` hook owns the `ExamAttempt` localStorage entity and grading.
Reuses ChoiceList (feedback suppressed) and the 002 modal pattern for the submit
confirm. Activating the 002 시험 모드 entry is the only edit to prior features.

## Eng Review (plan-eng-review summary)

Locked decisions:

- **ExamAttempt + useExamAttempt**: a dedicated localStorage key
  (`young-certi/v1/<sessionId>/exam/<examSlug>`) holding the selected 75 numbers,
  answers, `startedAt`, `durationMinutes`, `status`, `submittedAt`, `score`. Fully
  isolated from practice results/favorites/sets (FR-009/SC-004).
- **Timer = wall-clock**: remaining = `startedAt + durationMinutes*60s - now`,
  recomputed each tick (not accumulated), so reload/leave resume correctly (FR-004/
  SC-002/US2). On mount, if `status==="in-progress"` and remaining ≤ 0 → auto-submit
  immediately (covers "time expired while away").
- **Selection**: on start, shuffle the pool's `numbers` and take 75 (or all if
  fewer); store the chosen set so resume is stable (FR-002).
- **No in-exam feedback**: ExamPage renders ChoiceList with `submitted={false}`
  always and records selections into ExamAttempt; ResultFeedback/explanations appear
  only on the result view (FR-003).
- **Grading**: at submit, ensure all selected questions are fetched (react-query
  cache), grade client-side with the 001 `score` helper against each `answerKey`;
  compute correct/total, percent, pass = percent ≥ 75 (FR-007).
- **Submit**: manual submit opens a confirm (reuse the modal/focus-trap pattern);
  auto-submit on timeout skips the confirm.
- **Start-new guard**: starting an exam while one is in-progress prompts to discard
  (edge case).
- **No regression / isolation**: only edits are the new files + activating the 002
  entry + the new route; 001/002/003 behavior and tests unchanged.

Test coverage: selection (75/fewer), no-feedback, free nav, manual+confirm submit,
auto-submit on timeout (fake timers + past `startedAt`), resume after reload,
scoring + 75% pass, review render, practice isolation; e2e happy-path. **Verdict:
CLEAR — no blockers. Main risk is timer/auto-submit correctness, covered by
fake-timer tests.**

## Design Review (plan-design-review summary)

New screens reuse the 001 design system (Pretendard/JetBrains Mono, zinc surfaces,
emerald/rose/amber semantics, rounded-lg cards, shadow, focus ring, 44px targets).
Decisions:

- **Exam-taking view**: a calm, focused layout — question card centered in a content
  column, a persistent header with the **countdown timer** (mono, zinc → amber under
  ~10 min → rose under ~2 min) and a "제출" action; a compact question **navigator**
  (number grid showing answered vs unanswered, current highlighted) for free jumps;
  prev/next. No correct/incorrect coloring (distinct from practice).
- **Submit confirm**: centered modal (reuse 002 picker pattern) — "제출하시겠어요? 남은
  X문항 미답" — Esc/backdrop/focus-trap.
- **Result view**: a prominent score block (big percent + emerald "합격"/zinc "불합격"
  badge + correct/total), then a per-question review list reusing the practice
  result treatment (chosen vs correct + explanation), each linkable/expandable.
- **a11y**: timer in an `aria-live="polite"` region (not assertive — must not
  interrupt every second; announce at coarse intervals/threshold changes); navigator
  buttons labeled; modal focus-trap; color never the only signal (answered state +
  pass both carry text/icon).
- **Anti-slop**: no gauge gimmicks, no 3-column filler, no decorative blobs; the
  timer is the one bold element by intent.

**Verdict: CLEAR — reuses 001 system; the only net-new pattern is the timer, scoped
above.** (A full `design-review` live audit runs in the final UI/UX large-task.)

## Complexity Tracking

No constitution violations — not applicable.
