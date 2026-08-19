---
description: Runs a project's D5 — builds self-contained static HTML mockups for 100% of screens.yaml's inventory x mockup_states, named by the filename contract, generated and approved in batches by screen area; runs the coverage gate before finishing. Usage: /design-mockups
---

You're going to run this project's **D5 — `/design-mockups`**. It produces one static HTML
file per `(screen, mockup_state)` pair in `project/docs/screens.yaml`'s inventory, under
`project/design/mockups/`.

> **Mockups are intent targets, not pixel contracts.** They exist to make a screen's shape,
> content, and states legible before Construction builds the real thing — not to be diffed
> pixel-for-pixel against what `developer-frontend` eventually ships. A mockup that
> communicates the layout, the copy, and the state honestly has done its job even if the built
> screen refines it.

## 1. Check whether it already ran

- `project/design/DESIGN.md` must exist with `Status: approved`, and
  `project/design/tokens.css` and `project/design/DESIGN-DIGEST.md` must exist — D5 derives
  from D4's approved trio, never from a candidate (`factory/docs/AUTONOMY.md` §2). If `DESIGN.md`
  is still `candidate`, stop and point the owner at finishing `/design-foundation`'s approval
  first.
- `project/docs/screens.yaml` must exist (from D2, `/define-spec`) — it's the inventory this
  skill covers exhaustively.
- **Compute the coverage gap before doing anything else**: for every screen in `screens.yaml`,
  for every state in its `mockup_states`, the expected filename is `<screen-id>.html` for
  `default` or `<screen-id>--<state>.html` otherwise (`DECISIONS.md` D-009 §4). Diff that
  expected set against what already exists (non-placeholder, above the minimum size) in
  `project/design/mockups/` — resume by building only what's missing instead of regenerating
  everything.

## 2. Read the inputs

- `project/docs/screens.yaml` — the inventory and each screen's `states`/`mockup_states`.
- `project/design/DESIGN.md` (approved), `project/design/tokens.css`, and
  `project/design/DESIGN-DIGEST.md` — the identity and its operational digest. Reach for the
  digest first during batch work; open the full `DESIGN.md` when a decision isn't in it.
- The category playbook(s) that applied at the Foundation (`DESIGN.md` §0's declared category,
  routed via `factory/docs/playbooks/README.md`), plus `external-integration.md` when the
  screen's states include a boundary-crossing flow (payment failure, webhook-driven status,
  etc.) — the same routing `/design-foundation` used, now applied per screen.
- `factory/docs/CRAFT-PRINCIPLES.md`'s mandatory-states floor — a screen's `mockup_states`
  should already reflect this from D2, but a state whose content doesn't honestly represent
  what that state looks like (a generic spinner where a skeleton belongs, an empty state with
  no actual empty-state copy) is a defect in the mockup, not a smaller mockup.

## 3. Batch by screen area

Group the remaining work by `screens.yaml`'s `area` field (`marketing`, `app`, `admin`,
`email`) — a coherent batch a reviewer can look at together, rather than one file at a time or
the whole inventory at once. Within an area, do every screen's `default` state first, then its
other `mockup_states`, so a batch is reviewable screen by screen.

## 4. Build each mockup

Copy `factory/templates/mockup-template.html` to
`project/design/mockups/<screen-id>.html` (or `--<state>.html`), then:

- fill the meta comment's `screen-id`/`state`, and remove the template's HTML comment block and
  the `PLACEHOLDER — remove before instantiating` notice — `gate-definition-done.mjs` treats
  that notice's presence as proof the file is still unedited;
- replace the token block's placeholder values with the **real** values from
  `project/design/DESIGN-DIGEST.md` §2 — the template's property names
  (`--surface`, `--foreground`, `--accent`, `--destructive`/`--success`/`--warning`,
  `--border`/`--focus`, `--spacing-base`, `--radius-sm`/`--md`/`--lg`/`--full`, `--type-ratio`,
  `--motion-duration-base`, `--motion-curve-base`) are exactly the digest's §2 quick-reference
  rows, one-for-one — never invented here, and never the full per-step scale from
  `project/design/tokens.css` (the digest already picked the one representative value a
  self-contained mockup needs);
- if the approved `DESIGN.md` §4.5 names a typeface other than the system-UI stack, add an
  explicit `font-family` rule using it (copied from `tokens.css`/`DESIGN.md` §4.5, never
  guessed) — the template's own block has no font-family slot to override, since its default
  assumes no typeface identity is set yet;
- build the screen's actual markup and copy for this exact state — every data-bearing element
  in the shape this state requires, matching `DESIGN.md` §11's per-component state definitions
  where the screen has one;
- self-contained only: inline CSS, no external stylesheet, script, font, or image request.

## 5. Present each batch and record its approval

When an area's batch is complete, present it to the owner. Once they approve it, append a
`decided[]` entry to the `D5` stage of `project/state/definition-status.yaml` naming the batch
and its screens (e.g. `"Batch app (S-billing, S-invoices) approved by <owner> on <date>."`) —
this is the record the plan calls for, not yet the stage-level `approved` status (see step 7).

## 6. Repeat until 100% of the inventory is covered

Continue by area until every `(screen, mockup_state)` pair from step 1's gap analysis has a
file and an owner-approved batch entry.

## 7. Update `definition-status.yaml` and run the coverage gate

Set the `D5` stage's `status` to `awaiting-approval` once every batch is built (whether or not
every batch has owner sign-off yet — that distinction lives in `decided[]`, per step 5). Then
run `node .github/scripts/gate-definition-done.mjs` and report the **D5-area lines only** from
its pending-items table — other stages' pendings aren't this skill's job to resolve or report
in detail, name them once and move on.

If any D5 pending item remains (a missing file, a file under the minimum size, or a file still
carrying the placeholder notice), that's real remaining mockup coverage — say so explicitly,
by filename, rather than declaring the batch done.

## 8. STOP at the human gate

Present the full batch history and the gate's D5 coverage report, and **stop**. This skill
never writes the `D5` stage's `status` to `approved` — same convention as D1-D4: the skill
records what the owner said batch by batch, but the stage-level sign-off is the owner's
explicit, current word, captured on a later re-run.

## 9. On a later re-run, once the owner has approved

Record it in `project/state/definition-status.yaml`'s `D5` stage (`status: approved`,
`approved_by`, `date`) — only from the owner's explicit, current word, never inferred.

## Rules

- Loads D5's context: `screens.yaml`, the approved `DESIGN.md`/`tokens.css`/
  `DESIGN-DIGEST.md`, the applicable playbook(s), `CRAFT-PRINCIPLES.md`.
- Writes only `project/design/mockups/*.html` and the `D5` stage of
  `definition-status.yaml`.
- Never invents a token, a screen, or a state that isn't already declared upstream — a mockup
  that needs a new state means `screens.yaml` (D2) is incomplete, not that this skill should
  freelance one in.
