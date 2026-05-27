# Data Model: Question Sets Screen (007)

Adds one new client localStorage store (`SetResult`) and extends `QuestionSet`
operations. No server/contract change.

## Client-side

### QuestionSet (localStorage, owned by 001 — extended here)

`young-certi/v1/<sessionId>/sets` → `QuestionSet[]` where
`QuestionSet { id, name, createdAt, questionRefs: { examSlug, number }[] }`.

007 adds operations to `useQuestionSets` (shape unchanged):

| Operation | Effect |
|---|---|
| `deleteSet(id)` (new) | Removes the set; also clears its `SetResult` store. |
| `removeQuestion(setId, ref)` (new) | Drops one `{examSlug, number}` from the set's `questionRefs`; other sets unaffected. |

### SetResult (localStorage, NEW — owned by 007)

Key: `young-certi/v1/<sessionId>/set-results/<setId>` → `{ [number]: PerQuestionResult-like }`
(the same result shape used by practice: `selected`, `submittedAt`, `correctness`).

| Field | Type | Notes |
|---|---|---|
| key | `setId` | One store per set. |
| value | `{ [questionNumber]: { selected, submittedAt, correctness } }` | Per-question result **within this set**. |

Isolation: set solving reads/writes only the set's `SetResult` — the practice
`PerQuestionResult` and other sets' `SetResult` are never touched (FR-005/SC-003).
Deleting the set removes its `SetResult`.

## Server-side (reused, read-only)

- **Question / AnswerKey** (`GET /exams/{slug}/questions/{n}`): set questions +
  grading source. No new endpoint.

## Notes

- No new server entity/contract. All state client-side / session-only (constitution VI).
- Grading reuses the 001 `score` helper.
