---
description: Runs a project's D1 — instantiates PRODUCT-template.md into project/docs/PRODUCT.md, interviews the owner section by section, and stops at approval. Usage: /define-product
---

You're going to run this project's **D1 — `/define-product`**. It produces
`project/docs/PRODUCT.md` — the vision, audience, scope, and brand-positioning document every
later Definition-phase skill reads from (`/define-spec`, `/define-architecture`, and
`/design-foundation` in particular derive from §6). Same "stop at the human gate" pattern
`.claude/skills/design-foundation/SKILL.md` established for D4, applied here to D1.

## 1. Check whether it already ran

- `project/state/init.json` must exist — if it doesn't, stop and point the owner at `/init`
  (D0 comes first).
- If `project/docs/PRODUCT.md` exists with `Status: approved`, this is a **re-run**: changing
  an approved `PRODUCT.md` is a **Product change**, a Decision Gate
  (`factory/docs/AUTONOMY.md` §2) — record the change as a new entry in
  `project/docs/DECISIONS.md` before editing, don't silently overwrite an approved section.
- If it exists with `Status: candidate`, resume from where the interview left off (read what's
  filled vs. still `[TO FILL IN]`) instead of restarting section 1.
- If it doesn't exist, copy `factory/templates/PRODUCT-template.md` to
  `project/docs/PRODUCT.md` and start the interview at §1.

## 2. Interview the owner, section by section

Work through `PRODUCT.md`'s sections **in order** (§1 Vision → §2 Audience → §3 Jobs to be
done → §4 Scope v1 → §5 Out of scope → §6 Personality and brand positioning → §7 Open
assumptions), removing each `<!-- HOW TO FILL: ... -->` instruction line as its section is
filled and leaving no `[TO FILL IN]` behind — a `PRODUCT.md` with any `[TO FILL IN]` left in it
is not a candidate for approval (the template's own rule).

- Ask, don't assume: a genuine answer from the owner goes in the section; a call you had to
  make without asking goes in §7 **Open assumptions**, with the reason it was assumed and the
  risk if it's wrong — the same `decided[]` / `assumed[]` split
  `project/state/definition-status.yaml` tracks (`DECISIONS.md` D-009 §6).
- §6 (personality/positioning) is written for `/design-foundation` to read later — "reassuring
  and precise" is usable, "clean and modern" is not (the template bans generic adjectives here
  for exactly this reason).
- §5 (out of scope): every exclusion needs a reason tied to a real constraint, not "not
  important."

## 3. Update `definition-status.yaml`

Set the `D1` stage's `status` to `awaiting-approval`, and append every genuine owner answer to
`decided[]` and every assumption to `assumed[]` (mirroring what landed in `PRODUCT.md` §7).

## 4. STOP at the human gate

Present the filled candidate to the owner and **stop**. This skill never writes
`Status: approved` on `PRODUCT.md` itself — approval of the product's own scope is the owner's
act (`factory/docs/AUTONOMY.md` §2, "Product changes"), the same convention
`design-foundation` already uses for `DESIGN.md`. Flipping `PRODUCT.md`'s own `Status`/`Date`/
`Approved by` header fields is the owner's edit, not this skill's.

## 5. On a later re-run, once the owner has approved

When the owner has explicitly told you (in this conversation or a resumed one) that they
approve the current candidate, record that in `project/state/definition-status.yaml`'s `D1`
stage:

```yaml
D1:
  status: approved
  approved_by: <owner>
  date: <today, YYYY-MM-DD>
  waivers: []
  decided: [...]
  assumed: [...]
```

Never infer approval from silence or from the document merely looking complete — only from the
owner explicitly saying so, in this turn.

## Rules

- Loads only D1's context: `factory/templates/PRODUCT-template.md` and
  `project/state/init.json`. It does not read `SPEC.md`, `ARCHITECTURE.md`, or any D2+
  artifact — those don't exist yet and D1 doesn't need them.
- Writes only `project/docs/PRODUCT.md` and the `D1` stage of
  `project/state/definition-status.yaml`.
- Never decides the stack, features, or screens — those are D2/D3.
