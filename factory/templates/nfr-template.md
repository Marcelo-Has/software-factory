# nfr.md — template

## How to instantiate

Copy this file to `project/docs/nfr.md` and fill it in section by section — part of the **D3**
deliverable of the Definition Phase (`/define-architecture`), alongside `ARCHITECTURE.md` and
`DATA-MODEL.md`. Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. An `nfr.md` with any `[TO FILL IN]` left in it
  **is not a candidate for approval**.

This is the per-product instance of the factory's security baseline (`.claude/rules/
security.md`) — not optional hardening, the floor for what's being built (per
`.claude/rules/right-sizing.md`: BaaS rules, signed URLs, input validation, and verified
webhooks are baseline, not excess). `gate-contracts.mjs` requires this file to exist and be
non-placeholder whenever the product has any own endpoint (`contracts/openapi.yaml` is
non-empty). If the product genuinely has no own endpoints, say so in §0 and every section
below collapses to "not applicable" — that's a legitimate, cheap answer, not a shortcut.

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Depends on** | `ARCHITECTURE.md`, `DATA-MODEL.md`, `contracts/openapi.yaml` |
| **Has own endpoints?** | `[TO FILL IN — yes \| no]` — "no" makes every section below "Not applicable — no own endpoints for v1." |

---

## 1. Authorization matrix — route x role

<!-- HOW TO FILL: every route in contracts/openapi.yaml gets exactly one row here, by
     operationId — the same id, not a paraphrase, so the two documents can be diffed against
     each other by eye. One column per role that exists in DATA-MODEL.md. A route with no
     authorization requirement (public) still gets a row, marked "public" — an absent row
     reads as "forgotten," not "intentionally open." -->

| `operationId` | Route | `[TO FILL IN — role]` | `[TO FILL IN — role]` | Unauthenticated |
| --- | --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN — METHOD /path]` | `[TO FILL IN — allow/deny + condition]` | `[TO FILL IN]` | `[TO FILL IN — allow/deny]` |

---

## 2. Validation rules

<!-- HOW TO FILL: one row per field or input that needs a rule beyond its DATA-MODEL.md type —
     format, range, cross-field constraint. Not every field needs a row; a plain required
     string doesn't, a currency amount or an email does. -->

| Field / input | Rule | Where enforced |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN — client, server, or both]` |

---

## 3. Idempotency

<!-- HOW TO FILL: where idempotency is REQUIRED, not everywhere by default. Required whenever
     a client or an external system might retry the same request (payment webhooks, "send"
     actions, anything DECISIONS.md D-007's mandatory @duplicate scenario class touches). State
     the idempotency key and what "duplicate" means for that operation. -->

| `operationId` | Idempotency key | What counts as a duplicate | Behavior on duplicate |
| --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN — e.g. return the original result, no side effect repeated]` |

**Operations that do NOT require idempotency, and why:** `[TO FILL IN]`

---

## 4. Rate limits

<!-- HOW TO FILL: one row per route that needs a limit — anything that sends external
     communication, costs money per call, or is a plausible abuse target. A read-only,
     internal-only route usually doesn't need an entry. -->

| `operationId` | Limit | Scope (per user / per IP / per account) | Behavior over limit |
| --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN — e.g. 429 with retry-after]` |

---

## 5. Error handling — external and internal failure paths

<!-- HOW TO FILL: what an external-failure or invalid-input error path returns to the caller,
     and the rule that it never leaks a stack trace or PII in the response — this is the
     baseline security.yml's inline rubric checks against (DECISIONS.md D-009 / plan §0.7). -->

`[TO FILL IN]`

---

## 6. Open assumptions

<!-- Append-only, same convention as PRODUCT.md §7. -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
