# Design skill router

> **What this is.** The routing table for the Design Intelligence layer. It says **which**
> design skill applies, **when** it applies, **under what condition** — and, more importantly,
> what none of them is allowed to override.
>
> This exists because design skills overlap. Two active aesthetic directions at once don't
> add up — they produce a screen that's neither. This document is the tie-breaker, written
> before the conflict happens.

---

## The phases

The factory's design process has two phases. Routing is by phase.

- **Foundation** — runs **once per project**, conducted by the `design-director` role.
  Produces `DESIGN.md`: identity, semantic tokens, aesthetic direction, design memory. **No UI
  code before `DESIGN.md` exists.**
- **Construction** — every UI task, conducted by the `developer-frontend` role. **Derives**
  from `DESIGN.md`'s tokens; it never invents values.
- **Post-render** — the critique. Runs on the rendered screen, never on code before a pixel
  exists.

## The table

| Skill | Responsibility | Moment | Activation condition |
| --- | --- | --- | --- |
| **A default aesthetic-direction skill** (`frontend-design` in the origin project) | Aesthetic direction: composition, visual language, translating the product's positioning into screen decisions. This is the skill that gives the interface *a voice*. | Foundation (sets the direction) and Construction (applies it) | **Default.** Active on every project that hasn't opted into a different direction. |
| **An alternate direction skill** (e.g. a different named craft vocabulary and refinement commands) | An alternative aesthetic direction, with its own craft vocabulary and refinement commands. | Foundation and Construction | **Opt-in, per project config.** Never together with the default direction skill — turning one on turns the other off. |
| **A component-scaffolding skill/CLI** (e.g. shadcn-style tooling) | Component mechanics: scaffolding accessible primitives that the project **takes ownership of** and customizes. Not visual identity. | Construction only | **Per stack profile.** Only when the project's stack profile is compatible and `DESIGN.md` already exists. Enters as a **skill/CLI, never as an MCP server**. A component shipped in its library-default state is a finding, not a delivery. |
| **A design-system-adherence skill** (for the "existing DS" case) | Component mechanics and interface patterns for the case where the project already has an inherited design system or component library, and the work is to adhere to it rather than invent new visual language. | Construction only | **"Existing DS" case.** Active when `DESIGN.md` records an inherited design system as the source of truth. |
| **`design-critic`** | Independent, read-only critique: applies the `[CRITIC]` checklist and the test *"could this have come from any similar prompt?"* | **Post-render only** | **Default** on every PR that touches UI. Verdict published to a file by a non-AI step, fail-closed. |

**Component library ≠ design system ≠ identity.** Scaffolding and adherence skills deliver
mechanics. Identity still comes from `DESIGN.md`. If the finished screen is recognizable as
"a screen from library X," the mechanics beat the identity — and that's the defect, not the
outcome.

## The three invariant rules

These have no exception by project configuration.

### 1. At most one active aesthetic direction

The default direction skill **or** an alternate one — never both. An aesthetic direction is a
system of mutually coherent choices; mixing two systems produces incoherence that looks like
variety. Component-mechanics skills **don't** count as an aesthetic direction and can coexist
with the active one — as long as they stay subordinate to it.

### 2. Critique only post-render

No critique skill opines before a rendered screen exists. Critiquing source code anticipates
problems the render disproves and misses the ones that only show up on the pixel. The
`design-critic` runs on screenshots at 375/768/1280, after the build, never before.

### 3. The project's `DESIGN.md` wins any conflict

Skill vs. `DESIGN.md`: `DESIGN.md` wins, always, without debate and without "but the skill
recommends." `DESIGN.md` is approved by the project owner through a Decision Gate (see
`factory/docs/AUTONOMY.md`); a skill is a heuristic. A heuristic doesn't override an approved
decision. If the skill is right and `DESIGN.md` is wrong, the path is a **new gate to change
`DESIGN.md`** — never a silent detour inside a task.

Full authority order, strongest to weakest:

> **the owner's explicit brief → the project's `DESIGN.md` → concepts absorbed into the core
> → the active aesthetic-direction skill → the component-mechanics skill**

## The absorbed concepts always apply

`factory/docs/CRAFT-PRINCIPLES.md` and `.claude/rules/design-antipatterns.md` are **core**,
not any skill's property. They apply:

- with the default direction skill active;
- with an alternate direction skill active;
- with a component-scaffolding or adherence skill in use;
- and when **no** design skill is active at all.

This is exactly why the detectors and bans originally specific to individual external skills
were **absorbed and rewritten into the core** instead of staying a dependency: a rule that
only exists while one specific skill is turned on isn't a quality floor — it's a side effect
of configuration. Changing the project's aesthetic direction changes the *taste*; it doesn't
change the **floor**.

## Where this gets enforced

This document is routing, not enforcement. The gates that make it stick — a deterministic
lint pass over the `[LINT]` subset, the `design-critic`'s `[CRITIC]` checklist, the Visual
Verification Loop, and a capped number of iteration rounds — live in the CI workflows and the
factory's rules, not here.
