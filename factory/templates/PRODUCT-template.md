# PRODUCT.md — template

## How to instantiate

Copy this file to `project/docs/PRODUCT.md` and fill it in section by section, in order —
this is the **D1** deliverable of the Definition Phase (`/define-product`). Convention used
throughout this template, and every other Definition-phase template (see `DECISIONS.md`
D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. A `PRODUCT.md` with any `[TO FILL IN]` left
  in it **is not a candidate for approval**.

**Nothing is optional.** If a field genuinely doesn't apply, write `Not applicable —`
followed by the reason — a deleted field reads as a forgotten field.

This document is what `/define-spec` (D2), `/define-architecture` (D3), and
`/design-foundation` (D4) all read from. §6 in particular is the bridge into D4: the
Foundation derives visual personality from it instead of guessing.

---

## 0. Header

<!-- HOW TO FILL: the document's formal state. While it's a "candidate," nothing downstream
     may be derived from it — `/define-spec` will not start D2 against a candidate PRODUCT.md.
     "approved" requires a date and the owner's sign-off, recorded here and mirrored in
     project/state/definition-status.yaml. -->

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |

---

## 1. Vision

<!-- HOW TO FILL: two or three sentences. What problem exists in the world, and what does this
     product promise instead? Not a feature list — a feature list belongs in §4/SPEC.md. A
     vision that could describe five other products in the same category hasn't said anything
     yet. -->

`[TO FILL IN]`

---

## 2. Audience

<!-- HOW TO FILL: who this is for, specifically enough that a feature request can be checked
     against it ("does this serve them?"). At least one primary audience; a secondary audience
     only if it's real, not aspirational. -->

**Primary audience:** `[TO FILL IN]`
**Secondary audience:** `[TO FILL IN]` — or `Not applicable — single audience for v1.`

---

## 3. Jobs to be done

<!-- HOW TO FILL: what is the audience trying to accomplish, independent of this product's
     existence? One row per job, ranked by importance. A job is an outcome ("get paid for work
     done"), not a feature ("send an invoice"). -->

| # | Job | Why it matters to them |
| --- | --- | --- |
| 1 | `[TO FILL IN]` | `[TO FILL IN]` |

---

## 4. Scope — v1

<!-- HOW TO FILL: the smallest set of jobs (from §3) this version actually serves, stated as
     capabilities — not yet as features with ids (that's SPEC.md's #### F-<n> headings, D2).
     This section answers "what does v1 do," SPEC.md answers "how, screen by screen." -->

`[TO FILL IN]`

---

## 5. Out of scope — for now

<!-- HOW TO FILL: explicitly named exclusions, each with a reason. "Out of scope" that isn't
     written down gets silently re-proposed by the next session. A reason ties the exclusion to
     a real constraint (v1 budget, an unvalidated assumption, a dependency not built yet) —
     "not important" is not a reason. -->

| Excluded | Why, for now |
| --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` |

---

## 6. Personality and brand positioning

<!-- HOW TO FILL: this section is what `/design-foundation` (D4) reads before proposing a
     visual direction — it is the bridge from product intent to `DESIGN.md` §1. Answer in
     product terms, not visual terms: "reassuring and precise, because the audience is
     handling their own money" is usable; "clean and modern" is not (those words are banned in
     DESIGN.md §1 for exactly this reason). -->

**Personality (3 adjectives, each justified):** `[TO FILL IN]`
**How this product wants to be positioned against alternatives:** `[TO FILL IN]`
**What this product is explicitly NOT (tone, category, or competitor to avoid resembling):**
`[TO FILL IN]`

---

## 7. Open assumptions

<!-- HOW TO FILL: append-only, like DESIGN.md §15. Anything decided by assumption rather than
     by the owner's explicit answer, so a later session can find and re-validate it instead of
     treating it as settled fact. Mirrors the decided[] / assumed[] split in
     project/state/definition-status.yaml (DECISIONS.md D-009). -->

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
