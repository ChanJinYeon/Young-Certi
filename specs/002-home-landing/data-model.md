# Data Model: Home / Landing Screen (002)

This feature introduces **no new persistent data**. It reads existing server
metadata (read-only) and one existing client localStorage value. Listed here for
completeness; canonical definitions live in
`specs/001-question-practice/data-model.md`.

## Server-side (read-only, reused from 001)

### ExamSummary (from `GET /exams`)

Used by the **home** to list certifications.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | e.g., `sap-c02`. Routes to `/:slug/`. |
| `name` / `displayName` | string | Korean display name on the cert card. |
| `version` | string | e.g., `v2025-11-26.q476` (optional display). |

### Question pool summary (from `GET /exams/{slug}/questions`)

Used by the **landing** for the total count.

| Field | Type | Notes |
|---|---|---|
| `examSlug` | string | Echo of slug. |
| `total` | int | Total available questions — shown on the landing. |
| `numbers` | int[] | Question numbers (not needed by the landing; first number is the practice default). |

No new fields, no new endpoints.

## Client-side (read-only consumption, owned by 001)

### CurrentQuestion (localStorage, owned by 001)

`young-certi/v1/<sessionId>/current` → `{ [examSlug]: number }`. 002 **reads** this
to decide whether to show "이어 풀기" and which question to resume at. 002 does not
write it (PracticePage continues to own writes).

## Notes

- No state machine, no validation rules introduced by 002.
- All learner state remains client-side / session-only (constitution VI).
- The home/landing are stateless views over server metadata + one read of 001
  client state.
