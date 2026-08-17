# AUTONOMY.md — the autonomy policy

> Defines what the factory can decide and do on its own, and what requires a human call (a
> Decision Gate). This is what keeps the factory safe to run unattended. When in doubt, take
> the more conservative path and open a Decision Gate.

This document is the **generic Decision Gate framework**: the mechanics of what a gate is,
how it's raised, and how it resolves. Product-specific gates — the concrete triggers for a
given product (its pricing model, its data-retention rules, its catalog) — belong in
`project/docs/AUTONOMY.md`, a product-level file that extends this one; it never contradicts
it. Sections 1 and 3 below are generic and apply to every product built on this factory.
Section 2 lists the trigger *categories* every product gate falls under — the product-level
file fills in the specifics.

## 1. What the factory CAN do on its own (within the roadmap)

- Read the roadmap and pick the next unblocked task.
- Create, refine, and close implementation issues.
- Write, edit, and refactor code.
- Write and run tests (unit, integration, end-to-end, and any style tests defined by the
  product's own skills).
- Open PRs, review them, and merge **if CI passes** (including security scans and any style
  tests) and the change stays inside this policy.
- Fix bugs, bump minor dependencies, and improve performance, accessibility, and unit cost
  — without changing price or scope.
- Create and evolve product-level skills as new versions, preserving previous versions and
  their golden samples.
- Build and evolve an admin dashboard and its metrics instrumentation.
- Apply the security baseline defined for the active profile.
- Generate documentation, changelogs, and release notes.
- Deploy to staging automatically.

## 2. What the factory NEEDS a human decision for (a Decision Gate)

Open a `decision-needed` issue (Options + Recommendation + what it blocks + what other work
is still available). Never proceed on the blocked item — move on to something else while it
waits. The trigger categories:

- **Real money.** Setting or changing **price**; contracting a paid service; a provider
  choice (image generation, printing, hosting, anything metered) that materially changes
  unit cost; any new recurring spend. **This is the generic example every product inherits:
  price and money-touching changes are always a Decision Gate, full stop — there is no
  autonomous path that ends in a different number being charged to a real customer.**
- **Production with real payment.** The first deploy to a production environment with billing
  turned on for real (leaving test mode).
- **Personal data / privacy / leakage.** Retention and deletion policy for any user-submitted
  data; privacy terms; legal basis or consent; anything that deletes, exposes, or widens
  access to user data.
- **Catalog and scope.** What ships in a given release (creating a new internal option is
  free; publishing it as something a customer can buy is a gate).
- **Visual identity and narrative voice.** Product name, logo, the "look" of each style, the
  tone of any generated narrative. The full flow:
  1. **The Foundation proposes.** A one-time design pass, run by the `design-director` role,
     produces a **candidate `DESIGN.md`** together with **at least 3 named, distinct
     directions** (with the chosen one and why) and an anti-default self-critique — *"would a
     similar brief, handed to any generator, land on this same result?"* — describing what
     the Foundation changed because of that question. The Foundation **stops there**: it
     never writes `Status: approved`, never fills in the gate field. While the document is a
     candidate, **no UI code derives from it.**
  2. **The owner approves.** Choosing the identity is a human decision, not a rubber-stamp at
     the end of a process. Approval stamps `Status: approved`, the date, and the gate
     identifier in `DESIGN.md` §0.
  3. **The approved `DESIGN.md` is authority.** From there, Construction runs autonomously
     inside it: every UI task **derives** from the approved tokens and sections — it never
     invents values — and does **not** open a gate per task. Enforcement is the
     `design-critic` role (read-only, on every UI PR) plus the CI quality gates, not a new
     human gate per change.
  - **Changing an approved `DESIGN.md` is always a new `decision-needed`.** True for any
    approved section, however small the change looks. Disagreeing with what's there is a
    reason to open the gate — never a reason to quietly drift inside an unrelated task.
  - **Mandatory trail.** Rejections, discarded alternatives, and approved iterations are
    recorded in the design memory (the template's own append-only section — see
    `factory/templates/DESIGN-template.md`). An entry once written is never edited or deleted.
    A rejection without a written reason doesn't count — it reopens on its own the following
    week.
- **Product changes.** Any change to what's recorded in the product's own scope document.
- **Irreversible actions.** Deleting data, deleting production resources, switching a
  provider after real orders already depend on it.
- **High-impact security.** Authentication, authorization, backend security rules, secrets,
  or anything that could expose data. (Applying the baseline is free; loosening it is a gate.)

## 3. Permanent rules (never violated)

- Never commit a secret.
- Never merge with red CI.
- Never weaken the security baseline without a gate.
- Never expose user data (no public storage, no PII in logs, signed URLs only).
- Never change the product's scope, autonomy policy, or decision log without an approved
  gate (proposing a change is fine; making it unilaterally is not).
- Never break an existing product skill: improvements ship as a new version plus tests, the
  old version stays available.
- Never charge a real customer outside an approved flow.
- Every relevant decision becomes an entry in `DECISIONS.md`.

## 4. Example Decision Gate

```
[DECISION] Retention policy for user-submitted photos
Option A — Delete 30 days after fulfillment.
Option B — Keep until the user requests deletion.
Recommendation: A (lower privacy and leakage risk).
Blocks: #313 (the deletion pipeline)
Other available work: #121, #241, #407
```

You answer "A"; an action records it in `DECISIONS.md`, clears the block, and the task
returns to the queue. Meanwhile, the factory keeps working on everything else.

## 5. Operating limits (recommended)

- `--max-turns` and a timeout per job; concurrency control.
- A billing cap/alert on API spend (review weekly at first), tracked on a dashboard.
- Least-privilege secrets, rotated periodically.
