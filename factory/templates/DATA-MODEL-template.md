# DATA-MODEL.md — template

## How to instantiate

Copy this file to `project/docs/DATA-MODEL.md` and fill it in section by section — part of the
**D3** deliverable of the Definition Phase (`/define-architecture`), alongside
`ARCHITECTURE.md`. Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. A `DATA-MODEL.md` with any `[TO FILL IN]`
  left in it **is not a candidate for approval**.

One entity per subsection under §1. This document is prose-and-tables, not a schema migration
— it's what a developer reads before writing one, and what `nfr.md`'s authz matrix (route x
role) and validation rules are checked against for consistency.

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Depends on** | `PRODUCT.md`, `SPEC.md` — `[TO FILL IN]` their status as of this document |

---

## 1. Entities

<!-- HOW TO FILL: one #### block per entity. Fields: name, type, constraints (required?
     unique? default?), and a one-line meaning when the name alone doesn't say it. Every
     entity referenced by nfr.md's authz matrix or by contracts/openapi.yaml must exist here
     first — the data model is upstream of both. -->

#### `[TO FILL IN — EntityName]`

`[TO FILL IN — one sentence: what this entity represents]`

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | `[TO FILL IN]` | primary key | — |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |

**Owned by / scoped to:** `[TO FILL IN — the tenant or parent entity this belongs to, if any;
"global" if not scoped]`

---

## 2. Relationships

<!-- HOW TO FILL: one row per relationship between two entities from §1. Cardinality matters
     — it's what a validation rule or a cascade-delete decision in nfr.md depends on. -->

| From | To | Cardinality | Notes |
| --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN — 1:1 \| 1:N \| N:M]` | `[TO FILL IN]` |

---

## 3. Lifecycle and state

<!-- HOW TO FILL: for every entity that has a status/state field, the allowed states and the
     transitions between them — a state diagram in table form. An entity with no state field
     doesn't need an entry here. -->

**Entity:** `[TO FILL IN]`
**States:** `[TO FILL IN — comma-separated]`
**Transitions:** `[TO FILL IN — state -> state: what triggers it]`

---

## 4. Open assumptions

<!-- Append-only, same convention as PRODUCT.md §7. -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
