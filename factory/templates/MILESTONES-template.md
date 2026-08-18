# MILESTONES.md — template

## How to instantiate

Copy this file to `project/docs/MILESTONES.md` and fill it in section by section — this is
the **D6** deliverable of the Definition Phase (`/plan-milestones`), the last stage before
`gate-definition-done.mjs` can go green. Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. A `MILESTONES.md` with any `[TO FILL IN]`
  left in it **is not a candidate for approval**.

**This file is the narrative; `project/docs/milestones.yaml` is the machine source of
truth.** They describe the same milestones — the `.yaml` is what
`gate-definition-done.mjs` parses (schema in `factory/templates/milestones-template.yaml`);
this `.md` is what a person reads to understand the plan and the reasoning behind it. Keep
them in lockstep: every milestone `id` here has a matching entry in the YAML, and vice versa.

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Depends on** | `SPEC.md`, `screens.yaml`, `ARCHITECTURE.md`, `contracts/` — `[TO FILL IN]` their status as of this document |

---

## 1. Coverage rule

<!-- Copied verbatim into every instance — it's the rule the gate enforces mechanically, and
     a reader should know it without opening the gate script. -->

Every screen (`screens.yaml`) and every feature (`SPEC.md`'s `#### F-<n>` headings) belongs to
**exactly one** milestone — never zero, never more than one. `gate-definition-done.mjs`
enforces this and reports, screen by screen and feature by feature, whichever is missing or
duplicated.

---

## 2. Milestones

<!-- HOW TO FILL: one #### block per milestone, in delivery order. Each milestone is a
     coherent, demoable slice — not an arbitrary bucket of leftover screens. The "why this
     grouping" line is what makes the split defensible instead of accidental. Budget figures
     here should match the budget block in milestones.yaml exactly — this is prose ABOUT that
     number, not a second, independent one. -->

#### `[TO FILL IN — M-<n>]` — `[TO FILL IN — name]`

**Why this grouping:** `[TO FILL IN]`
**Screens:** `[TO FILL IN — S-<slug>, ...]`
**Features:** `[TO FILL IN — F-<n>, ...]`
**Endpoints / integrations:** `[TO FILL IN — operationId / I-<slug>, ..., or "none"]`
**Budget:** `[TO FILL IN — turns, usd]`
**Acceptance:** `[TO FILL IN — the observable condition(s) that close this milestone]`

---

## 3. Sequencing rationale

<!-- HOW TO FILL: why this order and not another — what a milestone depends on from the ones
     before it. A milestone that could ship in any order relative to another should say so;
     one that can't should say why (a data model dependency, an auth prerequisite). -->

`[TO FILL IN]`

---

## 4. Open assumptions

<!-- Append-only, same convention as PRODUCT.md §7. -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
