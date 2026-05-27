# Data Model: Practice & Exam Screen Layout (005)

**No new or changed data.** This is a presentation/layout refactor. All entities are
reused unchanged from prior features:

- Practice: per-question `current`, `PerQuestionResult`, `Favorite`, `QuestionSet`
  (001/003) — read/written exactly as before; only control positions move.
- Exam: `ExamAttempt` (004) — read/written as before; the left list maps **exam
  position 1…N** to `attempt.questionNumbers[position-1]` (a derived index mapping,
  not stored). Answered status = `attempt.answers[number]` present.

No server/contract change. No new localStorage key. All state remains client-side /
session-only (constitution VI).
