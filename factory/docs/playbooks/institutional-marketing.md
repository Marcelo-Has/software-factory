# Playbook — institutional / marketing

> **Category:** institutional site, product page, conversion landing page.
> **State:** complete — an example from the origin project's own product category.
>
> **What this is.** The **strategy** for this interface category: where the Foundation spends
> its effort, what `design-critic` scrutinizes harder, what category-specific gates activate,
> and which traps this category produces on its own.
>
> **What this is NOT.** There is no identity choice here — no palette, no font, no style, no
> direction name. Identity is the project's own `DESIGN.md`, and only that. This playbook
> doesn't lower anything either: `factory/docs/CRAFT-PRINCIPLES.md` is the floor and
> `.claude/rules/design-antipatterns.md` always applies. See
> `factory/docs/playbooks/README.md`.

---

## 1. Where the Foundation focuses

This category's `DESIGN.md` is filled in whole, like any other. What changes is **where the
Foundation spends its time** and what it needs to deliver on top of the baseline.

### 1.1 Persuasive hierarchy — the reading order is an argument

Craft §1 requires a screen to answer "what does the eye see first, second, third?" In this
category the answer isn't only visual: **it's the order of the argument.** The whole page has
one line of reasoning — promise → proof → objection answered → action — and the visual
hierarchy exists to serve it.

- Write the page's argument in **one line**, before any wireframe. It goes into `DESIGN.md`
  §6, alongside each key screen's reading order.
- **Every section has a nameable job in the argument.** A section that can't say which
  objection it answers or which proof it delivers isn't a section — it's filler, and it goes.
- One page, **one primary action.** Everything else is secondary and visually demoted —
  demoting the secondary is just as much an act of hierarchy as promoting the primary (craft
  §1).

### 1.2 Narrative and conversion — the sequence is designed, not arrived at

- Declare the **sequence of sections** and the reason for each position. The order in which
  objections appear is a design decision, not the result of stacking blocks as they come.
- Map the audience's **real objections** and say where each one is answered. An objection the
  page doesn't answer is a conversion lost silently.
- Every section also declares **what it doesn't do** — so the next one doesn't repeat the same
  work in a different shape.

### 1.3 Emotional weight of the first fold

- The first fold is where the product's promise **is felt**, not explained. Declare in
  `DESIGN.md` §6, on the key screen's wireframe, **what the person should feel** there — in one
  sentence anchored in the product and the audience, never in an adjective about appearance.
- The **visual signature** (`DESIGN.md` §3) needs to be present above the fold. If the first
  fold is recognizable without the logo, it's a fold; if not, it's just a header.
- **Low density** (craft §7): reading and emotional decision-making. The time is the user's.

### 1.4 Copy as the protagonist

Here, copy isn't design material like on any other screen (craft §9) — it's **the page's
product.** The layout derives from the real text, never the other way around.

- **Real text first, layout second.** A title that only works at the length you imagined
  doesn't work.
- Run the real text at all three Visual Verification Loop breakpoints (375/768/1280) before
  considering the composition resolved.
- One voice register per page, declared in `DESIGN.md` §9.

---

## 2. `design-critic`'s extra rubric

Adds to — never replaces — the `[CRITIC]` checklist in `.claude/rules/design-antipatterns.md`
and the "could this have come from any similar prompt?" test. Runs **post-render**, on the
screenshots.

### 2.1 Value proposition clarity in 5 seconds

Test: **cover everything below the first fold** and answer, in five seconds, looking only at
what's left:

1. **What** this product is;
2. **for whom**;
3. **what changes** for whoever buys it.

Any of the three fails, or the answer required scrolling? **Finding.** And the finding belongs
to the fold's hierarchy, not to a lack of text — adding a paragraph usually makes it worse.

### 2.2 An unambiguous CTA

- **One** primary action per page, visually unambiguous.
- The label **names the action it performs** (craft §9) and makes what happens next
  predictable. "See the preview" says what's coming; "Get started" says nothing.
- Two controls with the **same intent** and different labels on the same page is a finding.
- A repeated CTA down the page is legitimate — as long as it's **the same label and the same
  action**.

### 2.3 Social proof without cliche

