# ARCHITECTURE.md — template

## How to instantiate

Copy this file to `project/docs/ARCHITECTURE.md` and fill it in section by section — this is
part of the **D3** deliverable of the Definition Phase (`/define-architecture`), alongside
`DATA-MODEL.md`, `contracts/openapi.yaml`, `contracts/integrations.yaml`, `nfr.md`, and
`project/state/profile.json`. Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. An `ARCHITECTURE.md` with any `[TO FILL IN]`
  left in it **is not a candidate for approval**.

This document records **decisions**, in Architecture Decision Record (ADR) shape — context,
decision, consequences — not a running description of the whole system. §2 is fixed and
mandatory: every product built on this factory records its stack choice in that exact shape,
because it's the one architecture decision every product makes and the one the factory
actively participates in (recommend vs. accept-or-override).

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Depends on** | `PRODUCT.md`, `SPEC.md` — `[TO FILL IN]` their status as of this document |

---

## 1. System overview

<!-- HOW TO FILL: one paragraph. What kind of system this is (a web app with a database and
     one external integration; a static site; a service with a worker queue), not a diagram of
     every module — the ADRs below carry the actual decisions. -->

`[TO FILL IN]`

---

## 2. Stack decision — factory recommendation x owner preference

<!-- HOW TO FILL: this section is fixed by DECISIONS.md D-010 (the profile-module contract):
     /define-architecture reads factory/profiles/PROFILES.md and its module registry, proposes
     one module per dimension (frontend, backend, data-auth, deploy) with a stated reason, and
     the owner accepts or overrides each one. Both the recommendation and the owner's answer
     are recorded here — an override with no owner reasoning recorded is a missing decision,
     not a smaller one. -->

**Context:** `[TO FILL IN]` — what the product needs from its stack (scale, team familiarity,
budget, the interface category from `PRODUCT.md`/`SPEC.md`).

| Dimension | Factory recommendation | Reason | Owner decision | Owner's reason (if override) |
| --- | --- | --- | --- | --- |
| `frontend` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN — accepted \| overridden: <module>]` | `[TO FILL IN]` |
| `backend` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
| `data-auth` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
| `deploy` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |

**Consequences:** `[TO FILL IN]` — what this composition commits the product to (the modules'
`gate_adaptations`, the `commands` each module wires into CI, and anything a later override
would have to unwind).

**Recorded in:** `project/state/profile.json` (one module per dimension — the machine copy of
the "Owner decision" column above).

---

## 3. Architecture Decision Records

<!-- HOW TO FILL: one ADR per decision that would be expensive to reverse later (per
     .claude/rules/right-sizing.md — this is exactly the "expensive to reverse" filter). Not
     every implementation choice earns an ADR; a choice a later PR could freely change without
     an architecture-level conversation does NOT belong here. Number sequentially from ADR-1;
     never renumber or delete a recorded ADR — a reversed decision gets a new ADR that
     supersedes it. -->

### ADR-1 — `[TO FILL IN — title]`

**Context:** `[TO FILL IN]`
**Decision:** `[TO FILL IN]`
**Consequences:** `[TO FILL IN]`
**Status:** `[TO FILL IN — proposed \| accepted \| superseded by ADR-<n>]`

---

## 4. API surface overview

<!-- HOW TO FILL: a short prose pointer, not a duplicate of the contract. The real, gated
     source is contracts/openapi.yaml (schema in factory/templates/openapi-template.yaml) —
     every route needs an operationId there, and nfr.md's authz matrix (§5 below) needs to
     agree with it route for route. -->

`[TO FILL IN — one or two sentences: what kind of API this is (REST/RPC/BaaS-generated), and
where its contract lives]`

**External integrations:** `[TO FILL IN — list by I-<slug>, or "none for v1" ]`. Full contract
in `contracts/integrations.yaml` (schema in `factory/templates/integrations-template.yaml`);
definition guidance in `factory/docs/playbooks/external-integration.md`.

---

## 5. Data and non-functional requirements

<!-- HOW TO FILL: pointers, not duplicates — DATA-MODEL.md and nfr.md are their own approved
     artifacts. -->

**Data model:** see `DATA-MODEL.md`.
**Non-functional requirements** (authz, validation, idempotency, rate limits): see `nfr.md`.

---

## 6. Open assumptions

<!-- Append-only, same convention as PRODUCT.md §7. -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
