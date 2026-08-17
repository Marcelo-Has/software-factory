# Visual craft principles

> **What this is.** The visual-quality floor for the factory. It applies to **any** interface
> this factory produces, with any framework, under any active aesthetic direction. It does not
> describe *taste* for a given project — that's the job of that project's own `DESIGN.md`
> (see `factory/templates/DESIGN-template.md`). It describes the **mechanics** that separate a
> built screen from an assembled one.
>
> **Why this exists.** A benchmark run against the origin project measured the factory
> generating UI that was technically correct and visually mute — perfect on automated
> accessibility checks, low on visual craft. Accessibility is testable automatically; craft
> isn't — it has to be written down. This is where.
>
> **Authority order.** A project's own `DESIGN.md` > this document > any aesthetic-direction
> skill. See `factory/docs/SKILL-ROUTER.md`. What's banned as an unconscious default lives in
> `.claude/rules/design-antipatterns.md`.

---

## 1. Visual hierarchy

Every screen answers one question before any other: **what does the eye see first, second,
third?** If the answer is "it depends," there is no hierarchy — there's a list.

- Decide the reading order **before** writing any CSS, and write it in one sentence. If it
  doesn't fit in one sentence, the screen is doing two things.
- Hierarchy is built with **four levers**: size, weight, color/contrast, and space. Use two or
  three of them with conviction; using all four everywhere flattens everything back to nothing.
- **Space is the cheapest lever and the least used.** Grouping by proximity solves what boxes,
  borders, and shadows try to solve by decoration.
- The most important element gets **one** distinguishing treatment, not all of them.
- Not everything needs to compete: demoting the secondary content is just as much an act of
  hierarchy as promoting the primary one, and it usually costs less.
- A container (card, panel, border) is not hierarchy. Use one only when elevation communicates
  a real difference in layer — otherwise group with space, a thin divider, or typography.

## 2. Typographic system

Typography is the largest surface on the screen. It's the main place the "default LLM voice"
shows up — and the cheapest one to fix.

- **Roles before sizes.** Define the roles the product actually has (display, section
  heading, body, support, label, numeric data) and give each one a token. A new component
  picks an existing role; it never invents a size.
- **A scale, not loose values.** A scale with few steps and a perceptible ratio (roughly
  1.2–1.33 between steps). A scale with ten nearly-identical steps is the same as no scale.
- **Weight contrast is mandatory.** A healthy system has one distant pair — something like
  **200 and 800**, or 300 and 700. A screen that's entirely 400/500 is the number-one
  typographic symptom of an interface generated without a decision: everything speaks at the
  same volume.
- **One family, two at most**, and the second only with a declared role (e.g. mono only for
  data, code, or measurement — never as a "technical" costume).
- **Line measure between 45 and 75 characters.** Above that the eye loses the line on the way
  back; below it, the text turns into a saw blade.
- Line-height inversely proportional to size: a large title breathes little, body text
  breathes more.
- Negative `letter-spacing` is an optical adjustment for display type, not an effect. Past
  -0.04em it destroys the letterforms.
- Run **real copy** at every breakpoint. A title that only works with your placeholder text
  doesn't work.

## 3. Spacing system

Spacing is the invisible grammar. When it's consistent nobody notices; when it isn't,
everything looks slightly wrong without anyone being able to say why.

- **One scale, derived from a base** (typically 4px or 8px). Every gap, padding, and margin
  value comes from it. A magic number in the middle of a component is debt.
- **Rhythm, not uniformity.** The same value between everything isn't a system — it's the
  absence of a decision. Related items sit **tight**; different groups sit **generously
  apart**. The distance between blocks should be visibly larger than the distance inside a
  block.
- **More space above a title than below it.** A title belongs to what comes after it.
- Vertical rhythm: sections on the same page use the same breathing interval. A section with
  half the padding of its neighbors reads as a bug, not as emphasis.
- A component's internal spacing scales with its density (see §7), not with the mood of the
  moment.

## 4. Semantic color