- Proof is **named, specific, and verifiable**. A testimonial from a generic invented name is
  example data, not proof; an implausibly round number presented as real (99.9%, 10x) is a
  finding.
- Generic proof is **worse than none**: it triggers exactly the suspicion the page was trying
  to dissolve.
- No fake product screenshot assembled from styled `div`s, and no hand-drawn SVG imitating a
  scene or a photo. If there's no real proof yet, ship the section **empty and flagged**, never
  invented.

---

## 3. Category gates and attentions

In this category the page **is** the acquisition channel. Performance and SEO aren't future
polish — they're a phase requirement, and they don't fall into the deferral filter that other
work might.

### 3.1 Performance and LCP

- **The LCP element is a design decision**, made in the Foundation and written into
  `DESIGN.md` §6 — not something discovered by measuring afterward.
- The LCP image: dimensions declared, priority loading, **no** `lazy`. What's below the fold
  is what loads late.
- **Content is born visible** (craft §8). Text that starts at `opacity: 0` waiting for JS is a
  finding, and it's also an artificially delayed LCP.
- Fonts with a declared fallback and no invisible-text flash — the typographic voice comes
  from `DESIGN.md` §4.5; **how** it loads is this category's gate.

### 3.2 Basic technical SEO

- **One** `h1` per page; heading order without gaps. The heading structure is the argument's
  structure — the same structure serves the screen reader and the search engine.
- **Real, specific** `title` and meta description, written in the voice from `DESIGN.md` §9.
  The same copy rules apply: no buzzwords, no poetic placeholder.
- Real `alt` text on every non-decorative image; decorative images get `alt=""`.
- Semantic HTML with unique landmarks (craft §10).
- The **share image** (OG) is a design deliverable, carrying the signature from §3 — not an
  afterthought generated at the end.

### 3.3 Optimized images

- A modern format with a fallback; `width` and `height` declared everywhere, so there's no
  layout shift.
- Real responsive variants: serving the 1280px image at 375px is pure cost on the device most
  visitors arrive on.
- A user's own photo, when it exists, follows the product's privacy policy **and** the
  signed-and-expiring-URL rule — optimizing never turns into a public cache.

---

## 4. Traps this category produces

These anti-patterns are the ones **this category produces on its own**, by reflex. The general
policy still applies: none is absolutely forbidden, all require a justification recorded in
`DESIGN.md`, tied to *this* product and *this* audience.

| Trap | What causes it |
| --- | --- |
| **Template hero** | Badge + title + subtitle + two buttons is the default that appears by itself when nobody decided the first fold. It usually comes with a giant italic display serif, a purple-to-cyan gradient, gradient text, and a scroll hint. |
| **Identical showcase sections** | Three identical cards as a structure, and three sections in the same layout family, are what makes a page look like a mold. An all-caps eyebrow above every title, decorative `01/02/03` numbering, and an icon in a rounded tile above every title are the decoration that tries to disguise it. |
| **Generic testimonials** | Social proof is the section easiest to fill with nothing: an invented name, a round number, a fake screenshot, lorem ipsum, or a poetic filler sentence. |
| **Marketing copy by reflex** | Buzzwords, a generic CTA, a repeated "it's not X, it's Y" cadence, an em-dash used as default punctuation, and more than one voice register on the same screen. |
| **Motion as a substitute for hierarchy** | A cascading entrance animation on every section, and easing with overshoot, tend to appear exactly when the static hierarchy isn't resolved. A missing `prefers-reduced-motion` block comes in the same package. |
| **Product-page noise** | A decorative metadata strip, an auto-scrolling marquee, a striped/grid background with no surface that calls for it. |

States are missing from this list too: an institutional page also has forms, submission, and
error handling. Only the happy path implemented is a finding, a generic spinner where a
skeleton would do is a finding, and an error message that names neither the problem nor the
way out is a finding.

---

## 5. What this playbook doesn't decide

- **Identity** — direction name, palette, typographic families, signature, tone of voice: all
  of that is the project's own `DESIGN.md` (`factory/templates/DESIGN-template.md`), approved
  through a Decision Gate.
- **Craft floor** — `factory/docs/CRAFT-PRINCIPLES.md` applies in full, no category discount.
- **Active aesthetic-direction skill** — that's `factory/docs/SKILL-ROUTER.md`'s call, per
  project.
