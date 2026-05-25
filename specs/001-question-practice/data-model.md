# Data Model: YoungCerti Question Practice MVP

**Feature**: 001-question-practice
**Date**: 2026-05-25

Two domains: (1) the **question pool** (server-side, read-only) and
(2) **per-learner state** (client-side, localStorage). They share no
mutable storage.

## 1. Question Pool (server-side, read-only)

Loaded once at container start from
`s3://young-certi-data-<acct>-<region>/sap-c02/questions.json` and
refreshed by ETag polling. The artifact's shape is the source of
truth for both backend and crawler.

### Entity: Exam

| Field | Type | Notes |
|---|---|---|
| `slug` | string | URL-safe identifier (e.g., `sap-c02`). Unique. |
| `displayName` | string (Korean) | "AWS SAP-C02" or similar. |
| `version` | string | Crawl batch identifier (e.g., `v2025-11-26`). |
| `crawledAt` | ISO 8601 | When the crawler produced this artifact. |
| `questions` | `Question[]` | Ordered, deduplicated. |

### Entity: Question

| Field | Type | Notes |
|---|---|---|
| `number` | int | Stable within `Exam`. Unique within an exam. Used in URL. |
| `text` | string (Korean) | Question body. |
| `choices` | `Choice[]` | Length 2–8 in practice; validated `len(choices) >= 2`. |
| `answerKey` | string[] | Subset of `Choice.label` values. `len == 1` → single-answer; `len > 1` → multi-answer. `len >= 1` is required. |
| `explanation` | string (Korean) \| null | May be missing in the crawl; if null, UI shows "해설 없음" rather than crashing. |

### Entity: Choice

| Field | Type | Notes |
|---|---|---|
| `label` | string | "A", "B", "C", "D", etc. Unique within a question. |
| `text` | string (Korean) | The selectable text. |

### Validation rules (pydantic on backend)

- `slug` matches `^[a-z0-9][a-z0-9-]*$`.
- `Question.number` is unique within `Exam.questions`.
- `Question.choices` has 2–8 items, each with a unique `label`.
- `Question.answerKey` is a non-empty subset of `Question.choices[].label`.
- Validation failure during pool refresh → reject the new artifact,
  keep the old pool, log a structured error including the offending
  question number(s).

### State transitions

The pool is immutable in-memory between refresh cycles. The only
state machine is the refresh loop:

```
   ┌─────────┐  start    ┌─────────────┐ HeadObject  ┌─────────────────┐
   │ booting │──────────▶│ serving (v1)│────────────▶│ checking ETag   │
   └─────────┘           └─────────────┘             └────┬────────────┘
                                ▲                         │
                                │ keep                    │ changed
                                │                         ▼
                                │                   ┌─────────────────┐
                                │       reject      │ download + parse│
                                └───────────────────│  + validate     │
                                                    └────┬────────────┘
                                                         │ valid
                                                         ▼
                                                   ┌─────────────────┐
                                                   │ atomic swap     │
                                                   │ serving (v2)    │
                                                   └─────────────────┘
```

## 2. Per-Learner State (client-side, localStorage)

Keyed under a single root key, `young-certi/v1/<sessionId>`. Removing
this key resets the session. No backend writes ever; the backend
exposes no per-user endpoints.

### Entity: Session

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv4 | Generated client-side on first visit, stored at `young-certi/sessionId`. |
| `createdAt` | ISO 8601 | First-touch timestamp. |

### Entity: PerQuestionResult

Keyed by `{examSlug, number}`. Persisted under
`young-certi/v1/<sessionId>/results`.

| Field | Type | Notes |
|---|---|---|
| `examSlug` | string | FK to `Exam.slug`. |
| `number` | int | FK to `Question.number`. |
| `selected` | string[] | Choice labels chosen by the learner. |
| `submittedAt` | ISO 8601 \| null | null while unsubmitted. |
| `correctness` | `"correct"` \| `"partial"` \| `"incorrect"` \| null | null while unsubmitted. Multi-answer with subset-of-correct = `"partial"`. |

### Entity: Favorite

Keyed set under `young-certi/v1/<sessionId>/favorites` as
`Set<string>` serialized as `string[]`. Each entry is
`"${examSlug}:${number}"`.

### Entity: QuestionSet

Stored under `young-certi/v1/<sessionId>/sets` as an ordered list.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv4 | Client-generated on create. |
| `name` | string | Unique within the session (case-sensitive). |
| `createdAt` | ISO 8601 | |
| `questionRefs` | `{examSlug, number}[]` | Ordered, deduplicated within the set. |

### Validation & invariants

- `name` MUST NOT be empty after trim. Adding a question with a
  trimmed-empty name → reject with inline error.
- Adding a question already in the set is a no-op (FR-012).
- Creating a set whose name matches an existing set (case-sensitive)
  uses the existing set (FR-013) and surfaces "기존 문제집에
  추가했어요" instead of "새 문제집을 만들었어요".
- `QuotaExceededError` from `localStorage.setItem`: surface
  `"브라우저 저장 공간이 가득 찼어요. 문제집을 삭제하거나 새로
  고침해 주세요."` and keep the prior in-memory state intact.

### Lifecycle

- New tab in the same browser reuses `sessionId` (localStorage is
  origin-scoped, shared across tabs).
- Private browsing on Safari: `localStorage` may throw. Hooks
  detect and fall back to an in-memory `Map`; a one-time banner
  tells the learner "이 탭 동안만 유지돼요".
- Manual reset: removing the `young-certi/sessionId` key wipes the
  session.

## Cross-domain references

The server and client share only the literal `examSlug` + question
`number` pair as a logical FK. The server never sees a `sessionId`;
the client never reads from anywhere but its own localStorage.

```
   SERVER                          CLIENT (browser)
   ──────                          ────────────────
   Exam.questions ◀───── reads ──── React app
                                          │
                                          ├── reads localStorage
                                          │     ├── Session.id
                                          │     ├── PerQuestionResult[]
                                          │     ├── Favorite (set)
                                          │     └── QuestionSet[]
                                          │
                                          └── writes localStorage
                                                (same keys)
```
