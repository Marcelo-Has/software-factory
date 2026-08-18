---
name: Factory task
about: Mandatory pattern for every unit of factory work. Specify enough that the developer-lead can implement without guessing.
title: "[F?] "
labels: ""
assignees: ""
---

<!--
How to use (human or Supervisor):
- Replace the `?` in the title with the phase number (e.g. `[F1] SvelteKit app scaffold`).
- Label: `status:ready` when the task is ready to implement; `decision-needed` when it
  touches a Decision Gate or a PENDING decision from `DECISIONS.md` — in that case the
  issue carries Options + Recommendation + what's blocking, and does NOT get
  `status:ready`.
- Can't fill everything in yourself? Use `refine:requested` instead of `status:ready`:
  the `refiner` (`.claude/agents/refiner.md`) analyzes it, publishes a REFINEMENT REPORT
  on the issue, the owner decides by commenting, and the spec comes back complete. Fill in
  the **Refinement** section saying what's still open. It's opt-in: an already-complete
  issue goes straight to `status:ready`.
- Fill in every section. A section that doesn't apply: write "n/a" and why — don't delete it.
- **Visual requirements is MANDATORY when the issue has the `area:frontend` label**:
  without VERIFIABLE visual criteria there, a frontend issue is NOT ready for
  `status:ready` — it goes back to spec, not into the queue.
- **Behavior / integration requirements is MANDATORY when the issue has the
  `area:backend` label**: without VERIFIABLE behavior/integration criteria there, a
  backend issue is NOT ready for `status:ready` — it goes back to spec, not into the
  queue.
- Delete these comments before publishing.
-->

## Context / Why
<!-- Where this fits in the ROADMAP/PRODUCT, what already exists, what motivated the task.
     Cite the documents to read before implementing. -->

## Objective
<!-- One sentence: the observable result once the issue is done. -->

## Scope
<!-- What this issue delivers, as concrete items. Small, reviewable PR.
     Start with size: does it fit in ~40 developer-lead turns? If not,
     decompose into ordered issues instead of estimating "L". -->

**Estimated size:** <!-- S | M | L + one sentence of justification -->

## Out of scope
<!-- What this issue must NOT do (and which issue/phase it belongs to instead). Explicit, not implied. -->

## Acceptance criteria
<!-- Verifiable checklist: every item has to be checkable by someone reading the PR
     or running a command. No "works well". -->
- [ ]
- [ ]
- [ ]

## Visual requirements
<!-- MANDATORY if the issue has the `area:frontend` label. Without VERIFIABLE visual
     criteria here, a frontend issue is not ready for `status:ready`.
     VERIFIABLE = someone can REJECT the PR by looking at the result and this text.
     "Follow the design", "look nice", and "responsive" are not requirements — there's no
     way to fail a PR against them. Fill in all four items; an issue that doesn't touch the
     interface writes "n/a — doesn't touch the interface" and deletes the rest. -->

- **Screens / components and states delivered:** <!-- which routes, screens, or components
  this issue delivers, and what state each ends in (new, changed, still a placeholder). -->
- **Behavior per viewport (375 / 768 / 1280):** <!-- what CHANGES IN INTENT at each of the
  three widths from the Visual Verification Loop — not the consequence of the space
  shrinking. Derive from the active `project/design/DESIGN.md`. Also say what does NOT
  change at any width. -->
- **States beyond the happy path:** <!-- for every component that loads data: empty,
  loading, error, overflow (the worst plausible content), and offline/degraded — with the
  text and shape of each, per `project/design/DESIGN.md`. Plus interaction states: hover,
  active, disabled, selected, and VISIBLE FOCUS. Only the happy state implemented is a
  review finding. -->
- **Consistency with the contracts:** <!-- which sections of the approved
  `project/design/DESIGN.md` this UI derives from (tokens, typography, grid, signature)
  and what the category's playbook (`factory/docs/playbooks/`) additionally requires. A
  value invented outside `DESIGN.md` is a finding. If the issue needs to deviate from
  `DESIGN.md`, that's a Decision Gate — not something to decide here. -->

## Behavior / integration requirements
<!-- MANDATORY if the issue has the `area:backend` label. Without VERIFIABLE
     behavior/integration criteria here, a backend issue is not ready for `status:ready`.
     VERIFIABLE = someone can REJECT the PR by looking at the result and this text.
     "Handle errors properly" and "make it robust" are not requirements — there's no way to
     fail a PR against them. Fill in all three items; an issue that doesn't touch a route,
     handler, contract, or integration writes "n/a — doesn't touch behavior/integration"
     and deletes the rest. -->

- **Routes / handlers and states delivered:** <!-- which `operationId`(s) or webhook
  handler(s) this issue delivers or changes, and what state each ends in (new, changed,
  still a placeholder). -->
- **Contracts and events touched:** <!-- which entries in `project/docs/contracts/
  openapi.yaml` and/or `contracts/integrations.yaml` this issue reads or changes, and
  which events/webhooks are involved. A contract change invented outside those files is a
  finding — update the contract first. -->
- **Mandatory scenario classes covered:** <!-- for every `operationId`/integration this
  issue touches: which of the five DECISIONS.md D-007 classes (`@happy`, `@duplicate`,
  `@external-failure`, `@invalid`, `@unauthorized`) apply here, and where each is covered
  in `project/docs/behaviors/*.feature`. Only the happy path covered is a review finding. -->

## Technical requirements / decisions
<!-- Decisions from DECISIONS.md that apply, relevant rules from `.claude/rules/`,
     security/cost/performance constraints. If the task runs into a PENDING decision,
     say which one and how to work around it without deciding it yourself. -->

## Likely files
<!-- Paths the implementation should touch (and shouldn't). See factory/docs/REPO-STRUCTURE.md. -->

## Required tests
<!-- Which tests need to exist/pass: unit, component, E2E, style tests against golden
     samples, lint / test / build. -->

## Refinement
<!-- What you deliberately left open — instead of guessing and passing the guess along as
     if it were spec. List the decisions that aren't yours to make yet, each with what
     depends on it. Label the issue `refine:requested` and the `refiner` turns this list
     into questions with options, a recommendation, and a default.
     Nothing open? Write "nothing open — spec complete" and use `status:ready`. -->

## Dependencies
<!-- Issues that need to be closed first, Decision Gates that need an answer,
     external secrets/accounts required. "None" if unblocked. -->

## Definition of Done
- [ ] All acceptance criteria checked
- [ ] New/updated tests passing; lint, test, and build green in CI
- [ ] Review and security review with no blocking finding
- [ ] No committed secrets and no PII in logs
- [ ] Small PR, referencing the issue with `Closes #<n>`
- [ ] Documentation updated when behavior changes (README.md, docs/)
- [ ] New decision recorded in DECISIONS.md, if one was made
