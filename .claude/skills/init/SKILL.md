---
description: Runs a project's D0 — creates the project/ structure, instantiates state/init.json (the GR-10 marker), state/definition-status.yaml, and docs/DECISIONS.md, then shows the road ahead. Usage: /init
---

You're going to run this project's **D0 — `/init`**, the first step of the Definition Phase.
D0 configures the product's workspace; it never decides anything about the product itself — no
vision, no features, no stack. Those are D1 (`/define-product`), D2 (`/define-spec`), and D3
(`/define-architecture`) — see `.github/scripts/gate-definition-done.mjs`'s `STAGE_SKILL` map
for the full D0–D6 stage-to-skill routing this and every later Definition skill follows.

**This is also where GR-10 arms.** `project/state/init.json` is the marker
`.claude/hooks/guard-core-writes.mjs` checks for product mode (`factory/docs/FACTORY.md`'s
guard-rail table, row "GR-10 — product-session core immutability"). Once this skill finishes,
`factory/`, `.claude/`, `.github/`, `CLAUDE.md`, and root `DECISIONS.md` become immutable for
the rest of this product's life — that's by design, not a side effect to work around.

## 1. Check whether it already ran

If `project/state/init.json` already exists, this is a **re-run**, not a fresh start. Read it,
report the current `name`/`language`/`owner`/`created` values, and skip straight to step 6 (the
gate check) — do not recreate the structure or overwrite `definition-status.yaml`. Changing
`name` or `owner` after D0 is a **Product change**, a Decision Gate per
`factory/docs/AUTONOMY.md` §2 — record it as a new entry in `project/docs/DECISIONS.md` (once
that file exists) instead of silently editing `init.json` in place.

## 2. Gather the three D0 inputs

Ask the owner directly for whatever isn't already known from the conversation:

- **name** — the product's name.
- **language** — the language code `project/**` will be written in (e.g. `en`, `pt-BR`). This
  configures the product's own docs only; the core (`factory/`, `.claude/`, `.github/`,
  `CLAUDE.md`, root `DECISIONS.md`) stays 100% English regardless of this answer
  (`DECISIONS.md` D-009 §8) — say so if the owner asks why.
- **owner** — the product owner's name or handle, the identity every Definition-phase gate
  records approval against.

## 3. Create the `project/` structure

Per `DECISIONS.md` D-009 §6 and `gate-definition-done.mjs`'s structure check, create every
directory below under `project/` if it doesn't already exist:

```
project/
├── docs/
│   ├── contracts/
│   └── behaviors/
├── design/
│   ├── assets/
│   │   ├── logos/
│   │   ├── images/
│   │   ├── palette.md
│   │   └── references.md
│   └── mockups/
└── state/
```

`logos/` and `images/` start empty (a `.gitkeep` each, so git tracks the empty directory);
`palette.md` and `references.md` start as empty files — `design-foundation`'s R-ASSETS step
(`.claude/skills/design-foundation/SKILL.md` §1) reads all four `project/design/assets/` items
explicitly expecting some of them to be empty. Remove any placeholder `.gitkeep` this creation
step makes redundant (e.g. a bare `project/docs/.gitkeep` once `project/docs/` holds real
subdirectories) — a leftover placeholder next to real content reads as forgotten, not
intentional.

## 4. Instantiate `state/init.json`

Copy `factory/templates/init-template.json` to `project/state/init.json` and fill in the three
values from step 2, plus `created` (today's date, `YYYY-MM-DD`).

## 5. Instantiate `state/definition-status.yaml`

Copy `factory/templates/definition-status-template.yaml` to
`project/state/definition-status.yaml` unedited — every stage starts `pending`. Later skills
(including this one, on re-run) update it; `/init` only creates it.

## 6. Instantiate `docs/DECISIONS.md`

Copy `factory/templates/PROJECT-DECISIONS-template.md` to `project/docs/DECISIONS.md`, written
in the language from step 2. This is the product's **own** decision log — separate numbering
(`D-001`, its own sequence) from this repo's core `DECISIONS.md`. From now on,
`answer-decision` and every Definition skill that makes an unasked-for call record it here.

## 7. Record D0 in `definition-status.yaml`

D0's gate is mechanical — structure exists and the three inputs are confirmed — there's no
candidate/approved document to hold a Decision Gate open the way D1's `PRODUCT.md` does. The moment the owner has confirmed the three inputs in step 2 and the structure in step 3
exists, set the `D0` stage in `project/state/definition-status.yaml` to:

```yaml
D0:
  status: approved
  approved_by: <owner, from step 2>
  date: <today, YYYY-MM-DD>
  waivers: []
  decided:
    - Product name, language, and owner confirmed at kickoff.
  assumed: []
```

## 8. Show the road ahead

Run `node .github/scripts/gate-definition-done.mjs` and show the owner the pending-items table.
Every remaining line points to the next skill (`/define-product` first). Tell the owner they can re-run this check any time via `/fabric-init` once that orchestrator
exists — `/init` itself doesn't route them anywhere, it only reports.

## Rules

- Configures; **never decides the stack** — that's D3's job, reading
  `factory/profiles/PROFILES.md`, not this skill's.
- Writes only under `project/`, and only the files/directories named above.
- Re-runnable: a second invocation reports current state and moves straight to step 6 instead
  of recreating anything.
