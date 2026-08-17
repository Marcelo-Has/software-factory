# Playbook — SaaS / dashboard

> **Category:** operational panel, internal product, admin console, application for repeated
> work.
> **State:** complete — an example from the origin project's benchmark briefs.
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

A panel isn't a pretty page with data inside it. It's a **tool someone uses many times a
day** — and the difference between a good one and a bad one shows up on the tenth visit, not
the first.

### 1.1 Information architecture **before** aesthetics

This is the inversion that defines the category. No tokens, direction, or composition before
answering:

- **What objects exist** in the product, what the user calls them, and how they nest.
- **Where the person lands** on entry, and why — the home screen is the most frequent task,
  not a generic summary.
- **How you navigate** between objects: the navigation model (fixed sidebar, hierarchy, search
  as the primary entry point) is a Foundation decision and enters `DESIGN.md` §6 as a layout
  concept.
- **How many archetype screens** the product has — list, detail, create/edit, settings. Every
  wireframe in §6 is of an archetype, not of a one-off screen; concrete screens inherit from
  it.

The test: if you can't sketch the object map on one sheet of paper, no pixel is going to save
the interface.

### 1.2 Density calibrated by task

Craft §7 says repeated operation calls for **high density** — too much breathing room there is
hostile, it forces scrolling to see what should have fit together. What this playbook adds:
density is declared **per screen archetype**, not once for the whole product.

| Archetype | Density | Why |
| --- | --- | --- |
| List / table | High | Comparing many rows at once is the task. |
| Object detail | Medium | Reading and acting on one item; strong grouping matters more than compactness. |
| Create / edit | Medium, with strong grouping | Guided flow (craft §7): one step at a time. |
| Settings | Medium | A rare visit, a consequential decision; clarity beats compactness. |

Density is **uniform** within an archetype: density that changes section-to-section reads as
inconsistency. And no density justifies a small touch target (craft §7) or UI text below
14px.

### 1.3 Data legibility

- **Alignment carries meaning**: numbers right-aligned, text left-aligned, headers aligned
  with their column. A misaligned numeric column destroys the vertical comparison that is the
  table's reason for existing.
- **Constant precision per column.** Two decimal places on one row and none on another is
  noise dressed up as data.
- **Unit and scale visible** — in the column header, not repeated in every cell.
- **Every metric needs a reference**: compared to when, to what target, to what period. A
  number alone isn't information.
- Color is **never** the only carrier of state (craft §4): status needs a shape, an icon, or
  text.
- The typographic role for **numeric data** is its own role, not `body`.

### 1.4 Primary and secondary action hierarchy

- **One primary action per screen**, visually unambiguous. If there are two, the screen is
  doing two things (craft §1).
- Secondary actions demoted **consistently across screens** — the same weight means the same
  role everywhere in the product.
- **A destructive action is physically separated** from the others and never occupies the
  primary's position.
- Bulk actions (multi-select) declare what happens to the selection, how many items are
  affected, and how it's undone.
- Row-level actions: declare whether the whole row is clickable **and** what distinguishes it
  from the controls inside it.

### 1.5 Empty states as onboarding

The empty state isn't an exception: it's **the first screen every real user sees**. It's the
one onboarding opportunity that doesn't interrupt anyone.

- States **why it's empty**, what shows up there once there's content, and **what the next
  action is** — with the real control, not a sentence about one.
- Empty **because of a filter** is different from empty **because there's no data**: one
  offers clearing the filter, the other offers creating the first item. Treating both with the
  same copy is a finding.
- Empty **because of permissions** says who to ask.

---

## 2. `design-critic`'s extra rubric

Adds to — never replaces — the `[CRITIC]` checklist in `.claude/rules/design-antipatterns.md`
and the "could this have come from any similar prompt?" test. Runs **post-render**, on the
screenshots.

### 2.1 Scannability

Test: with the screen full of plausible data, **find a specific record** without reading
everything.

