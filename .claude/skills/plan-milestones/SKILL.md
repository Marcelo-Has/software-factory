---
description: Runs a project's D6 — groups every screen and feature into coherent-flow milestones (M-<n>) with explicit turn/usd budgets, covering every endpoint and integration; runs the coverage gate before approval. Usage: /plan-milestones
---

You're going to run this project's **D6 — `/plan-milestones`**, the last Definition stage
before `gate-definition-done.mjs` can go green. It produces two artifacts together:
`project/docs/MILESTONES.md` (the narrative) and `project/docs/milestones.yaml` (the machine
source `gate-definition-done.mjs` and `gate-contracts.mjs` actually parse) — kept in lockstep,
never drifting apart.

## 1. Check whether it already ran

- `project/docs/SPEC.md` and `project/docs/ARCHITECTURE.md` must exist with
  `Status: approved` — milestones group the features (`SPEC.md`), screens (`screens.yaml`),
  endpoints (`contracts/openapi.yaml`), and integrations (`contracts/integrations.yaml`) those
  two stages already fixed; D6 groups what exists, it doesn't invent new ones. If either isn't
  approved, stop and point the owner at finishing that skill's approval first.
- If `MILESTONES.md` exists with `Status: approved`, this is a re-run: reshaping an approved
  delivery plan is a **Product change**-adjacent call (`factory/docs/AUTONOMY.md` §2) — record
  the change in `project/docs/DECISIONS.md` first, and add a milestone rather than silently
  renumbering or deleting one that shipped screens/features already reference.
- If the D6 artifacts exist as `candidate`, resume from what's filled instead of restarting.
- Otherwise, copy `factory/templates/MILESTONES-template.md` → `project/docs/MILESTONES.md`
  and `factory/templates/milestones-template.yaml` → `project/docs/milestones.yaml`.

## 2. Gather what needs covering

Read, exhaustively:

- every screen `id` in `project/docs/screens.yaml`;
- every `#### F-<n> —` feature heading in `project/docs/SPEC.md`;
- every `operationId` in `project/docs/contracts/openapi.yaml`;
- every integration `id` (`I-<slug>`) in `project/docs/contracts/integrations.yaml`.

This is the full coverage set both gates check against — `gate-definition-done.mjs` for
screens/features, `gate-contracts.mjs` for endpoints/integrations (its
`endpoint-missing-milestone`/`integration-missing-milestone` findings route back to this same
skill).

## 3. Group into milestones — coherent flows, not leftover buckets

Each milestone (`M-<n>`, numbered from `M-1` with no gaps) is a **coherent, demoable slice** —
screens and features that make sense delivered together, not an arbitrary split to even out
file sizes. For each milestone, in both `milestones.yaml` and the matching `MILESTONES.md`
`####` block:

- `screens`/`features` — the `S-<slug>`/`F-<n>` ids it covers;
- `endpoints`/`integrations` — the `operationId`/`I-<slug>` ids this milestone delivers or
  relies on (`[]`/`none` where genuinely none — right-sizing, `DECISIONS.md` D-007);
- `budget: {turns, usd}` — an **explicit** number, not left at the template's `0` placeholder.
  A milestone without a stated budget isn't ready to plan against (the "explicit turn budget"
  operating lesson) — estimate from the milestone's own scope, and mark it as an assumption
  (§4/`assumed[]`) if it's a placeholder-quality guess rather than a measured one;
- `acceptance` — observable, testable condition(s) that close the milestone, not prose about
  intent.

## 4. Coverage rule — enforce it yourself before the gate does

Every screen and every feature belongs to **exactly one** milestone — never zero, never more
than one. Every endpoint and every integration belongs to **at least one**. Walk the lists from
step 2 against what you've assigned; a screen or feature in zero or in more than one milestone
is not a smaller D6, it's an incomplete one.

## 5. `MILESTONES.md` §3 — sequencing rationale

Why this order and not another — what a milestone depends on from the ones before it (a data
model dependency, an auth prerequisite). A milestone that could ship in any relative order
should say so explicitly rather than implying a dependency that isn't real.

## 6. Update `definition-status.yaml`

Set the `D6` stage's `status` to `awaiting-approval`; append genuine owner decisions
(especially the sequencing and any budget the owner adjusted) to `decided[]` and assumptions
(placeholder-quality budget estimates included) to `assumed[]`.

## 7. Run the coverage gate before asking for approval

Run `node .github/scripts/gate-definition-done.mjs`. Report the **D6 and DP-3
`*-missing-milestone` lines** specifically — those are this skill's own coverage, and a
milestone plan presented for approval with either kind still pending isn't ready to present.
Other stages' pending lines aren't this skill's job to resolve; name them once if present and
move on.

## 8. STOP at the human gate

Present `MILESTONES.md`, `milestones.yaml`, and the gate's coverage report together, and
**stop**. This skill never writes `Status: approved` on `MILESTONES.md` — that's the owner's
edit, once given, same convention as D1-D3.

## 9. On a later re-run, once the owner has approved

Record it in `project/state/definition-status.yaml`'s `D6` stage (`status: approved`,
`approved_by`, `date`) — only from the owner's explicit, current word, never inferred. At this
point every D0-D6 stage should be `approved` or `waived`; running `/fabric-init` next confirms
Definition Done.

## Rules

- Loads D6's context: approved `SPEC.md` and `ARCHITECTURE.md`, `screens.yaml`,
  `contracts/openapi.yaml`, `contracts/integrations.yaml`. Does not read `DESIGN.md` or any D4/
  D5 artifact — milestones group delivery, not visuals.
- Writes only `project/docs/MILESTONES.md`, `project/docs/milestones.yaml`, and the `D6` stage
  of `definition-status.yaml`.
- Never invents a screen, feature, endpoint, or integration — only groups what D2/D3 already
  declared. A gap found here (an endpoint nothing covers, a feature with no screen) is a defect
  in the upstream artifact, reported back, not patched silently in this skill's own output.
