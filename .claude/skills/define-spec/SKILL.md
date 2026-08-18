---
description: Runs a project's D2 — instantiates SPEC.md (features as #### F-<n> headings), screens.yaml (complete inventory), and behaviors/*.feature for logical flows; stops at approval. Usage: /define-spec
---

You're going to run this project's **D2 — `/define-spec`**. It produces three artifacts
together, in the same pass: `project/docs/SPEC.md`, `project/docs/screens.yaml`, and
`project/docs/behaviors/*.feature` — a feature with no screen or no behavior coverage is an
incomplete D2, not a smaller one (`factory/templates/SPEC-template.md`'s own rule).

## 1. Check whether it already ran

- `project/docs/PRODUCT.md` must exist with `Status: approved` — D2 is built from an approved
  D1 (`SPEC-template.md`'s header: "Depends on: `PRODUCT.md`"). If it's still `candidate`,
  stop and point the owner at finishing `/define-product`'s approval first.
- If `project/docs/SPEC.md` exists with `Status: approved`, this is a re-run: changing an
  approved feature set is scope creep on an already-approved product decision
  (`factory/docs/AUTONOMY.md` §2, "Product changes") — record the change in
  `project/docs/DECISIONS.md` first, never renumber or silently edit an approved `F-<n>`
  (retiring a feature means marking it retired, `SPEC-template.md`'s own rule).
- If `SPEC.md`/`screens.yaml` exist as `candidate`, resume from what's filled instead of
  restarting.
- Otherwise, copy `factory/templates/SPEC-template.md` to `project/docs/SPEC.md` and
  `factory/templates/screens-template.yaml` to `project/docs/screens.yaml`, and start §1.

## 2. Features — `SPEC.md` §1

One `#### F-<n> — <title>` heading per feature, numbered from `F-1` with no gaps, in the order
a new user would encounter them. Every feature traces to a job in `PRODUCT.md` §3 — a feature
that doesn't trace back is scope creep, not a feature. For each: a user story, the screens it
touches (by `S-<slug>`, declared in step 4), testable acceptance criteria, and the explicit
**"Crosses a system boundary (external integration)?"** answer.

**The moment any feature answers "yes"**, read
`factory/docs/playbooks/external-integration.md` before drafting that feature's behaviors
(step 5) — it fixes where Definition effort goes (webhooks, idempotency, authorization at the
boundary, named error states) and the five scenario classes every such feature ships coverage
for.

## 3. User flows — `SPEC.md` §2

The primary journeys, screen to screen by `S-<slug>` id, each with a "why this order" line —
not a duplicate of any one feature's acceptance criteria, but what connects several features
end to end.

## 4. Screen inventory — `screens.yaml`

Every screen the product ships, across **every** area (`marketing`, `app`, `admin`, `email`) —
including screens no feature points at yet (a marketing page, a transactional email). For each:
`id` (`S-<slug>`, stable, never reused once approved), `name`, `area`, `route` (or omitted for
a routeless screen like a transactional email), `states` (always including `default`, plus
whatever else this screen genuinely needs per `factory/docs/CRAFT-PRINCIPLES.md`'s
mandatory-states floor), and `mockup_states` (the subset needing a D5 mockup file — `default`
always included).

An area with **zero** screens in this product is declared under `areas_without_screens`
explicitly — never just left out of the list. A declared hole is not the same failure as a
forgotten one.

## 5. Behaviors — `project/docs/behaviors/*.feature`

One file per feature area (not one giant file), built from `factory/templates/
behaviors-template.feature`'s tag convention (`DECISIONS.md` D-009 §2, D-007):
`@scenario:<slug>`, one of `@endpoint:<operationId>` and/or `@integration:<I-id>`, plus exactly
one class tag (`@happy | @duplicate | @external-failure | @invalid | @unauthorized`).

**The `operationId`/`I-<slug>` values you tag with here don't exist as real contracts yet** —
`contracts/openapi.yaml` and `contracts/integrations.yaml` are D3 artifacts
(`/define-architecture`). D2's job is to **name them now**, sensibly and stably (e.g.
`sendInvoice`, `I-payments`), and write the scenarios against those names; D3's job is to make
those exact same names real in the contracts — never to invent different ones. Tell the owner
this explicitly when handing off to D3.

For every feature marked "crosses a system boundary: yes" in step 2, cover **all five
mandatory classes** for that flow (`DECISIONS.md` D-007,
`factory/docs/playbooks/external-integration.md` §2) — not just `@happy`. For a feature with no
boundary crossing, ordinary flows only need the classes that actually apply (most will just be
`@happy` plus whatever `@invalid`/`@unauthorized` cases are real).

## 6. `SPEC.md` §3 — the bridge

Fill in the screen-inventory summary (count by area, confirmation every area without screens is
declared) — this section narrates `screens.yaml` and `behaviors/`, it doesn't duplicate them.

## 7. Update `definition-status.yaml`

Set the `D2` stage's `status` to `awaiting-approval`; append genuine owner decisions to
`decided[]` and assumptions to `assumed[]` (mirroring `SPEC.md` §4).

## 8. STOP at the human gate

Present `SPEC.md`, `screens.yaml`, and the `.feature` files together and **stop**. The gate is
three-part: owner approval, no undeclared inventory hole (every area accounted for, in
`screens.yaml` or in `areas_without_screens`), and logical-flow scenarios present for every
boundary-crossing feature. This skill never writes `Status: approved` on `SPEC.md` — that's the
owner's edit, once given, same convention as D1.

## 9. On a later re-run, once the owner has approved

Record it in `project/state/definition-status.yaml`'s `D2` stage (`status: approved`,
`approved_by`, `date`) — only from the owner's explicit, current word, never inferred.

## Rules

- Loads D2's context: `PRODUCT.md` (must be approved), `screens-template.yaml`,
  `behaviors-template.feature`, and — only when a feature crosses a boundary —
  `factory/docs/playbooks/external-integration.md`. Does not read `ARCHITECTURE.md` or any D3+
  artifact.
- Writes only `project/docs/SPEC.md`, `project/docs/screens.yaml`,
  `project/docs/behaviors/*.feature`, and the `D2` stage of `definition-status.yaml`.
- Never decides the stack, endpoints, or data model — those are D3.
