# DESIGN-CRITIC-RUBRIC.md — the design-critic's rubric (single, versioned source)

> Core artifact (opinionated). The `design-critic` role (a read-only, fail-closed workflow)
> always evaluates a render against **this** rubric — it never derives criteria at runtime.
> Variety between projects comes from each project's own `DESIGN.md`, never from this ruler.
>
> **Absorbed inspiration.** This rubric's structure — a 3-pillar frame (Frictionless / Quality
> Craft / Trustworthy), an "N dimensions × severity × file-based output" pattern, and the
> swap/squint/signature/token operational tests — was absorbed from published frontend-design
> review methodologies and rewritten in this factory's own terms. If any of those sources
> disappears, this rubric doesn't change.

## Evaluation structure

3 pillars (the frame) → 7 dimensions (what gets evaluated) → severity per finding
(High/Med/Low). Output: a verdict file, published by a non-AI step, fail-closed.

## Severity

- **High** — violates the project's `DESIGN.md` contract, breaks a pillar, or fails the final
  originality test. **Any High → fail** (even if functionally correct).
- **Med** — must be fixed; doesn't block alone, but 2+ Med findings in the same dimension =
  fail.
- **Low** — polish; record it, don't block on it.

## The 7 dimensions (mapped onto the 3 pillars)

1. **Hierarchy, composition, and responsiveness** *(Quality Craft)* — focus, rhythm, density,
   grid, use of space; the eye knows where to go. The composition is **designed per
   breakpoint** (375/768/1280), not stretched; no overflow.
2. **Typographic system** *(Quality Craft)* — scale, weights, and weight contrast against the
   project's `DESIGN.md`, legibility, line measure.
3. **Color, surface, and elevation** *(Quality Craft / Trustworthy)* — uses the semantic
   tokens from `DESIGN.md` (nothing hardcoded outside the system), sufficient contrast,
   coherent depth/elevation, a faithful palette.
4. **Flow and affordances** *(Frictionless)* — the action is obvious, there's feedback,
   navigation has no dead ends; interactions are predictable; no decorative gestures/hovers
   that mislead.
5. **States and resilience** *(Frictionless / Trustworthy)* — empty / error / loading /
   overflow / offline are **designed** into the key components; nothing breaks under real,
   long, or missing data.
6. **Content and microcopy** *(Trustworthy)* — the user's voice, active voice, consistent
   naming, actionable errors; **never lorem ipsum**; the qualitative accessibility a score
   can't catch (visible focus, reading order, labels).
7. **Identity coherence / signature test** *(Quality Craft / Trustworthy)* — matches
   `DESIGN.md` and its **visual signature**; passes the swap test (replace the logo — is it
   still recognizable as this product?), the squint test, the signature test, and the token
   test. **Doesn't "look like shadcn / generic."**

## Final test (mandatory)

**"Could this have come from any similar prompt?"** If yes → **fail as High on dimension 7,
even if functionally correct.** This is the product's anti-default test.

## Inputs to the critic

Multi-viewport screenshots (375/768/1280) of the change under review + the project's
`DESIGN.md` + the anti-patterns rule (`.claude/rules/design-antipatterns.md`). **No screenshot
evidence → fail-closed (red).**
