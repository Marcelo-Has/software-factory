# SPEC.md — template

## How to instantiate

Copy this file to `project/docs/SPEC.md` and fill it in section by section — this is the
**D2** deliverable of the Definition Phase (`/define-spec`), built from an approved
`PRODUCT.md` (D1). Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. A `SPEC.md` with any `[TO FILL IN]` left in
  it **is not a candidate for approval**.

**Feature headings are load-bearing.** Every feature is a `#### F-<n> — <title>` heading,
exactly that level and exactly that prefix — `gate-contracts.mjs` and the milestone tooling
grep for this pattern (D-009) instead of maintaining a separate feature index. Never renumber
an approved `F-<n>`; retiring a feature means marking it retired, not reusing its number.

This document produces, alongside itself, two machine-readable companions that ship in the
same D2 pass: `project/docs/screens.yaml` (schema in `factory/templates/screens-template.yaml`)
and `project/docs/behaviors/*.feature` for the logical flows (schema in
`factory/templates/behaviors-template.feature`). A feature with no screen or no behavior
coverage is an incomplete D2, not a smaller one.

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Depends on** | `PRODUCT.md` — `[TO FILL IN]` its status as of this document |

---

## 1. Features

<!-- HOW TO FILL: one #### F-<n> block per feature, numbered from F-1 with no gaps, in the
     order a new user would encounter them (not by internal complexity). Each feature traces
     to a job in PRODUCT.md §3 — a feature that doesn't trace back is scope creep, not a
     feature. -->

#### F-1 — `[TO FILL IN — title]`

<!-- HOW TO FILL: a user story ("as a <role>, I can <action>, so that <outcome>"), the
     screens it touches (by S-<slug> id — declared in screens.yaml), the acceptance criteria
     (short, testable bullets, not prose), and whether it crosses a system boundary. -->

**User story:** `[TO FILL IN]`
**Screens:** `[TO FILL IN — S-<slug>, ...]`
**Acceptance criteria:**
- `[TO FILL IN]`

**Crosses a system boundary (external integration)?** `[TO FILL IN — yes/no]`
<!-- HOW TO FILL: "yes" means this feature reads factory/docs/playbooks/external-integration.md
     and its behaviors/*.feature scenarios cover the five mandatory classes (DECISIONS.md
     D-007): @happy, @duplicate, @external-failure, @invalid, @unauthorized. "no" is a
     legitimate, common answer — most features don't cross a boundary. -->

#### F-2 — `[TO FILL IN — title]`

**User story:** `[TO FILL IN]`
**Screens:** `[TO FILL IN]`
**Acceptance criteria:**
- `[TO FILL IN]`

**Crosses a system boundary (external integration)?** `[TO FILL IN]`

---

## 2. User flows

<!-- HOW TO FILL: the primary journeys through the product, narrated screen to screen, by
     S-<slug> id. A flow is not a duplicate of a feature's acceptance criteria — it's what
     connects several features end to end (e.g. "sign up -> first core action -> see the
     result"). One block per flow; the "why this order" line is what stops flows from being
     an arbitrary click-path. -->

**Flow:** `[TO FILL IN — name]`
**Steps:** `[TO FILL IN — S-<slug> -> S-<slug> -> ...]`
**Why this order:** `[TO FILL IN]`

---

## 3. Screens and behaviors — the machine-readable bridge

<!-- HOW TO FILL: this section doesn't duplicate screens.yaml or the .feature files — it
     states which ones exist and why, so a reader of SPEC.md alone knows where the rest of D2
     lives. -->

**`project/docs/screens.yaml`** inventories every screen this spec references, across every
area (`marketing` \| `app` \| `admin` \| `email`) — including screens with no feature pointing
at them yet (a marketing site, a transactional email). An area genuinely absent from this
product is declared in `areas_without_screens`, never just omitted.

**`project/docs/behaviors/*.feature`** carries the Gherkin scenarios for this spec's logical
flows — one feature file per product feature area, tagged per D-009
(`@scenario:<slug>` + `@endpoint:<operationId>` and/or `@integration:<I-id>` + one mandatory
class tag). Written here, in D2, alongside `SPEC.md` and `screens.yaml` — `/define-spec` names
the `operationId`/`I-<slug>` values the scenarios tag against before either contract exists.
D3's `/define-architecture` doesn't originate those names: it makes them real, using the exact
same ids in `contracts/openapi.yaml` and `contracts/integrations.yaml` — that's the "resolve"
D3 does, never a fresh invention.

**Screen inventory summary:** `[TO FILL IN — screen count by area, and confirmation every
area without screens is declared]`

---

## 4. Open assumptions

<!-- Append-only, same convention as PRODUCT.md §7. -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
