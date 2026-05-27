# Data Model: Control Re-placement & Exam Home-Reset (006)

**No new or changed data shape.** Layout change + one delete operation.

## Client-side (existing, owned by 004)

### ExamAttempt (localStorage)

Key: `young-certi/v1/<sessionId>/exam/<examSlug>`. Shape unchanged.

006 adds one operation:

| Operation | Effect |
|---|---|
| `reset()` / `discard()` (new on `useExamAttempt`) | Deletes the ExamAttempt key. Invoked when the learner confirms the exam 홈으로 warning, so re-entry starts a new exam. Reload still reads the key while it exists (resume retained). |

No field changes. Practice entities (`current`, results, favorites, sets) unchanged —
only control positions move on the practice screen.

## Notes

- The exam heading uses a derived position (`currentIndex + 1`), not stored.
- All state remains client-side / session-only (constitution VI).