**Role before hue.** The right question is never "which blue?" — it's "what does this color
*mean*?"

- Name by function — `surface`, `surface-raised`, `text`, `text-muted`, `border`, `accent`,
  `danger`, `success` — never by appearance (`blue-500`, `light-gray`). Rebranding a product
  should mean swapping the value behind the token, not hunting for hex codes in the code.
- **One accent.** A product with three highlight colors has no highlight. A semantic state
  (error, success, warning) is a declared exception, not a second accent.
- **Neutrals are not pure gray.** Neutrals with a hint of the accent's temperature tie the
  palette together; `#000` and fully desaturated grays are the default of someone who didn't
  choose.
- Secondary text on a colored surface derives from that **surface's own color** (darker or
  lighter), not from a neutral gray — gray over color always looks dirty.
- Color is never the only carrier of information. State needs a shape, an icon, or text
  alongside it.
- **Theme is a decision about the context of use**, not about identity. Where the product is
  looked at, under what light, for how long. Dark-by-default because "it looks premium" is a
  reflex, not a decision.

## 5. Composition and grid

- **CSS Grid first.** It's the tool for *two-dimensional* layout: columns, rows, areas. Flex
  is for *one* dimension — a row of controls, a stack.
- **Nested flex with percentage arithmetic is a smell.** `calc(33% - 1rem)` inside flex
  inside flex is always a grid that should have been declared as one.
- Structure with **named areas** when the layout has stable regions; the name documents the
  intent better than any comment could.
- Responsiveness isn't "break at 768px" — it's declaring how each region behaves as the space
  changes. Prefer layouts that adapt on their own (`minmax`, `auto-fit`, `clamp`) and reserve
  breakpoints for **compositional** changes, not size changes.
- Every multi-column composition explicitly declares its mobile collapse, in the same place
  it was defined.
- **Repeating the same layout family is what makes a page look like a template.** If two
  consecutive sections use the same structure, the second one needs a reason. Three, and the
  page becomes a mold.
- Viewport units: use the dynamic ones (`dvh`/`dvi`) for full-height surfaces. The static ones
  (`vh`) jump when a mobile browser's chrome slides in and out.

## 6. States as design

An interface is not a photo of the happy path. **Every component that carries data has five
states**, and all five are design — not exception handling.

| State | What it needs to do |
| --- | --- |
| **Empty** | Explains why it's empty and what the next action is. Never a blank box. |
| **Loading** | A skeleton with the **shape of the final result**, so the layout doesn't jump. A generic spinner is the last resort. |
| **Error** | Names the problem *and* the way out, where the error happened. |
| **Overflow** | A long name, 300 items, four lines of text where one fit. Test with the worst plausible content, not the best. |
| **Offline / degraded** | Says what still works, what doesn't, and what happens to what the user already typed. |

Things that count the same:
- **Keyboard focus is a visible state**, always. Removing `outline` without a replacement is a
  defect.
- Interaction states (hover, active, disabled, selected) are part of a component from its
  first commit, not a "polish pass" done later.
- Surfaces the browser draws for you — text selection, cursor, scrollbar, focus ring, link
  underline — are also part of your design. Leaving them at the default is the cheapest tell
  between a built screen and an assembled one.

## 7. Density by context

There's no correct density in the abstract; there's a correct density **for what the person is
doing.**

- **Reading or emotional-decision tasks** (a product page, previewing a personal keepsake): low density,
  large type, generous breathing room. The time is the user's.
- **Repeated-operation tasks** (a table, an internal panel, an order list): high density.
  There, too much breathing room is hostile — it forces scrolling to see what should have
  fit together.
- **Forms and guided flows**: medium density, with strong grouping. One step at a time,
  spacing that makes what belongs to what obvious.
- The choice applies to the whole screen and is **explicit**: density that changes
  section-to-section reads as inconsistency.
- Touch and targeting: a comfortable minimum touch target on mobile even in a dense layout.
  Density never justifies a 20px target.

## 8. Motion with purpose

