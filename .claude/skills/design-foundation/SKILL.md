---
description: Runs a project's design Foundation (D4, once): reads project/design/assets/, the approved D1-D3 artifacts, and the category playbook; explores >=3 named directions with the anti-default self-critique; produces the candidate DESIGN.md, project/design/tokens.css, and project/design/DESIGN-DIGEST.md. Stops at the human gate — never approves identity. Usage: /design-foundation
---

You're going to run this project's **D4 — `/design-foundation`**, in the role of
`design-director` (`.claude/agents/design-director.md`). The Foundation runs **once per
project** and produces a trio together: the candidate `DESIGN.md` (the visual source of truth
every UI task derives from afterward), `project/design/tokens.css` (the canonical custom
properties Construction and D5 mockups consume), and `project/design/DESIGN-DIGEST.md` (the
compact operational summary Generation reads instead of the long docs).

## 1. Check whether it already ran

- `project/docs/PRODUCT.md`, `project/docs/SPEC.md`, and `project/docs/ARCHITECTURE.md` must
  all exist with `Status: approved` — D4 is built from approved D1, D2, and D3
  (`ARCHITECTURE.md` §2's stack decision is what fills `DESIGN.md` §0's "Stack profile"). If
  any of the three isn't approved yet, stop and point the owner at finishing that skill's
  approval first.
- If `project/design/DESIGN.md` exists with `Status: approved`, **stop**: changing approved
  identity is a **new Decision Gate**, not a new Foundation. If it exists with
  `Status: candidate`, you're resuming a candidate — continue from where it left off instead of
  starting over.

Read the role contract first (`.claude/agents/design-director.md`), then execute the steps
below, in order.

## 2. Read all of `project/design/assets/` — R-ASSETS

Convention in `factory/templates/BRAND-ASSETS-template.md`. Read the four items, **including
the empty ones**: `logos/`, `images/`, `palette.md`, `references.md`.

**Note what you found in each** — this list is an output artifact and goes into `DESIGN.md`
§14. An existing asset is a **primary source**; creating from scratch only follows an absence
**proven by this reading**.

## 3. Read the input contract

- **`project/docs/PRODUCT.md` §2 (Audience) and §6 (Personality and brand positioning)** — who
  this is for, how the product wants to be positioned, and what it's explicitly not. Per
  `PRODUCT-template.md`'s own header, §6 is "the bridge from product intent to `DESIGN.md`
  §1" — answer in product terms, never in visual terms.
- **`project/docs/SPEC.md`** (features and user flows) and **`project/docs/screens.yaml`** (the
  full screen inventory, by area) — to know every surface the identity needs to cover, not just
  the ones a first guess would picture.
- **`project/docs/ARCHITECTURE.md` §2** (the accepted stack table) — fills `DESIGN.md` §0's
  "Stack profile" field; the skill router reads that field to decide which component-mechanics
  skill applies (`factory/docs/SKILL-ROUTER.md`).
- The project's interface category **playbook**, routed from `factory/docs/playbooks/README.md`
  using the category the screens and `SPEC.md` point at. A *skeleton* playbook is a note, not
  authority; a category with no playbook is normal. **If any feature in `SPEC.md` crosses a
  system boundary** (or `project/docs/contracts/integrations.yaml` is non-empty), also read
  `factory/docs/playbooks/external-integration.md` — it's a cross-cutting DP-3 modifier, not
  selected through `DESIGN.md` §0, and it flags where error/degraded states need visual
  treatment (webhook failures, payment declines, retry states).
- `factory/docs/CRAFT-PRINCIPLES.md` and `.claude/rules/design-antipatterns.md` — the floor,
  which the Foundation doesn't lower.
- `factory/templates/DESIGN-template.md` — the template you'll fill in at step 7.

## 4. Consult the variety registry, if one exists

**If it doesn't exist as a file, record that and move on** — don't invent the registry. Where
it exists: converging with a recent project needs an **anchored justification** tied to the
product's context, app type, and business area.

## 5. Explore >=3 NAMED, distinct directions

Three directions, **not** three variations on the same default. Each with:

- a **proper name** evoking a concrete world — an adjective ("modern," "clean," "premium") is
  forbidden by the template's §1;
- a **real reference** in the form *"the way X does Y"*, an **anti-reference** stating exactly
  what's refused, and a **candidate signature element** described by its mechanics;
- **the practical consequence** on typography, color, density, and motion, so the three are
  comparable.

Three proposals with the same type family, the same palette temperature, and the same density
are one direction and two adjustments: go back and redo it.

## 6. Anti-default self-critique

> **"Would a similar brief, handed to any generator, land on this same result?"**

If the honest answer is "probably yes," it's the default dressed up as a decision. **Write
what the self-critique changed** — what existed before, what changed after, and why. If
nothing changed, say so; a self-critique that changes nothing didn't happen.

## 7. Fill in the CANDIDATE `DESIGN.md`

Copy `factory/templates/DESIGN-template.md` to `DESIGN.md` at `project/design/DESIGN.md` and
fill it in **field by field**:

- delete the instruction lines (`<!-- HOW TO FILL: ... -->`, `> _Example:_`) and **keep** the
  "three rules of this document" section;
