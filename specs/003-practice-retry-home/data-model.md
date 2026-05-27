# Data Model: Practice Retry & Home Buttons (003)

No new persistent data and no new entity. This feature adds a **delete** path on an
existing client localStorage map and a navigation action. Canonical definitions live
in `specs/001-question-practice/data-model.md`.

## Client-side (existing, owned by 001)

### PerQuestionResult (localStorage)

`young-certi/v1/<sessionId>/results` → `{ "<examSlug>:<number>": PerQuestionResult }`.

003 adds one operation:

| Operation | Effect |
|---|---|
| `clearResult(examSlug, number)` (new) | Deletes the `"<examSlug>:<number>"` entry. Used by "다시 풀기" so the current question returns to unattempted (no selection, no feedback, side-menu dot gray). Only the current key is removed. |

No fields change. `Favorite`, `QuestionSet`, and `CurrentQuestion` are not touched.

## Navigation

"홈으로" is a client-side route change to `/` (feature-002 home). No data read or
write; all localStorage is preserved.

## Notes

- No new validation rules or state machines.
- All state remains client-side / session-only (constitution VI).