Animation has to answer **"what does this communicate?"** in one sentence. There are four
valid answers: hierarchy, spatial continuity, feedback for an action, and a state transition.
"It looked cool" isn't one of them.

- **One authored moment per screen**, not an effect scattered everywhere. Thirty identical
  micro-animations don't add up; they cancel out.
- Curve: exponential ease-out. Bounce and elastic as defaults are dated — real objects
  decelerate, they don't bounce.
- Short duration: UI transitions live between ~120ms and ~300ms. Above that, the user waits
  for the interface instead of using it.
- Animate **`transform` and `opacity`**. Animating `width`, `height`, `top`, `margin`, or
  `padding` triggers layout recalculation and jank.
- **Content is born visible.** Entrance animation *highlights* an arrival; it's never what
  decides whether the text exists. If JS fails, the page still has to be readable.
- **`prefers-reduced-motion` is mandatory, not negotiable.** Infinite loops, parallax, and
  scroll-triggered reveals collapse to their static final state. This isn't optional
  accessibility — it's the difference between an animation and a dizzy spell.

## 9. Copy as design material

Text isn't what gets dropped in after the layout is done. It's the raw material of the
layout.

- **The voice is the user's, not the system's.** The product talks about things the way the
  person would talk about them.
- **A control names the action it performs.** "Generate preview" beats "Continue" beats "OK."
- **An error names the problem and the way out.** "The photo is 12 MB; the limit is 8 MB.
  Pick another or resize it." beats "Upload failed." beats "Something went wrong."
- **Never lorem ipsum.** Not even poetic placeholder ("Your Journey Starts Here"). Fake text
  hides exactly the problems real text reveals: length, wrapping, tone, hierarchy. If the
  final copy doesn't exist yet, write the closest plausible text and flag it.
- **No buzzwords.** "Revolutionize," "supercharge," "unique experience," "next-gen" are noise
  shaped like a sentence. Concrete verb, concrete noun.
- Example data is plausible and specific, never suspiciously round or generic ("99.9%,"
  "John Smith," "Acme").
- **One register per product.** Don't mix editorial prose, marketing punch, and technical
  jargon on the same screen unless the brand explicitly calls for it.
- Before calling a screen done, re-read **every** visible string, including `alt` text,
  placeholders, labels, and error messages. A sentence you couldn't defend saying out loud
  becomes a plain, functional one.

## 10. Accessibility by design

Accessibility doesn't get added at the end. It's an input constraint, the same kind as "this
has to fit in 375px."

- **Semantic HTML first.** A `button` is a `button`; a `div` with an `onclick` is a defect
  wearing a component's clothes. Landmarks (`header`, `nav`, `main`, `footer`) present and
  unique where they should be.
- **Heading order without gaps.** The heading structure is the document's structure; it's the
  navigation for anyone using a screen reader.
- **WCAG AA contrast as the floor**: 4.5:1 for body text, 3:1 for large text and for
  interface-component boundaries. Placeholder text, help text, and error text all count.
- **Everything reachable by keyboard**, in visual order, with visible focus at every stop.
- A real label on a form field, **above** the field. `placeholder` is not a label — it
  disappears exactly when the person needs to double-check it, right as they're typing.
- `alt` describes the image's function in context; a decorative image gets `alt=""` and drops
  out of the accessibility tree.
- Motion, transparency, and contrast respect system preferences
  (`prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`).
- Zoom up to 200% without losing content or function.

---

## Canonical references

Reference reading for anyone going deeper. **Cited, not reproduced** — the content of this
document is our own, in our own terms; none of it is copied from these works.

- **Refactoring UI** — Adam Wathan and Steve Schoger. Hierarchy through weight and color,
  discrete scales instead of continuous values, space as a primary tool.
- **Every Layout** — Heydon Pickering and Andy Bell. Layout primitives that adapt on their
  own, instead of breakpoints that enumerate screen sizes.
- **CUBE CSS** — Andy Bell. Composition, utilities, blocks, and exceptions: a way to organize
  CSS that works with the cascade instead of fighting it.