- Is there an **anchor column** (the object's name) the eye can scan alone, visually distinct
  from the supporting columns?
- Can you answer "how many items are there and how many need attention" without counting?
- Does the screen survive the **worst plausible content**: an 80-character name, 300 rows, an
  empty field, a negative value (craft §6, overflow state)?

If finding a specific record means reading line by line, the table's hierarchy is the finding
— not the absence of a filter.

### 2.2 Cross-screen pattern consistency

Here, repetition is a **virtue**, not a mold. The critic compares screens, not just each one
in isolation:

- Is **the same object** represented the same way everywhere (the same essential columns, the
  same label, the same date and number format)?
- Do two screens of the same archetype behave alike: same position for the primary action,
  same place for search, same pagination pattern?
- Is the **vocabulary** consistent: does the same concept keep the same name across
  navigation, title, and button?

> **How the "same layout family three times" anti-pattern reads here.** That anti-pattern
> still applies in full, and the critic still applies it **within a single screen**: three
> identical blocks stacked on one detail screen are a finding just like anywhere else. What
> this playbook adds is **where to look**: two list screens that resemble each other are not
> an instance of that anti-pattern — they're requirement 2.2 being satisfied. If there's a
> real conflict, the anti-pattern wins, and the way out is a justification recorded in
> `DESIGN.md`, never a silent detour.

### 2.3 Interaction affordances

- What's clickable **looks** clickable at rest — without depending on hover. Discoverability
  that only exists on hover doesn't exist on touch or keyboard.
- The clickable target and the visual area coincide; there's no "only the text is a link"
  trap.
- A **disabled state says why** — or it isn't disabled, it's hiding an error.
- Sorting, filtering, and selection show the **current state** without needing anything opened.
- Every action gives **feedback where it was triggered**, not only in a corner notification.

---

## 3. Category gates and attentions

### 3.1 No "hero license"

**There is no hero in this category.** The screen opens with the work, not a promise: a short
title, the object's context, and the primary action. No badge, no persuasive subtitle, no two
centered buttons. The "centered hero" anti-pattern doesn't get the escape valve here that it
would on a product page — a centered hero inside a panel is a sign the screen was assembled
with the wrong category's vocabulary. Falling with it, by association: a scroll-hint
affordance, a decorative metadata strip, and poetic placeholder copy.

### 3.2 Tables and numbers use tabular figures

- Every numeric column uses **tabular figures** (`font-variant-numeric: tabular-nums`) and
  right alignment. Without it, digits dance between rows and the vertical comparison is lost.
- Also applies to numbers outside a table that update in place: counters, timers, live values.
  Unstable width makes the layout flicker.
- Column headers follow the column's alignment.
- The typographic family chosen in `DESIGN.md` §4.5 **has to support tabular figures** — that's
  an input constraint for the Foundation in this category, not a Construction-time discovery.

### 3.3 Impeccable keyboard and focus

A panel is a tool for repeated use: daily users drive it from the keyboard. This is a gate,
not polish.

- **Full keyboard traversal**, in visual order, with **visible focus at every stop**.
  `outline: none` with no replacement is a defect.
- No focus traps. A dialog returns focus to the control that opened it when it closes.
- Composite components (table, menu, combobox, tabs) respond to the expected keys — this is
  accessible-primitive mechanics, exactly where the skill router permits a component library;
  a primitive imported in its default state is still a finding.
- A real label above the field; `placeholder` is not a label — including in filters and
  search.

### 3.4 Mandatory data states

Four states, **all of them**, for every component that carries data — filled in `DESIGN.md`
§11 with real text and real shape, never with "show a message":

| State | Requirement |
| --- | --- |
| **Empty** | See §1.5. Distinguish empty-by-filter, empty-by-absence, and empty-by-permission. |
| **Loading** | A skeleton with the **shape of the final result** — the table already knows how many columns it will have. A generic spinner where a skeleton would do is a finding. |
| **Error** | Names the problem **and** the way out, where the error happened. A widget's error doesn't take down the whole screen. |
| **Partial** | The state a panel actually lives in most: one source responded, another didn't; stale data; a total that doesn't reconcile. The screen says **what's missing and since when** — it never presents an incomplete number as if it were complete. |

Only the happy path implemented is a finding, and in this category it's the most expensive
one: a panel that only works with perfect data doesn't work.

---

## 4. Traps this category produces

| Trap | What causes it |
| --- | --- |
| **Hero imported from marketing** | See §3.1. It's the wrong category leaking into the product. |
| **Container as a substitute for hierarchy** | Card-inside-card is the default of every dashboard generated without a decision; border-plus-shadow on the same element, a uniformly huge radius, and multi-layer shadow tend to come together. In a dense panel, a container costs space that belonged to the data — group with space and a divider instead (craft §1). |
| **Monotonous spacing** | High density isn't "the same small value between everything." Without rhythm, a dense screen becomes a wall. |
| **Modal by reflex** | A modal for a task that doesn't need to interrupt or protect focus — in a tool used every day, every modal is one more step, every day. |
| **Only the happy path** | See §3.4. |
| **Focus and forms** | See §3.3. |
| **Density used as an excuse** | UI text under 14px, contrast under AA on data and labels, and a skipped heading level all get justified by "it fits more." It doesn't — it becomes unreadable. |
| **Panel iconography** | An emoji instead of an icon, mixed icon families and stroke weights, an icon in a rounded tile above every title. An icon with no label on a destructive action is a trap specific to this category. |
| **Dark by reflex** | A panel does have a real argument for dark mode — long use, a controlled environment. A real argument gets **written down** in `DESIGN.md`; chosen by reflex, it's still a finding, and so is an inverted theme mid-screen. |

---

## 5. What this playbook doesn't decide

- **Identity** — direction name, palette, typographic families, signature, tone of voice: all
  of that is the project's own `DESIGN.md` (`factory/templates/DESIGN-template.md`), approved
  through a Decision Gate.
- **Craft floor** — `factory/docs/CRAFT-PRINCIPLES.md` applies in full, no category discount.
- **Component library** — mechanics are decided per stack profile, per
  `factory/docs/SKILL-ROUTER.md`. Having an accessible table or dialog primitive available
  doesn't define the panel's identity: if the finished screen reads as "a screen from library
  X," the mechanics beat the identity, and that's the defect.
