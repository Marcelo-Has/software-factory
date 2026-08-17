---
description: Creates an issue in the repo's standard format, checking dependencies and Decision Gates first. Usage: /new-issue <code> <short title>
argument-hint: <code> <short title>
---

You're going to draft a well-specified issue. Arguments: `$ARGUMENTS` (e.g., `F2-06 generation engine`).

## Steps
1. Read `project/docs/ROADMAP.md`, `project/docs/PRODUCT.md`, `factory/docs/FACTORY.md`, and
   `project/docs/DECISIONS.md` for the item's context.
2. **Decision Gate:** if the item touches a pending decision in
   `factory/docs/AUTONOMY.md`/`project/docs/AUTONOMY.md`, or is marked `[gate]` in the
   ROADMAP, create it as **`decision-needed`** (Options + Recommendation + what's blocking),
   NOT as `status:ready`.
3. Otherwise, draft it in the **standard format**:
   Context/Why · Goal · Scope · Out of scope · Acceptance criteria (verifiable) · Technical
   requirements/decisions · Likely files · Required tests · Dependencies (blocked by /
   blocks) · Definition of Done.
   **ROADMAP line:** if the item's code **doesn't exist** in `project/docs/ROADMAP.md` —
   decomposing an existing item, or a product task the plan didn't foresee — the Scope
   section states the **exact line** to add (code, phase, position). The `developer-lead`
   writes the file, in the PR. An `FU-xx` follow-up never becomes a ROADMAP line.
4. Apply the right labels (`status:ready` or `decision-needed`; `phase-N`; `area:*`).
5. **Show the draft and STOP** for approval before creating it.
6. Once approved, create it with `gh issue create` and return the link.

## Golden rules
- One issue = one small, coherent unit (a PR reviewable in a few minutes).
- Criteria always verifiable; always state "Out of scope"; always point to likely files.
- Don't inflate scope; if it's two things, it's two issues.
