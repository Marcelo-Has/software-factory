# C2 — Explainer page

**Dimension measured:** frontend and **design**. The only scenario with a visual-composition
score, and the most expensive one to evaluate (needs a deploy preview, axe, Lighthouse, and
screenshots). Measures whether the factory produces an interface that looks like it was made by
someone with taste, or the generic AI template — centered hero, three identical cards, purple
gradient.

**Issue title:** `[BENCH-C2] Explainer page` — created with no label.

---

## Issue body (copy from here)

## Context / Why

`<landing page>` currently has a short "How it works" section, a few steps in running text,
inside the home page itself. There's no **dedicated page** explaining the process for someone
who arrives unsure what the product is and what happens after they commit to it.

Read first: `<product scope doc>` (the product's promise and the flow it walks someone
through) and `<the module where the landing's copy lives>` — the new page's tone has to agree
with it.

## Objective

An `/how-it-works` page, responsive and accessible, that explains the process in a handful of
steps and takes the visitor to the start of the flow.

## Scope

- New route `<app/web path for the new page>`.
- **Short hero:** title + subtitle aligned with the promise in `<product scope doc>`. Don't
  invent positioning, a product name, or a new tone — that's a Decision Gate ("Visual identity
  and narrative voice", `factory/docs/AUTONOMY.md` §2).
- **A section with the process steps:** real, specific content per step (what the person does,
  what happens next). **No lorem ipsum, no placeholder copy.** Clear visual hierarchy between
  the steps and the rest of the page.
- **CTA** pointing to the start of the flow (today's actual entry route).
- **Responsive:** legible and well composed on mobile, tablet, and desktop.
- **Accessible:** correct heading hierarchy (one `h1`, no skipped `h2`/`h3` levels), sufficient
  contrast, visible focus, working keyboard navigation.
- **Link from the existing landing navigation** (`<landing page route>`), without rewriting the
  home page.

**Estimated size:** S/M — a static page plus the home link; the cost is in the visual care, not
the code volume.

## Out of scope

- Final marketing copy (a solid draft is enough).
- Final product images/illustrations.
- Any price or monetary value — that's a Decision Gate, PENDING. The "pay" step describes the
  moment, not the amount.
- Redesigning the home page or any other screen.

## Acceptance criteria

- [ ] `/how-it-works` renders with the hero, the process steps, and the CTA.
- [ ] The CTA leads to the flow's start route and navigation works.
- [ ] No placeholder text ("lorem ipsum", "TODO", "coming soon") on the page.
- [ ] The content is consistent with `<product scope doc>` — no promise the product doesn't
      make.
- [ ] Verifiable basic accessibility: a single `h1`, headings in order, visible focus, the whole
      page navigable by keyboard.
- [ ] Layout intact on mobile, tablet, and desktop.
- [ ] E2E: the page opens and the CTA navigates to the flow's start.
- [ ] `lint`, `test`, and `build` green in CI.

## Technical requirements / decisions

- `CLAUDE.md` and `.claude/rules/right-sizing.md`: framework defaults, no new CSS framework,
  and no componentizing something with only one use.
- **No new dependency** without explicit justification in the PR.
- If an image is used, it's optimized and has a meaningful `alt`.

## Likely files

- `<new page file>`
- `<a components dir>` (only if a component genuinely gets a second use)
- `<landing page route>` (link to the new page)
- `<new E2E spec file>`

## Required tests

E2E of the flow: opens the page, checks the steps, clicks the CTA, lands on the flow's start
route. Unit tests if any pure logic gets extracted.

## Dependencies

None.

## Definition of Done

- [ ] All acceptance criteria checked
- [ ] New tests passing; `lint`, `test`, and `build` green in CI
- [ ] Review and security review with no blocking finding
- [ ] No committed secrets and no PII in logs
- [ ] Small PR, referencing the issue with `Closes #<n>`

---

## Expected behavior (not part of the issue)

Direct delivery. This is the expensive scenario: the **Frontend/design** score (weight 3, see
`rubrics.md`) only applies to C2, and the prerequisite for a score ≥ 3 is objective —
axe-core with no serious violation, layout intact at 375/768/1280, and Lighthouse a11y ≥ 90.
Without that evidence collected, the design score is capped at 2, regardless of how good the PR
looks in the diff.

Signals to watch:

- Did it move past "four identical stacked cards" into a composition with its own rhythm?
- Are spacing and typography consistent with the home page, or does the page read as if it
  belongs to a different product?
- Do hover and focus states exist and look designed, or are they just the browser default?
- Did it invent a price, a delivery time, or a promise the product scope doc doesn't make?

## Harness note — instantiating this scenario

The bracketed placeholders above are filled in against the real product before the issue is
opened. Point the CTA and the "flow's start route" placeholders at whatever route genuinely
starts the product's flow today — a broken CTA target would fail the E2E criterion on a wording
mistake, not on the factory's own output, and this scenario would end up measuring the wrong
thing.
