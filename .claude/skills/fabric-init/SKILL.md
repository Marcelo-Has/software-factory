---
description: The thin Definition-phase orchestrator and gate (R-INIT) — runs gate-definition-done.mjs, shows the pending table, routes to the next pending stage's skill, and records owner-approved waivers. Never produces a stage artifact itself. Usage: /fabric-init
---

You're going to run **`/fabric-init`**, the Definition Phase's thin orchestrator and gate
(R-INIT). It never writes a D0-D6 artifact itself — its only outputs are the pending-items
report and, when the owner explicitly asks for one, a waiver entry in
`project/state/definition-status.yaml`. **Safe and cheap to re-run at any moment.**

## 1. Run the gate

Run `node .github/scripts/gate-definition-done.mjs` from the repo root.

## 2. All green

If it exits `0`: report **Definition Done** — every D0-D6 stage is `approved` or `waived`, and
every mechanical coverage check (screens x mockups x `mockup_states`, screens/features x
milestones, and the DP-3 logical coverage `gate-contracts.mjs --definition` delegates) passes.
Nothing to route to; the Definition Phase's job is finished. (Generation-phase tooling that
consumes this state is out of this skill's scope — EVP3.)

## 3. Pending items — render and route

If it exits non-zero, render the **exact** pending-items table the gate printed
(`| Area | Pending | Skill |`) — don't summarize or drop rows. Then:

- **Group by skill** and tell the owner which skill resolves each group, in stage order
  (`D0` before `D1` before … before `D6`, `DP-3` findings alongside the stage their `skill`
  column names).
- **Name the single next action**: the skill attached to the earliest-stage pending item — most
  sessions want "what do I run next," not the full backlog at once.
- Every skill named in the table's `Skill` column is a real skill
  (`gate-definition-done.mjs`'s own `STAGE_SKILL` map plus `gate-contracts.mjs`'s per-finding
  `skill` field: `/init`, `/define-product`, `/define-spec`, `/define-architecture`,
  `/design-foundation`, `/design-mockups`, `/plan-milestones`) — if a pending line ever names
  something else, that's a defect in the gate script, not something to route around silently;
  say so and stop.

## 4. Waivers — only on explicit owner request

If the owner wants to **dispense** a pending item rather than resolve it, record a waiver in
that item's stage under `project/state/definition-status.yaml`'s `waivers[]`:

```yaml
waivers:
  - item: <the artifact's canonical name — exact filename, e.g. "S-billing--payment-failed.html">
    justification: <why, tied to this product's real scope, never "not important">
    approved_by: <owner, explicit>
    date: <today, YYYY-MM-DD>
```

- **`item` must match exactly** what `gate-definition-done.mjs`'s `isWaived()` compares against
  (the artifact's own canonical filename, e.g. `DESIGN.md`, or the mockup's exact filename) —
  a loose, multi-artifact prose `item` does **not** silently absorb every artifact it
  mentions; if the owner wants several items waived, write several entries.
- **Never invent a waiver.** Record one only from the owner's explicit words, naming the item
  and giving a real reason — this skill doesn't decide what's dispensable.
- After recording, re-run the gate (step 1) and confirm the waived item now reads `waived`
  rather than `pending`.

## 5. Never produce a stage artifact

If the owner wants a pending item actually **resolved** (not waived), route them to the named
skill — this skill's own job stops at reporting and, when asked, waiving. It never writes to
`project/docs/`, `project/design/`, or any D0-D6 artifact directly.

## Rules

- Reads: the gate's own output only.
- Writes: `waivers[]` entries in `project/state/definition-status.yaml`, and only on the
  owner's explicit request — nothing else.
- Re-runnable at any time, with no side effects beyond an explicitly requested waiver.
