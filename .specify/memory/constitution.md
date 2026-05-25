<!--
SYNC IMPACT REPORT
==================
Version change: (initial) → 1.0.0
Modified principles: N/A (first ratification)
Added sections:
  - Core Principles (I–VII)
  - Technology Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates will resolve
     from these principles at plan time; no structural edit required.
  ✅ .specify/templates/spec-template.md — No edits needed; spec scope (user
     value, no implementation detail) is compatible with new principles.
  ✅ .specify/templates/tasks-template.md — Compatible; principle IV
     (Incremental Learning Steps) is enforced by task authoring discipline,
     not template structure.
  ✅ .specify/templates/checklist-template.md — Compatible; no edits needed.
Follow-up TODOs: none.
-->

# young-certi Constitution

`young-certi` is a portfolio project: a certification (initially AWS SAP-C02)
question-practice site whose primary signature is **infrastructure operations
craft** (Terraform + ephemeral EKS + Karpenter + CI/CD on AWS), with the
application layer kept intentionally simple. The constitution exists so that
every later decision (spec, plan, task) snaps back to that signature instead of
drifting into generic web-app work.

## Core Principles

### I. IaC-Only (NON-NEGOTIABLE)

Every AWS or Kubernetes resource MUST be created, modified, and destroyed
through Terraform (and, where applicable, Helm/Kustomize manifests under
version control). Console clicks, `aws` CLI mutations, and `kubectl apply -f`
of untracked manifests are forbidden outside of read-only inspection. If a
resource cannot be expressed in code, the gap MUST be recorded in
Complexity Tracking with a remediation plan.

**Rationale:** The portfolio claim "I operated this" is only credible if
`terraform apply` from a fresh checkout fully reproduces production. Console
drift destroys that claim and is the single most common red flag reviewers
look for.

### II. Ephemeral Cluster by Default

The EKS control plane and worker nodes MUST be treated as ephemeral compute:
created on demand by a CI job and destroyed when not needed. There is no
"always-on" environment. Persistent state (raw crawled data, application
data, terraform state, logs needed across runs) MUST live outside the
cluster (S3, DynamoDB on-demand, or similar pay-per-request services). Any
component whose loss on cluster teardown would corrupt the system MUST be
explicitly justified.

**Rationale:** Ephemeral clusters force a clean separation between compute
and state, which is the operational lesson the portfolio is meant to
demonstrate. It also keeps cost near zero between demos.

### III. Cost-Aware Architecture

Every infrastructure decision MUST cite a cost impact. Concrete defaults:

- AWS Budget alert configured before any EKS cluster is created.
- Worker nodes default to Spot via Karpenter; on-demand is opt-in with reason.
- Managed RDBMS (RDS, Aurora) is **forbidden**. Use SQLite on EBS, DynamoDB
  on-demand, or in-pod storage. Any future request to re-introduce a managed
  RDBMS requires a constitution amendment.
- A scheduled-shutdown or destroy mechanism MUST exist for any resource that
  bills while idle.
- Public S3 egress, NAT Gateway, and ALB hours are line items to be defended
  in the plan, not background assumptions.

**Rationale:** The project is funded by the author. Cost discipline is also
itself a portfolio signal — reviewers read a $4/month bill as evidence of
real architectural judgment.

### IV. Incremental Learning Steps

Every `tasks.md` MUST decompose work into the smallest reviewable units that
each teach or demonstrate a single concept. A task that bundles "set up VPC,
EKS, Karpenter, ArgoCD, app deployment" is a constitution violation; the
correct shape is one task per concept, each runnable and verifiable on its
own. Pull requests follow the same rule: one concept per PR.

**Rationale:** This is a learning portfolio. Large compound tasks hide the
learning and produce diffs that cannot be reviewed (by the author or anyone
else). Small steps also make `/task-run` resumable across sessions.

### V. REST Contract Discipline

All HTTP APIs MUST follow REST resource semantics (nouns, proper verbs,
correct status codes) and MUST be described by a versioned OpenAPI document
checked into the repo. A single shared error envelope (`{ code, message,
details?, requestId }`) is mandatory for all 4xx/5xx responses; ad-hoc error
shapes are a contract violation. Contract tests against the OpenAPI document
gate merges to `main`.

**Rationale:** The user explicitly asked for REST and a unified error
format. Making the OpenAPI doc load-bearing prevents the contract from
silently drifting once implementation starts.

### VI. Stateless App, Session-Only State

The application MUST be stateless at the process level (12-factor) and MUST
NOT implement user accounts, OAuth, or persistent per-user history.
Per-user progress (current session, attempted questions, wrong-answer
notebook, exam-mode state) is held in a server-side ephemeral session or in
the client, never in a long-lived user record. Liveness/readiness probes
and graceful shutdown are required for every container.

