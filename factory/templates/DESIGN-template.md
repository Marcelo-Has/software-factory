# DESIGN.md — template

## How to instantiate

Copy this file to `project/design/DESIGN.md` and fill it in field by field, section by
section, in order — this **is** the Foundation phase's deliverable (see
`factory/docs/AUTONOMY.md` §2, "Visual identity and narrative voice"). Convention used
throughout this template:

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `> _Example:_ ...` — shows the **kind** of answer expected, not the answer itself.
  **Removed** too.
- `[TO FILL IN]` — a required field still empty. A `DESIGN.md` with any `[TO FILL IN]` left
  in it **is not a candidate for approval**.

**Nothing is optional.** If a field doesn't apply to the project, write `Not applicable —`
followed by the reason. A deleted field is a forgotten field; a field with a reason is a
decision.

**A real filled example exists — cited, never copied.** The origin project this factory was
ported from has a real, approved `DESIGN.md` for its own product, under the named direction
"Ballpoint Ink." It is cited here as an illustration of what a fully-committed, specific
direction looks like (a named direction, a single accent color, a load-bearing signature
element, a documented rejected-alternatives history) — its content is product-specific and is
never reproduced or reused here. Read it as "this is the level of specificity §1–§3 need,"
not as a source of values to copy.

---

## The three rules of this document

These three apply to the `DESIGN.md` of any project and are copied verbatim into every
instance. **Do not delete this section when filling in the template.**

1. **Every agent that touches UI re-reads this file at the start of the task.** Before writing
   the first line of markup or CSS, not after. UI work that didn't open `DESIGN.md` first is
   work to redo, not work to review.
2. **This file overrides every skill.** An aesthetic-direction skill, a component-mechanics
   skill, a library heuristic: in conflict, `DESIGN.md` wins, no "but the skill recommends."
   The full authority order lives in `factory/docs/SKILL-ROUTER.md` — *the owner's explicit
   brief → `DESIGN.md` → concepts absorbed into the core → the direction skill → the mechanics
   skill.*
3. **Changing this file after approval = a new Decision Gate.** The Foundation **proposes**;
   the owner **approves** (see `factory/docs/AUTONOMY.md` §2). After that, Construction runs
   autonomously, *deriving* from here. If a recorded decision turns out to be wrong, the path
   is opening a gate to change it — never a silent detour inside a task. Every approved change
   leaves a trace in the **design memory** (§15).

And two floors this file **cannot** lower, because they belong to the core and always apply:
`factory/docs/CRAFT-PRINCIPLES.md` and `.claude/rules/design-antipatterns.md`. `DESIGN.md`
decides the *taste*; it doesn't touch the *floor*.

---

## 0. Header

<!-- HOW TO FILL: the document's formal state. While it's a "candidate," no UI code may derive
     from it. "approved" requires a date and the identifier of the gate that approved it. -->

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Gate** | `[TO FILL IN]` — identifier of the Decision Gate that approved it (empty while candidate) |
| **Interface category** | `[TO FILL IN]` |
| **Stack profile** | `[TO FILL IN]` |
| **Active direction skill** | `[TO FILL IN]` |

> _Example:_ `approved` · `2026-09-04` · `DE-003` · `guided flow + product site` ·
> `SvelteKit + TypeScript, component-scoped CSS, no UI library` · the project's default
> aesthetic-direction skill.

<!-- HOW TO FILL (interface category): pick one primary and, at most, one secondary. The
     category is what decides density in §7 and motion weight in §4. Vocabulary: product/
     marketing site · e-commerce and checkout · guided flow (multi-step form) · operational
     panel/dashboard · creation tool · reading surface · other (name it). -->

<!-- HOW TO FILL (stack profile): framework, language, CSS strategy, and whether there's a
     component library. This is the field the skill router reads to decide whether a
     component-scaffolding skill can enter Construction — component mechanics are decided BY
     PROFILE, never by taste (see factory/docs/SKILL-ROUTER.md). -->

