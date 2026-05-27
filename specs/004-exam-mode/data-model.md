# Data Model: Exam Mode (004)

Adds one new client localStorage entity. No server/contract change — exam content
and answer keys come from the existing read-only question API (001).

## Client-side (new, owned by 004)

### ExamAttempt (localStorage)

Key: `young-certi/v1/<sessionId>/exam/<examSlug>` (one active attempt per
certification).

| Field | Type | Notes |
|---|---|---|
| `examSlug` | string | e.g., `sap-c02`. |
| `questionNumbers` | int[] | The selected set (75, or all if pool < 75), chosen at random on start; fixed for the attempt so resume is stable. |
| `answers` | record | `{ [number]: string[] }` — chosen choice labels per question. |
| `startedAt` | ISO 8601 | Wall-clock start; timer derives remaining time from this. |
| `durationMinutes` | int | 180, or 210 when the optional +30 (ESL) is enabled at start. |
| `status` | `"in-progress"` \| `"submitted"` | Drives the view. |
| `submittedAt` | ISO 8601 \| null | Set on manual or auto submit. |
| `score` | `{ correct, total, percent, pass }` \| null | Computed at submit; `pass = percent >= 75`. |

State transitions: (none) → `in-progress` (start) → `submitted` (manual submit /
auto-submit on timeout). Starting a new attempt while `in-progress` prompts to
discard and replace.

## Server-side (reused, read-only, 001)

- **Question / AnswerKey** (`GET /exams/{slug}/questions/{n}`): question text,
  choices, `answerKey`, `explanation` — used to render exam questions and to grade
  at submit. No new endpoint.
- **Pool numbers** (`GET /exams/{slug}/questions`): `numbers` are the selection
  source for the random 75.

## Isolation

ExamAttempt is a separate key; exam mode never reads or writes practice
`results` / `favorites` / `sets` (FR-009).
