---
description: Runs a project's design Foundation (once): reads project/design/assets/, explores 3 named directions, applies the anti-default self-critique, and produces the candidate DESIGN.md. Stops at the human gate — never approves identity. Usage: /design-foundation
---

> **Flag:** to be reshaped as `/design-foundation` (D4) in EVP2. What follows is the ported
> EVP1 baseline.

You're going to run this project's **design Foundation**, in the role of `design-director`
(`.claude/agents/design-director.md`). The Foundation runs **once per project** and produces
`DESIGN.md` — the visual source of truth every UI task will derive from afterward.

**Before starting, check whether it already ran.** If `project/design/DESIGN.md` exists with
`Status: approved`, **stop**: changing approved identity is a **new Decision Gate**, not a new
Foundation. If it exists with `Status: candidate`, you're resuming a candidate — continue from
where it left off instead of starting over.

Read the role contract first (`.claude/agents/design-director.md`), then execute the seven
steps below, in order.

## 1. Read all of `project/design/assets/` — R-ASSETS

Convention in `factory/templates/BRAND-ASSETS-template.md`. Read the four items, **including
the empty ones**: `logos/`, `images/`, `palette.md`, `references.md`.

**Note what you found in each** — this list is an output artifact and goes into `DESIGN.md`
§14. An existing asset is a **primary source**; creating from scratch only follows an absence
**proven by this reading**.

## 2. Read the input contract

- `project/docs/PRODUCT.md` **§8.1–8.3** — who buys and who receives, market and positioning,
  brand personality. The **[TO CONFIRM AT FOUNDATION]** fields are gaps this session
  **proposes** and the owner approves.
- The project's interface category **playbook** (`factory/docs/playbooks/README.md` routes
  to it). A *skeleton* playbook is a note, not authority; a category with no playbook is
  normal.
- `factory/docs/CRAFT-PRINCIPLES.md` and `.claude/rules/design-antipatterns.md` — the floor,
  which the Foundation doesn't lower.
- `factory/templates/DESIGN-template.md` — the template you'll fill in at step 6.

## 3. Consult the variety registry, if one exists

**If it doesn't exist as a file, record that and move on** — don't invent the registry. Where
it exists: converging with a recent project needs an **anchored justification** tied to the
product's context, app type, and business area.

## 4. Explore ≥3 NAMED, distinct directions

Three directions, **not** three variations on the same default. Each with:

- a **proper name** evoking a concrete world — an adjective ("modern," "clean," "premium") is
  forbidden by the template's §1;
- a **real reference** in the form *"the way X does Y"*, an **anti-reference** stating exactly
  what's refused, and a **candidate signature element** described by its mechanics;
- **the practical consequence** on typography, color, density, and motion, so the three are
  comparable.

Three proposals with the same type family, the same palette temperature, and the same density
are one direction and two adjustments: go back and redo it.

## 5. Anti-default self-critique

> **"Would a similar brief, handed to any generator, land on this same result?"**

If the honest answer is "probably yes," it's the default dressed up as a decision. **Write
what the self-critique changed** — what existed before, what changed after, and why. If
nothing changed, say so; a self-critique that changes nothing didn't happen.

## 6. Fill in the CANDIDATE `DESIGN.md`

Copy `factory/templates/DESIGN-template.md` to `DESIGN.md` at `project/design/DESIGN.md` and
fill it in **field by field**:

- delete the instruction lines (`<!-- HOW TO FILL: ... -->`, `> _Example:_`) and **keep** the
  "three rules of this document" section;
- **§0**: `Status: candidate`, today's date, **`Gate` field empty**, interface category and
  stack profile filled in;
- **no `[TO FILL]` left over**; a field that doesn't apply gets `Not applicable —` followed
  by the reason;
- **§4** with semantic tokens and **contrast verified here** (WCAG AA is the floor, not
  something the critic discovers);
- **§14** with each decision's provenance (`derived-from-asset` / `created-at-Foundation` /
  `inherited-from-existing-DS` + source) and the **list of assets read** in step 1;
- **§15**, first entry: the directions discarded in step 4, each with a reason tied to the
  product, the audience, or a concrete constraint.

## 7. STOP at the human gate

Present the result to the owner and **stop**.

### Output artifacts from this skill

1. **Candidate `DESIGN.md`** at `project/design/DESIGN.md` — complete template,
   `Status: candidate`.
2. **Summary of the 3 directions** — the three named ones, **which was chosen and why**, and
   what step 5's self-critique changed.
3. **List of what was read** in `project/design/assets/` — the same one backing §14.

### The gate

This skill **never** marks identity as approved: it doesn't write `Status: approved`, doesn't
fill in the `Gate` field, and doesn't derive UI code from the candidate. Identity approval is
always **the owner's** call (`factory/docs/AUTONOMY.md` §2, "Visual identity and narrative
voice").

Stopping here is the Foundation's **correct outcome**, not half-finished work. After approval,
Construction (`developer-lead` + `developer-frontend`) runs autonomously, **deriving** from
this file.