<!-- HOW TO FILL (active direction skill): the factory's default aesthetic-direction skill
     stays the default unless the project explicitly opted into another one. AT MOST ONE — two
     active directions don't add up, they produce a screen that's neither (SKILL-ROUTER, rule
     1). -->

---

## 1. Visual direction

<!-- HOW TO FILL: give the direction a PROPER NAME — two or three words that evoke a concrete
     world, grounded in the product and the audience. The name is the test: if it would work
     for any other product in the same category, it isn't a direction, it's an adjective.
     "Modern," "clean," "minimalist," "elegant," and "premium" are BANNED here — they describe
     nothing and are exactly the unconscious default this layer exists to prevent. -->

**Name:** `[TO FILL IN]`

> _Example:_ **Family Archive** · **Corner Workshop** · **Field Notebook** · **Waiting Room**.

<!-- HOW TO FILL: exactly three sentences, each anchored in something that exists outside
     design — who the audience is, what the product promises, or the context of use. A
     sentence that only talks about appearance ("it feels sophisticated") doesn't count;
     rewrite it tied to the product. -->

**Why (3 sentences):**

1. `[TO FILL IN]`
2. `[TO FILL IN]`
3. `[TO FILL IN]`

> _Example (one of them):_ "The buyer is saving a memory, not purchasing a service — the
> interface needs to feel like a place where a memory is kept, not a checkout."

---

## 2. References and anti-references

<!-- HOW TO FILL: real, nameable products, sites, or objects — never categories. The format is
     "how X does Y" — the name alone is useless because it doesn't say what's being borrowed.
     Minimum 2 of each. Anti-references are just as mandatory as references — they're what
     closes the door the direction wants closed. If something has a public link, put it in
     project/design/assets/references.md and cite it here (see
     factory/templates/BRAND-ASSETS-template.md). -->

**References — minimum 2:**

| Reference | What exactly is taken from it |
| --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` |
| `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ "how an independent publisher's site handles a spec sheet: dense data in small
> body text, no box or card around it."

**Anti-references — minimum 2:**

| Anti-reference | What exactly is refused |
| --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` |
| `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ "never like a SaaS panel: a centered hero with two buttons and three identical
> cards right below it."

---

## 3. Visual signature

<!-- HOW TO FILL: ONE element — just one — that makes someone recognize the product in a
     screenshot with the logo cropped out. It needs to be reproducible by another agent
     without seeing the original screen, so describe the mechanic, not the impression. A test:
     if the signature disappeared, would the product look like any other in the category? If
     not, it's a signature. -->

**The signature:** `[TO FILL IN]`

**Where it appears:** `[TO FILL IN]`
**Where it does NOT appear:** `[TO FILL IN]`

> _Example:_ "Every surface that holds something of the user's has a bottom border thicker
> than the other three, like a folder tab. It appears on a saved-item card and the preview
> container; it doesn't appear on a button, a field, or the navigation bar."

---

## 4. Semantic tokens

<!-- HOW TO FILL: this section is THE BRIDGE. It's what Construction reads to derive values
     instead of inventing them, and it's what makes the identity portable across frameworks.
     Golden rule from CRAFT-PRINCIPLES §4: the name states the ROLE, never the appearance —
     `surface`, not `gray-100`. The language of the name is the project's choice; what's never
     admitted is naming by hue. A literal color, size, or radius value inside a component is a
     lint finding. -->

### 4.1 Color by role

<!-- HOW TO FILL: fill in EVERY role. `—` only with a written reason in the notes column. The
     contrast column isn't decorative: the WCAG AA floor (4.5:1 body / 3:1 large text and
     component boundaries) is verified here, not discovered by the critic later. If the
     product has a dark theme, the table gains one more column — and dark theme is a
     context-of-use decision, not an identity one (craft §4). -->

