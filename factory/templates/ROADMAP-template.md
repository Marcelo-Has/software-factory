# ROADMAP.md — template

## How to instantiate

Copy this file to `project/docs/ROADMAP.md` and replace every `[TO FILL]` with the product's
own phases and tasks. This file is a **required contract of the core**: the Supervisor role
reads it to decide the next unblocked piece of work, so it always exists for a product built
on this factory, even in its emptiest form (one phase, a handful of tasks). Keep the legend
and the "Who maintains this file" section verbatim — they document the mechanics every project
using this factory relies on.

---

<!-- HOW TO FILL: replace the title with the product's name. -->
# ROADMAP.md — [project name]

> A phased plan, broken into **small, cohesive tasks** (one unit of work per item) so the
> factory can deliver each one in fewer iterations and with higher quality. Priority: get the
> factory itself running first, then the product. The Supervisor uses this file to know the
> next frontier.
>
> **Legend:** `[ ]` pending · `[x]` done · **Px-yy** = task code (becomes an issue) ·
> **[gate D-xxx]** = touches a pending decision → create as `decision-needed`, never
> `status:ready`.

## Who maintains this file

This file is **not a history log**: the Supervisor decides the next frontier by reading it. A
stale roadmap makes the factory plan against a wrong map. Maintenance is therefore the
responsibility of whoever delivers, in the same PR — not a separate task someone has to
remember:

- **Checking `[x]` is the Builder's job**, in the PR that closes the issue. An issue with a
  `Px-yy` code in its title → the matching line becomes `[x]` in the same commit. Never
  before: `[x]` means *merged*, and it's the PR's merge that makes the mark true.
- **A new item is the Supervisor's to propose, the Builder's to write.** The Supervisor is
  read-only by design; when it decomposes an item (`P1-05` → `P1-05a`/`b`/`c`) or discovers
  product work the plan didn't foresee, it states the **exact line** to add in the issue, and
  the Builder writes it in the PR. A parent item only becomes `[x]` once every sub-item is
  `[x]`.
- **Follow-up items do NOT belong here.** A review follow-up or a factory-hygiene fix lives as
  an issue and as an entry in `DECISIONS.md`. This file is the **product's** phase plan;
  filling it with follow-ups turns the map into a log and the Supervisor loses the frontier.
  The exception is when a follow-up closes an item that was already on the plan — then the
  existing line gets marked.
- **Drift is measured without AI:** `daily-report.yml` cross-references closed issues carrying
  a `Px-yy` code against this file and flags, in the daily report, whatever was left unmarked.

---

<!-- HOW TO FILL: one section per phase. Each phase states its Definition of Done up front,
     then a checklist of tasks. Keep phases small and sequential — this is what lets the
     Supervisor size a single task to fit inside the turn budget documented in
     factory/docs/FACTORY.md. A [gate D-xxx] tag means the Supervisor must open the item as
     decision-needed, never status:ready. Delete this comment block and the example phase once
     the real plan is written. -->

## PHASE 0 — [phase name] `[TO FILL]`
DoD: `[TO FILL — the observable condition that closes this phase]`

- [ ] **P0-01** — `[TO FILL]`
- [ ] **P0-02** — `[TO FILL]`

---

## PHASE 1 — [phase name] `[TO FILL]`
DoD: `[TO FILL]`

- [ ] **P1-01** — `[TO FILL]`

---

## Priority for the Supervisor

1. Close the current phase before moving to the next one.
2. Never create an item tagged **[gate D-xxx]** as `status:ready` — open it as
   `decision-needed`.
3. Respect dependencies (e.g. a scaffolding task before anything that builds on it).
4. Prefer tasks that unblock others.
5. Security and cost observability travel with every phase, not just at the end.
6. When decomposing an item or creating product work the plan didn't foresee, **state the
   exact ROADMAP line** to add in the issue (code, phase, and position). You don't write the
   file — the Builder does, in the PR. See "Who maintains this file," above.