- **§0**: `Status: candidate`, today's date, **`Gate` field empty**, interface category and
  stack profile filled in (the stack profile from step 3's `ARCHITECTURE.md` §2 read);
- **no `[TO FILL IN]` left over**; a field that doesn't apply gets `Not applicable —` followed
  by the reason;
- **§4** with semantic tokens and **contrast verified here** (WCAG AA is the floor, not
  something the critic discovers) — this table is what step 8 transcribes into `tokens.css`;
- **§14** with each decision's provenance (`derived-from-asset` / `created-in-Foundation` /
  `inherited-from-existing-DS` + source) and the **list of assets read** in step 2;
- **§15**, first entry: the directions discarded in step 5, each with a reason tied to the
  product, the audience, or a concrete constraint.

## 8. Derive `project/design/tokens.css`

`DESIGN.md` §4 is the source; `tokens.css` is a **transcription**, never a second opinion — a
value that exists in the CSS but not, byte-for-byte-equivalent, in a §4 table row is a design
decision made in silence. Write role-named custom properties on `:root`, covering every §4
subsection:

- **§4.1 Color by role**: `--surface`, `--surface-raised`, `--foreground`, `--muted`,
  `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--focus`.
- **§4.2 Spacing scale**: one `--space-<step>` per row of the scale, derived from the declared
  base.
- **§4.3 Radius**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
- **§4.4 Elevation**: `--elevation-0` … `--elevation-2` (or the "no elevation" answer, as a
  comment — there is nothing to declare as a property when the direction is flat).
- **§4.5 Typographic roles / §5 scale**: the font families (`--font-<role>`) and, from §5, one
  `--text-<step>` per scale step with its line-height companion.
- **§4.6 Motion**: `--duration-instant`, `--duration-base`, `--duration-deliberate`, and the
  named easing curve(s) (`--ease-<name>`).

This is the **canonical, full** set — every role, every scale step. It is **not** what a
mockup's inline token block copies directly: `factory/templates/mockup-template.html`'s block
uses a deliberately reduced name set (one spacing base, one radius per size, one motion base
duration+curve, the type ratio — no per-step scale), matching `DESIGN-DIGEST.md` §2's
quick-reference table one-for-one, not this file's. Step 9 below produces that mapping; D5
(`/design-mockups`) reads the digest for a mockup's token block and this file for anything the
digest's reduced set doesn't cover.

## 9. Derive `project/design/DESIGN-DIGEST.md`

Copy `factory/templates/DESIGN-DIGEST-template.md` to `project/design/DESIGN-DIGEST.md` and
fill it in — every value here is **copied** from the now-filled `DESIGN.md`/`tokens.css`,
never invented fresh. `Status: candidate`, mirroring `DESIGN.md`'s own header. Density over
completeness (the template's own instruction): terse rows, not prose restated.

## 10. Update `definition-status.yaml`

Set the `D4` stage's `status` to `awaiting-approval`; append genuine owner decisions to
`decided[]` and assumptions to `assumed[]`.

## 11. STOP at the human gate

Present the trio to the owner and **stop**.

### Output artifacts from this skill

1. **Candidate `DESIGN.md`** at `project/design/DESIGN.md` — complete template,
   `Status: candidate`.
2. **`project/design/tokens.css`** — the canonical transcription of `DESIGN.md` §4.
3. **`project/design/DESIGN-DIGEST.md`** — the compact operational summary, `Status: candidate`.
4. **Summary of the 3 directions** — the three named ones, **which was chosen and why**, and
   what step 6's self-critique changed.
5. **List of what was read** in `project/design/assets/` — the same one backing §14.

### The gate

This skill **never** marks identity as approved: it doesn't write `Status: approved` on any of
the three artifacts, doesn't fill in `DESIGN.md`'s `Gate` field, and doesn't derive UI code
from the candidate. Identity approval is always **the owner's** call
(`factory/docs/AUTONOMY.md` §2, "Visual identity and narrative voice").

Stopping here is the Foundation's **correct outcome**, not half-finished work. After approval,
Construction (`developer-lead` + `developer-frontend`) runs autonomously, **deriving** from
this trio, and D5 (`/design-mockups`) reads it to build the mockup inventory.

## 12. On a later re-run, once the owner has approved

Record it in `project/state/definition-status.yaml`'s `D4` stage (`status: approved`,
`approved_by`, `date`) — only from the owner's explicit, current word, never inferred. The
owner edits `DESIGN.md`'s own `Status`/`Gate` fields directly; this skill only mirrors that
into `definition-status.yaml`.

## Rules

- Loads D4's context: `project/design/assets/`, approved `PRODUCT.md`/`SPEC.md`/
  `ARCHITECTURE.md`, `screens.yaml`, the declared category's playbook (plus
  `external-integration.md` when the product has one), `CRAFT-PRINCIPLES.md`,
  `.claude/rules/design-antipatterns.md`.
- Writes only `project/design/DESIGN.md`, `project/design/tokens.css`,
  `project/design/DESIGN-DIGEST.md`, and the `D4` stage of `definition-status.yaml`.
- **You write a contract file, not UI code.** Markup, CSS, and components belong to
  `developer-frontend`, in Construction, deriving from what the owner approves.