| Token | Role | Value | Verified contrast |
| --- | --- | --- | --- |
| `surface` | the product's base background | `[TO FILL IN]` | — |
| `surface-raised` | a surface above the base (only where there's a real layer) | `[TO FILL IN]` | — |
| `foreground` | primary text and icons | `[TO FILL IN]` | `[TO FILL IN]` over `surface` |
| `muted` | secondary text and icons, demoted on purpose | `[TO FILL IN]` | `[TO FILL IN]` over `surface` |
| `accent` | **the only** accent in the product | `[TO FILL IN]` | `[TO FILL IN]` |
| `destructive` | destructive action and error | `[TO FILL IN]` | `[TO FILL IN]` |
| `success` | confirmation, completion | `[TO FILL IN]` | `[TO FILL IN]` |
| `warning` | attention without blocking | `[TO FILL IN]` | `[TO FILL IN]` |
| `border` | boundary between surfaces | `[TO FILL IN]` | `[TO FILL IN]` |
| `focus` | keyboard focus ring | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example row:_ `accent` · the only accent · `#7A3E2B` (burnt terracotta) · 5.9:1 over
> `surface`.

**One accent only.** `[TO FILL IN]` — name the accent and say what it means when it appears.
A semantic state (`destructive`/`success`/`warning`) is a declared exception, not a second
accent.

**Neutral temperature:** `[TO FILL IN]` — which hue the neutrals pull toward. A fully desaturated
gray and pure `#000` are the default of someone who didn't choose.

### 4.2 Spacing scale

<!-- HOW TO FILL: one base (4px or 8px) and the whole scale derived from it. Every gap,
     padding, and margin in the product comes from here; a magic number inside a component is
     debt (craft §3). -->

**Base:** `[TO FILL IN]`

| Token | Value | Typical use |
| --- | --- | --- |
| `space-3xs` … `space-3xl` | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ base 4px · `space-xs 8px` (inside one group) · `space-lg 32px` (between groups) ·
> `space-3xl 96px` (between page sections).

**The project's rhythm rule:** `[TO FILL IN]` — which step separates items in the same group, and
which separates different groups. Monotonous spacing is a finding.

### 4.3 Radius

| Token | Value | Where it applies |
| --- | --- | --- |
| `radius-sm` / `radius-md` / `radius-lg` / `radius-full` | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ `radius-sm 2px` on fields and buttons; `radius-lg 6px` on a content container;
> `radius-full` only on avatars.

<!-- A uniform radius ≥ 24px on everything, from button to container, is an anti-pattern.
     Differentiating by role is what keeps the product from turning into a pile of identical
     rounded rectangles. -->

### 4.4 Elevation

<!-- HOW TO FILL: elevation only exists where there's a REAL LAYER — something floating above
     something else. Decorative shadow, multi-layer shadow, and a zero-offset glow are
     findings. A hairline border AND a diffuse shadow on the same element: pick one. A fully
     flat product is a valid answer — write "no elevation" and say how layers are
     distinguished instead. -->

| Token | Value | When it's legitimate to use |
| --- | --- | --- |
| `elevation-0` … `elevation-2` | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ `elevation-1` = `0 1px 2px rgba(60,40,30,.12)`, only on a surface the user can
> move or close (a menu, a dialog). A card in normal flow stays at `elevation-0`.

### 4.5 Typographic roles

<!-- HOW TO FILL: roles BEFORE sizes (craft §2). A new component picks an existing role; it
     doesn't invent a size. The numeric scale values go in §5 — here is the list of roles and
     each one's weight. -->

| Role | Where it's used | Family | Weight |
| --- | --- | --- | --- |
| `display` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
| `heading` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
| `body` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |
| `caption` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |

**Families:** `[TO FILL IN]` — one, two at most, and the second one **with a declared role**.
A default system-UI sans as the product's whole voice is a finding.

### 4.6 Motion

<!-- HOW TO FILL: NAMED durations and curves, plus the sentence each one communicates. Motion
     with no answer to "what does this communicate?" doesn't ship (craft §8). Curves with
     overshoot (bounce, elastic) as a default are a finding. The prefers-reduced-motion block
     isn't a token — it's an obligation, and its absence where there's animation is a finding.
     -->

| Token | Value | What it communicates |
| --- | --- | --- |
| `duration-instant` / `duration-base` / `duration-deliberate` | `[TO FILL IN]` | `[TO FILL IN]` |
| `ease-out` / `ease-in-out` (name your own) | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ `duration-base 180ms` + `ease-out cubic-bezier(.2,.8,.2,1)` — action feedback; the
> control confirms it heard you.

**The product's one authored moment:** `[TO FILL IN]` — the **one** motion worth having per
screen (craft §8). **Behavior under `prefers-reduced-motion`:** `[TO FILL IN]`.

---

## 5. Typographic scale

<!-- HOW TO FILL: few steps, a perceptible ratio (roughly 1.2–1.33). Write down the chosen
     RATIO — it's what lets the scale extend later without guessing. A ratio below ~1.2
     between neighbors is a finding: ten near-identical steps equal no scale at all. Body text
     under 16px and UI text under 14px are also findings. -->

**Ratio:** `[TO FILL IN]`

| Step | Size | Line-height | Role that uses it |
| --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example row:_ `text-2xl` · 30px · 1.15 · section `heading`.

<!-- HOW TO FILL: line-height inversely proportional to size — a large title breathes little,
     body text breathes more. And declare the body's LINE MEASURE: outside 45–75 characters is
     a finding. -->

**Body line measure:** `[TO FILL IN]` characters.

### Weight pairs

<!-- HOW TO FILL: weight contrast is MANDATORY. A healthy system has one distant pair (200/800,
     300/700, or equivalent). A screen entirely in 400/500 is the number-one symptom of an
     interface generated without a decision — every piece of text speaking at the same
     volume. -->

| Pair | Weights | Where the contrast shows up |
| --- | --- | --- |
| Main pair | `[TO FILL IN]` | `[TO FILL IN]` |
| Support pair | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ 300 / 700 — the `display` at 300 against a data label at 700, on the same
> baseline in the preview.

---

## 6. Grid and layout concept

<!-- HOW TO FILL: CSS Grid first; flex is for one dimension (craft §5). Declare columns,
     gutter, max content width, and stable named areas. Percentage arithmetic inside flex is
     always a grid that should have been declared as one. -->

**Grid:** `[TO FILL IN]` — columns, gutter, max width, outer margin.
**Layout concept in one sentence:** `[TO FILL IN]`

> _Example:_ 12 columns at 1280 / 6 at 768 / 4 at 375, 24px gutter, reading content locked at
> 68ch. Concept: "one reading column at the center, with tools pinned to the margin."

### ASCII wireframes of the key screens

<!-- HOW TO FILL: one block per key screen of the product — the screens that carry the
     promise, not every screen. The wireframe declares the READING ORDER (what the eye sees
     first, second, third: craft §1) and the region skeleton. It's not a mockup: no color, no
     type, no shadow. Repeat the block for however many key screens the product has. -->

**Screen:** `[TO FILL IN]`
**Reading order, in one sentence:** `[TO FILL IN]`

```
┌──────────────────────────────────────────────┐
│ [TO FILL — region 1]                          │
├───────────────────────────┬──────────────────┤
│ [TO FILL — region 2]      │ [region 3]        │
│                           │                   │
├───────────────────────────┴──────────────────┤
│ [TO FILL — region 4]                          │
└──────────────────────────────────────────────┘
```

**How this composition collapses on mobile:** `[TO FILL IN]`

<!-- Declaring the collapse HERE, next to the multi-column layout, is mandatory: a collapse not
     declared in the same place the composition was defined is a finding. -->

---

## 7. Iconography · Illustration and photography · Density

### 7.1 Iconography

<!-- HOW TO FILL: ONE family, one stroke weight. Mixed families or inconsistent weights are a
     finding; an emoji instead of an icon too. If the product doesn't use icons, say so — it's
     a legitimate, strong decision. -->

**Family:** `[TO FILL IN]` · **Weight:** `[TO FILL IN]` · **Allowed sizes:** `[TO FILL IN]`
**When an icon is allowed:** `[TO FILL IN]` — and whether it can appear without a label.

> _Example:_ a single family at 1.5px stroke, sizes 16/20/24; an icon never appears alone on a
> primary-action control — it always comes with the label.

### 7.2 Illustration and photography

<!-- HOW TO FILL: the image policy. Where it comes from, what treatment it gets, what NEVER
     enters. If the product displays user-submitted visual content, say how it's distinguished
     from the product's own frame. A hand-assembled SVG imitating an illustration or scene,
     and a fake screenshot made of divs, are both findings. -->

**Source:** `[TO FILL IN]` · **Treatment:** `[TO FILL IN]` · **Forbidden:** `[TO FILL IN]`

### 7.3 Density

<!-- HOW TO FILL: density is chosen by the TASK, not by taste (craft §7) — reading and
     emotional decisions call for low density; repeated operation calls for high; forms call
     for medium with strong grouping. Applies to the whole screen: density that changes
     section-to-section reads as inconsistency. And no density justifies a small touch target
     on mobile. -->

**Chosen density:** `[TO FILL IN]` · **For which task:** `[TO FILL IN]`
**Minimum mobile touch target:** `[TO FILL IN]`

---

## 8. Component philosophy

<!-- HOW TO FILL: the line between what the project OWNS (our own code, carrying the identity
     and the §3 signature) and what's a library PRIMITIVE (accessibility and behavior
     mechanics not worth reinventing). Component library ≠ design system ≠ identity: if the
     finished screen is recognizable as "a screen from library X," the mechanics beat the
     identity, and that's the defect. A component shipped in its library-default state is a
     finding, not a delivery (see factory/docs/SKILL-ROUTER.md). -->