**Rationale:** Removes a class of concerns (auth, PII, account recovery,
GDPR) that would dilute the infrastructure focus, while keeping the UX
meaningful (oh-dap-note, exam mode) per the agreed app scope.

### VII. Ethical Data Sourcing

The crawler that seeds the question bank MUST: respect `robots.txt`, send a
truthful `User-Agent` identifying the project, throttle to a conservative
request rate with exponential backoff on 4xx/5xx, and run from a single
machine (no distributed scraping). Raw crawled artifacts MUST stay in a
**private** store; only derived, transformed content may be served publicly,
and only if redistribution is lawful. The crawler code is the portfolio
artifact; the upstream data is not.

**Rationale:** A public portfolio repo that brags about scraping a
copyrighted question bank is a self-inflicted wound. The signal is the
*engineering* of the crawler (rate-limit handling, idempotency, resumability),
not the data it pulls.

## Technology Stack & Constraints

- **Frontend:** React + TypeScript + Tailwind CSS 4. SPA, served as static
  assets from S3+CloudFront or from an in-cluster nginx.
- **Backend:** A single REST API service. Language/runtime chosen in the
  first feature plan; whatever is chosen MUST produce a small container
  image and start cold in < 5 s.
- **Persistence:** No managed RDBMS (see Principle III). Default to SQLite
  on an EBS PVC or DynamoDB on-demand. Raw scraped data lives in S3
  (private, versioned).
- **Infrastructure:** AWS only. EKS (ephemeral) with Karpenter and Spot
  node pools. Terraform for all AWS resources; Helm or Kustomize for
  in-cluster workloads. Remote Terraform state in S3 with DynamoDB lock
  table.
- **CI/CD:** GitHub Actions, authenticated to AWS via GitHub OIDC (no
  long-lived AWS access keys, ever). Pipeline stages: lint → unit test →
  contract test → container build → image scan (trivy or grype) →
  terraform plan → optional terraform apply / cluster bootstrap.
- **Observability:** Structured JSON logs from day one; OpenTelemetry
  traces and metrics encouraged but not required for the MVP. At minimum:
  health endpoints, request logs with `requestId`, and a basic Grafana or
  CloudWatch dashboard once a cluster is running.
- **Local dev:** All local execution runs in `docker compose` per the
  project memory. No "works on my host" workflows.

## Development Workflow & Quality Gates

- **Spec-Kit flow:** `constitution → specify → clarify → plan → task-init
  → task-run`. `clarify` is not skipped; tasks are never authored by
  `/speckit-tasks` shortcuts that bypass the gated flow.
- **Execution model:** Implementation tasks default to Codex execution;
  the final UI/UX-polish task per feature is reserved for Claude (per
  project memory `young-certi-task-init-codex-first`).
- **Language policy:** `tasks.md` is written in Korean; all other
  spec-kit artifacts (`spec.md`, `plan.md`, `research.md`, contracts,
  this constitution) are written in English. User-facing meta dialog is
  Korean.
- **Merge gates:** A change MUST NOT merge to `main` unless: lint, unit
  tests, contract tests, container image build, image scan, and
  `terraform plan` (when infra changed) all succeed in CI. A failing
  Constitution Check in `/speckit-plan` blocks the plan from being
  finalized until the violation is justified in Complexity Tracking or
  resolved.
- **Review discipline:** One concept per PR (Principle IV). Reviewer
  (human or AI) checks principle compliance explicitly: IaC-only, no
  RDS, ephemeral assumptions, REST/error envelope, no auth surface.

## Governance

This constitution supersedes ad-hoc decisions. When it conflicts with a
plan, the plan changes, not the constitution; intentional deviations MUST
be amended in here first.

**Amendment procedure**

1. Open an amendment PR that updates this file and increments the version.
2. Regenerate the Sync Impact Report at the top of this file.
3. Audit `.specify/templates/*.md` and any agent-guidance files for
   wording that the amendment invalidates; update or note as ⚠ pending.
4. Merge requires the same gates as code (CI green, one-concept-per-PR).

**Versioning policy (SemVer for governance)**

- **MAJOR:** A principle is removed, redefined backward-incompatibly, or
  the governance procedure itself changes.
- **MINOR:** A new principle or new mandatory section is added, or an
  existing principle is materially expanded.
- **PATCH:** Wording, clarifications, typo fixes, or non-semantic
  refinements.

**Compliance review**

- Every `/speckit-plan` MUST execute the Constitution Check section and
  list any deviation in Complexity Tracking with a concrete justification
  and a simpler alternative considered.
- Recurring violations of the same principle are a signal to amend, not
  to keep granting exceptions.

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
