# Interface-category playbooks

> **What this is.** The **strategy-by-interface-category** layer of the factory's design
> intelligence. A playbook answers: for this category of product, **where does the Foundation
> spend its effort**, **what does `design-critic` scrutinize harder**, and **what
> category-specific gates activate**?
>
> **What a playbook is never.** It is never identity. No playbook picks a palette, a
> typographic family, a style, a direction name, or a signature. That's every project's own
> `DESIGN.md`, approved through a Decision Gate (see `factory/docs/AUTONOMY.md`). A playbook
> with an identity choice inside it is a defect in the playbook, not a decision for the
> project.

---

## The files

| Playbook | Category | State |
| --- | --- | --- |
| [`institutional-marketing.md`](institutional-marketing.md) | Institutional site, product page, conversion landing page | **Complete** — an example from the origin project's own product category |
| [`saas-dashboard.md`](saas-dashboard.md) | Operational panel, internal product, admin console | **Complete** — an example from the origin project's benchmark briefs |
| [`mobile.md`](mobile.md) | Mobile surface (a platform modifier) | Skeleton |
| [`editorial.md`](editorial.md) | Reading surface, long-form text | Skeleton |
| [`data-heavy.md`](data-heavy.md) | Large-volume analysis and exploration | Skeleton |
| [`external-integration.md`](external-integration.md) | External integration (a DP-3 logical/integration-axis modifier, DECISIONS.md D-007) | **Complete** — cross-cutting |

**Skeleton** means: the category has a place and a name, the obvious emphases are noted, and
the list of what's still undecided is written down. A skeleton is **not authority** — until it
matures, only the craft floor, the anti-patterns, and the project's `DESIGN.md` apply. It
matures **with the first real use**, in its own issue, never inside the PR that used it for
the first time.

---

## How a project declares its category

In the **interface category** field of `DESIGN.md` §0 (`factory/templates/DESIGN-template.md`):
**one primary, and at most one secondary.** That declaration is what decides which playbook
applies.

The template's vocabulary and this directory's files correspond like this:

| Category declared in §0 | Playbook |
| --- | --- |
| product/marketing site | `institutional-marketing.md` |
| operational panel/dashboard | `saas-dashboard.md` |
| reading surface | `editorial.md` (skeleton) |
| e-commerce and checkout · guided flow · creation tool | **no playbook yet** — craft + anti-patterns + `DESIGN.md` |

Two boundary notes:

- **`mobile.md` is not a primary category.** It's a platform modifier: it combines with any
  category and talks to `DESIGN.md` §13 (platform rules).
- **`data-heavy.md` is a specialization of `saas-dashboard.md`**, not a substitute. While it's
  a skeleton, use the panel playbook as the base and treat its emphases as an added layer.

A category without a playbook is a normal situation, not a gap to fill preemptively: a
playbook is born from a category's first real project, not written ahead of time.

**`external-integration.md` is a different kind of modifier — a different axis, not a third
boundary note above.** This table and the "declares its category" mechanism are all DP-2 (the
visual axis, `DESIGN.md` §0). `external-integration.md` belongs to DP-3 (the logical/
integration axis, DECISIONS.md D-007) and is never selected through `DESIGN.md` §0 at all —
it applies automatically the moment `SPEC.md` marks any feature as crossing a system
boundary, independent of and combinable with whichever DP-2 category (and `mobile.md`) also
applies. See `external-integration.md` itself for how the two axes meet.

---

## How a playbook composes with the rest

Three layers, each with a distinct job, and none does the other's work:

| Layer | What it decides | Scope |
| --- | --- | --- |
| `factory/docs/CRAFT-PRINCIPLES.md` + `.claude/rules/design-antipatterns.md` | **The floor.** The mechanics that separate a built screen from an assembled one, and what's banned as an unconscious default. | Every interface the factory produces, always |
| **The category playbook** (this directory) | **The strategy.** Where to focus, what the critic scrutinizes harder, what gates activate. | Every project in the same category |
| The project's `DESIGN.md` | **The identity.** Direction, tokens, signature, voice. | One project |

The playbook sits **between** the other two and overrides neither:

- **Downward, it never lowers the floor.** Where craft leaves a range open — density, how
  heavy the motion is, how much container is too much — the playbook picks a point inside
  that range and **justifies it by the category's task**. Where craft closes a question, the
  playbook obeys. A playbook can only **tighten** a requirement; never loosen one.
- **Upward, it never decides identity.** The playbook can say the first fold carries emotional
  weight; **which** weight, in what direction, with what voice, is `DESIGN.md`.

### Tie-break order

> **The project's `DESIGN.md` → the category playbook → `CRAFT-PRINCIPLES.md`**
> — and **`design-antipatterns.md` always applies**, regardless of position in the dispute.

How to read this without contradicting `factory/docs/SKILL-ROUTER.md`: in that document's
authority chain — *the owner's explicit brief → `DESIGN.md` → concepts absorbed into the core
→ the active aesthetic-direction skill → the component-mechanics skill* — a playbook is a
**specialization of the core concepts**, just below `DESIGN.md` and above any skill. It's
listed ahead of craft in the order above only because it **chooses within what craft leaves
open**; where craft leaves nothing open, there's no dispute to break.

Anti-patterns sit outside this authority hierarchy. A playbook can say **where to look** for
an item and **how strictly** (that's what `saas-dashboard.md` does with one of its items), and
it can declare that an item **has no escape valve** in that category (that's what it does with
another). What it can't do is waive an item: the only way out of an anti-pattern is still a
**justification recorded in `DESIGN.md`**, tied to this specific product and this specific
audience.

If a playbook and an approved `DESIGN.md` genuinely conflict, `DESIGN.md` wins — and the path
to fixing the playbook is its own issue, never a silent detour inside the task.

---

## Who reads this, and when

- **`design-director`**, during the **Foundation**: reads the declared category's playbook
  **before** proposing a direction, using the "Where the Foundation focuses" section to know
  what `DESIGN.md` needs to deliver beyond the baseline for that category.
- **`developer-frontend`**, during **Construction**: reads the gates-and-attention section
  alongside `DESIGN.md`, at the start of the task.
- **`design-critic`**, **post-render**: applies the playbook's extra rubric **in addition
  to** — never instead of — the anti-patterns `[CRITIC]` checklist and the "could this have
  come from any similar prompt?" test.

## How a new playbook gets created

When the first project in a category without a playbook finishes the Foundation. The content
comes from two sources: **what the Foundation had to decide that wasn't written down
anywhere**, and **what the critic found post-render that was characteristic of the category,
not of the project.** Format: the five sections of a complete playbook — Foundation focus,
extra critic rubric, gates and attentions, traps (with the relevant anti-pattern numbers), and
what the playbook doesn't decide.