**Owned by the project:** `[TO FILL IN]`
**Library primitive:** `[TO FILL IN]` — and which library, consistent with the §0 stack profile.
**Mandatory customization rule:** `[TO FILL IN]` — what every imported primitive has to receive
before it enters a screen.

> _Example:_ we own everything the user associates with the product (the preview container, an
> item card, a flow step); we only import accessible-behavior primitives (dialog, popover,
> combobox). Every imported primitive receives, at minimum, this document's color, radius, and
> typography tokens.

---

## 9. Copy voice

<!-- HOW TO FILL: copy is design material, not a caption added after the layout is done (craft
     §9). This section is normative for anyone writing interface strings — including alt text,
     placeholders, labels, and error messages. -->

**Voice in one sentence:** `[TO FILL IN]`
**Person and address:** `[TO FILL IN]` — first or second person, singular or plural.
**Register:** `[TO FILL IN]` — one per product.

**How a control is named:** `[TO FILL IN]`
> _Example:_ the label names the action it performs — "Generate preview," never "Continue" or
> "OK."

**How an error is written:** `[TO FILL IN]`
> _Example:_ names the problem and the way out, where the error happened — "The photo is
> 12 MB; the limit is 8 MB. Pick another or resize it."

**What this product NEVER says:**

| Never | Why |
| --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` |
| `[TO FILL IN]` | `[TO FILL IN]` |

> _Example:_ nothing like "journey," "unique experience," or "revolutionize"; no exclamation
> mark on a purchase confirmation — the product doesn't celebrate on the user's behalf.

---

## 10. Designed responsiveness

<!-- HOW TO FILL: declare what CHANGES IN INTENT at each breakpoint, not what happens as a
     consequence of the space shrinking. "The cards become one column" is a consequence. "At
     375 the preview moves above the form, because on a phone the person wants to see the
     result before continuing" is design. The three widths are the Visual Verification Loop's,
     and they're what design-critic looks at. Prefer layouts that adapt on their own (minmax,
     auto-fit, clamp) and reserve breakpoints for changes in COMPOSITION (craft §5). -->

| Width | What changes in intent | Why |
| --- | --- | --- |
| **375** | `[TO FILL IN]` | `[TO FILL IN]` |
| **768** | `[TO FILL IN]` | `[TO FILL IN]` |
| **1280** | `[TO FILL IN]` | `[TO FILL IN]` |

**What does NOT change at any width:** `[TO FILL IN]` — does the §3 signature survive all three?

---

## 11. Mandatory states per key component

<!-- HOW TO FILL: one row per component that carries data. The five states are design, not
     exception handling (craft §6) — only the happy path implemented is a finding. Fill in with
     the TEXT AND SHAPE of each state, not "show error message." Overflow = the worst plausible
     content: a long name, 300 items, four lines of text where one fit. -->

| Key component | Empty | Loading | Error | Overflow | Offline / degraded |
| --- | --- | --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` | `[TO FILL IN]` |

