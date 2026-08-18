# DECISIONS.md — template

## How to instantiate

`/init` copies this file to `project/docs/DECISIONS.md` at D0 — the product's own decision
log, separate from this repo's root `DECISIONS.md` (DECISIONS.md D-009 §7). Its numbering is
the product's own, starting at D-001, independent of the core's `D-<n>` sequence and of any
`GR-<n>` guard-rail references. Written in the language configured at `/init`
(`project/state/init.json`'s `language` field) — this file is `project/**`, so `english-only`
does not apply to it.

The `answer-decision` skill routes here whenever the GR-10 product marker is present; it
routes to the root `DECISIONS.md` only in the factory-source repo itself. Every Definition
skill (`/define-product`, `/define-spec`, `/define-architecture`, …) that makes a call the
owner didn't explicitly settle records it here — the same discipline the core's own
`DECISIONS.md` follows for the factory itself.

---

# DECISIONS.md

Numbered decision log for this product. Numbering is this product's own, starting at D-001.

---

<!-- HOW TO FILL: one entry per decision, oldest first, never renumbered or reordered once
     recorded. Copy this block for each new decision. -->

## D-001 — `[TO FILL IN — decision title]`

**Date:** `[TO FILL IN — YYYY-MM-DD]`
**Status:** `[TO FILL IN — proposed | accepted | superseded]`

`[TO FILL IN — what was decided, in enough detail that a later reader doesn't need to
reconstruct the context from the artifact it affected]`

**Why:** `[TO FILL IN — the reasoning; what alternative was rejected and why, if relevant]`
