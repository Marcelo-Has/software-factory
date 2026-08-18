---
description: Runs a project's D3 — instantiates ARCHITECTURE.md (incl. the stack ADR), DATA-MODEL.md, contracts/openapi.yaml, contracts/integrations.yaml, nfr.md, and state/profile.json; stops at approval. Usage: /define-architecture
---

You're going to run this project's **D3 — `/define-architecture`**. It produces six artifacts
together: `project/docs/ARCHITECTURE.md`, `project/docs/DATA-MODEL.md`,
`project/docs/contracts/openapi.yaml`, `project/docs/contracts/integrations.yaml`,
`project/docs/nfr.md`, and `project/state/profile.json`. This is the one Definition stage where
the factory actively participates in a decision (the stack) instead of only recording the
owner's — recommend, never impose.

## 1. Check whether it already ran

- `project/docs/SPEC.md` must exist with `Status: approved` — D3 depends on approved D1 and D2
  (`ARCHITECTURE-template.md`'s header: "Depends on: `PRODUCT.md`, `SPEC.md`"). If either isn't
  approved yet, stop and point the owner at finishing that skill's approval first.
- If `ARCHITECTURE.md` exists with `Status: approved`, this is a re-run: changing an approved
  stack or ADR is an **Irreversible action** / **Product change**-adjacent call
  (`factory/docs/AUTONOMY.md` §2) — a reversed ADR gets a **new** ADR that supersedes the old
  one (never edited or deleted in place), recorded via `project/docs/DECISIONS.md`.
- If the D3 artifacts exist as `candidate`, resume from what's filled instead of restarting.
- Otherwise, copy `factory/templates/ARCHITECTURE-template.md` →
  `project/docs/ARCHITECTURE.md`, `factory/templates/DATA-MODEL-template.md` →
  `project/docs/DATA-MODEL.md`, `factory/templates/openapi-template.yaml` →
  `project/docs/contracts/openapi.yaml`, `factory/templates/integrations-template.yaml` →
  `project/docs/contracts/integrations.yaml`, and `factory/templates/nfr-template.md` →
  `project/docs/nfr.md`.

## 2. The stack decision — `ARCHITECTURE.md` §2

Read `factory/profiles/PROFILES.md` §5 (the module registry) and every `module.yaml` in
`factory/profiles/<dimension>/<module>/` for the four dimensions (`frontend`, `backend`,
`data-auth`, `deploy`). Propose **one module per dimension**, each with a stated reason drawn
from `PRODUCT.md` (audience, scale, team) and `SPEC.md`/`screens.yaml` (interface category,
whether any feature crosses a system boundary). A `skeleton`-status module is not authority for
a product to compose today (`PROFILES.md` §1/§5) — recommend a `complete` module unless the
owner specifically wants to mature a skeleton, and say so if you do recommend one.

Fill the recommendation table in `ARCHITECTURE.md` §2. The owner accepts each row or overrides
it — **an override with no owner reasoning recorded is a missing decision, not a smaller one**
(`PROFILES.md` §3). Record both the recommendation and the owner's answer, per dimension, even
when accepted.

Once all four dimensions are decided, write `project/state/profile.json` per `PROFILES.md`
§3's shape — one module name per dimension, nothing else:

```json
{
  "frontend": "<module name>",
  "backend": "<module name>",
  "data-auth": "<module name>",
  "deploy": "<module name>"
}
```

## 3. Architecture Decision Records — `ARCHITECTURE.md` §3

One ADR per decision that's **expensive to reverse later**
(`.claude/rules/right-sizing.md`'s filter) — not every implementation choice earns one. Number
sequentially from `ADR-1`; never renumber or delete a recorded ADR.

## 4. `DATA-MODEL.md`

One entity per `§1` subsection (fields, types, constraints, "owned by / scoped to"), the
relationships between them (`§2`, with cardinality), and lifecycle/state transitions (`§3`) for
any entity with a status field. Every entity `nfr.md`'s authz matrix or `openapi.yaml`
references must exist here first.

## 5. `contracts/openapi.yaml` and `contracts/integrations.yaml`

**Use the exact `operationId`/`I-<slug>` names `/define-spec` already tagged in
`project/docs/behaviors/*.feature`** — D2 named them, D3 makes them real; inventing different
names here breaks the scenario↔contract link `gate-contracts.mjs` checks. Every operation
declares `operationId` and an explicit `security` scheme (an empty array for a public route is
a decision, not a default left unset). A webhook route gets its own signature-verified scheme,
never the same one authenticated users get (`factory/docs/playbooks/external-integration.md`
§1.1/§1.3).

`integrations.yaml`: abstract provider **kind** only, never a vendor name
(`DECISIONS.md` D-007, the D-3.7 genericity rule) — same for the event/object names. Logical
secret names only, never a value. State the `idempotency_key` and the hermetic `mock_trust_note`
(no live network call, no real secret — `PROFILES.md` §4's mock-first contract).

**Right-sizing** (`DECISIONS.md` D-007): if `SPEC.md` never marked a feature as crossing a
system boundary, `integrations.yaml` ships `integrations: []` — a complete, valid D3 artifact,
not an unfinished one. If the product genuinely has no endpoints of its own, `openapi.yaml`
ships a minimal, valid document (`info` + empty `paths: {}`) — also complete, not unfinished.

## 6. `nfr.md`

Fill the header's "Has own endpoints?" first — "no" collapses every section below to "Not
applicable — no own endpoints for v1," a legitimate, cheap, complete answer. Otherwise:

- **§1 Authorization matrix** — every `openapi.yaml` route gets exactly one row, by
  `operationId`, matching it byte-for-byte (not a paraphrase). A webhook's signature-verified
  exception is recorded here explicitly, never a silent gap.
- **§2 Validation rules** — beyond `DATA-MODEL.md`'s field types.
- **§3 Idempotency** — required wherever a client or external system might retry (payment
  webhooks, "send" actions, anything D-007's mandatory `@duplicate` class touches); this is the
  prose mirror of each integration's `idempotency_key`.
- **§4 Rate limits** — routes that send external communication, cost money per call, or are a
  plausible abuse target.
- **§5 Error handling** — an external-failure or invalid-input path never leaks a stack trace
  or PII; zero exceptions on a payment or personal-data integration
  (`external-integration.md` §1.5).

## 7. Update `definition-status.yaml`

Set the `D3` stage's `status` to `awaiting-approval`; append genuine owner decisions
(especially the accepted/overridden stack) to `decided[]` and assumptions to `assumed[]`.

## 8. STOP at the human gate

Present all six artifacts together and **stop**. The gate is owner approval **and** the stack
being recorded (both `ARCHITECTURE.md` §2's table and `project/state/profile.json`). This skill
never writes `Status: approved` on `ARCHITECTURE.md`/`DATA-MODEL.md`/`nfr.md` — that's the
owner's edit, once given, same convention as D1/D2. `profile.json` and the two `contracts/*`
YAML files have no `Status` header (`DECISIONS.md` D-009 §1 only covers `.md` artifacts) — they
become authoritative the moment the owner accepts the stack table and the contracts stop
carrying `[TO FILL IN` placeholders.

## 9. On a later re-run, once the owner has approved

Record it in `project/state/definition-status.yaml`'s `D3` stage (`status: approved`,
`approved_by`, `date`) — only from the owner's explicit, current word, never inferred.

## Rules

- Loads D3's context: approved `PRODUCT.md` and `SPEC.md`, `screens.yaml`,
  `project/docs/behaviors/*.feature` (for the operationId/integration-id names to honor),
  `factory/profiles/PROFILES.md` and its module registry, and
  `factory/docs/playbooks/external-integration.md` when any integration is declared.
- Writes only `project/docs/ARCHITECTURE.md`, `project/docs/DATA-MODEL.md`,
  `project/docs/contracts/openapi.yaml`, `project/docs/contracts/integrations.yaml`,
  `project/docs/nfr.md`, `project/state/profile.json`, and the `D3` stage of
  `definition-status.yaml`.
- Never touches visual identity — that's D4 (`/design-foundation`).