> _Example "loading" cell:_ a skeleton with the exact proportion of the final result, so the
> layout doesn't jump — a generic spinner only where the final shape is unpredictable.

**Interaction states:** `[TO FILL IN]` — hover, active, disabled, selected, and **visible focus**
are part of the component from its first commit. Removing `outline` without a replacement is a
defect.

---

## 12. Accessibility

<!-- HOW TO FILL: WCAG AA is the factory's FLOOR and isn't recorded here as an achievement —
     it's in CRAFT-PRINCIPLES §10 and always applies. What gets recorded here is what THIS
     product requires BEYOND the floor, because of its audience, its context of use, or its
     content. If there's nothing beyond it, write "floor only" — but think first: an older
     audience, one-handed use, bright-light use, emotional content that shouldn't be read
     aloud by accident. -->

**Floor:** WCAG 2.2 AA (mandatory, not negotiable).

| Requirement beyond the floor | Why |
| --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` |

**System preferences respected:** `[TO FILL IN]` — at minimum `prefers-reduced-motion`.
**Zoom:** content and function preserved up to 200%.

---

## 13. Platform rules

<!-- HOW TO FILL: when the product lives inside someone else's conventions — iOS, Android, a
     browser extension, email, an installable PWA, an embedded surface. Write which conventions
     the product FOLLOWS and which it breaks on purpose, with the reason. If the product is web
     and only web, write "Not applicable — responsive web, no host platform." -->

`[TO FILL IN]`

---

## 14. Provenance

<!-- HOW TO FILL: for every decision recorded above, where it came from. This section exists
     because a design system should be born from existing brand assets when they exist, with
     provenance recorded here. The directory convention lives in
     factory/templates/BRAND-ASSETS-template.md — the Foundation READS project/design/assets/
     BEFORE creating anything; creating from scratch is only for what's genuinely absent. Three
     possible origins:
       · derived-from-asset      — extracted from a file in project/design/assets/ (cite the
                                    file)
       · created-in-Foundation   — no asset existed; the Foundation proposed and the gate
                                    approved it
       · inherited-from-existing-DS — comes from a design system the project already uses
                                       (cite the source)
     A "created-in-Foundation" entry where an asset WAS available is a violation. -->

| Decision | Section | Origin | Source |
| --- | --- | --- | --- |
| `[TO FILL IN]` | `[TO FILL IN]` | `derived-from-asset` \| `created-in-Foundation` \| `inherited-from-existing-DS` | `[TO FILL IN]` |

> _Example row:_ Base palette · §4.1 · `derived-from-asset` · `project/design/assets/palette.md`
> + `project/design/assets/logos/primary-mark.svg`.

**Assets read during this Foundation:** `[TO FILL IN]` — the list of what existed in
`project/design/assets/` as of the §0 date. If the directory was empty, say so: that's what justifies
the `created-in-Foundation` rows.

---

## 15. Design memory

<!-- HOW TO FILL: APPEND-ONLY section. Records what was TRIED AND REJECTED — the alternative,
     the date, and the reason. It exists so the next task, the next agent, and the next round
     of critique don't reopen a settled discussion, or "improve" the product back toward
     something already discarded for a reason.
     Never edit or delete an entry. If a decision changes, ADD a new entry saying it changed,
     with the gate that authorized it (rule 3 at the top). A rejection with no written reason
     doesn't count — "didn't like it" reopens on its own the following week. -->

<!-- Entry format:

### YYYY-MM-DD · [what was tried]
**Rejected because:** [reason tied to the product, the audience, or a concrete constraint]
**Replaced by:** [what took its place, linked to the section above]
**Origin:** [Foundation | post-render critique | owner's brief | gate DE-xxx]

-->

`[TO FILL — the first entry is the Foundation's own: what was considered and discarded while
proposing the §1 direction.]`
