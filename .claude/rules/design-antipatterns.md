---
paths:
  - "app/web/**"
  - "**/*.svelte"
  - "**/*.css"
---
# Design anti-patterns (load when touching UI)

## The policy

Nothing on this list is absolutely forbidden. **It's forbidden as an unconscious default** —
the choice that happens on its own when nobody decided anything. Every item is allowed with a
**recorded justification tied to the product**: a line in the project's `DESIGN.md` saying
why *this* product, for *this* audience, wants *this*. Without that line, the item is a
finding.

**The owner's explicit brief wins.** If the request names the pattern ("I want
glassmorphism," "do it in dark mode"), it stops being an unconscious default and becomes a
requirement — record it in `DESIGN.md` and proceed. Authority order: **owner's brief >
project's `DESIGN.md` > this rule > active aesthetic-direction skill** (see
`factory/docs/SKILL-ROUTER.md`).

The principles behind this list live in `factory/docs/CRAFT-PRINCIPLES.md`. This list applies
**always**, with any aesthetic-direction skill active.

## How to read the tags

- **[LINT]** — verifiable by grep/AST/a static rule. Becomes a deterministic CI gate once the
  profile ships one. Until that gate exists, it's a manual check by `developer-frontend`.
- **[CRITIC]** — requires judgment on the rendered result. It's the `design-critic`'s
  checklist, post-render, never a lint rule.

A finding isn't an automatic veto: either fix it, or record the justification. What's **not**
acceptable is the item existing with neither.

---

## Structure and composition

1. [CRITIC] A grid of identical cards (icon + title + paragraph, 3 alike) as the page's
   structure.
2. [CRITIC] A centered hero in the badge + title + subtitle + two-buttons pattern.
3. [CRITIC] An eyebrow/kicker (small all-caps label) above every section title.
4. [LINT] Decorative section numbering (`01` / `02` / `03`) that carries no sequence
   information.
5. [LINT] A card inside a card.
6. [LINT] `100vh` on a full-height surface where `100dvh` is correct.
7. [LINT] Percentage arithmetic in flex (`calc(33% - 1rem)`) where CSS Grid solves it.
8. [CRITIC] The same layout family across three consecutive sections (repeated
   image+text zigzag).
9. [CRITIC] Monotonous spacing: the same value between everything, with no grouping by
   proximity.
10. [CRITIC] An empty cell left in a bento-style grid just to "close" the shape.
11. [CRITIC] A modal for a task that doesn't need to interrupt or protect focus.
12. [LINT] Content that's born `opacity: 0` / `visibility: hidden` waiting on JS to appear.
13. [CRITIC] A mobile collapse not declared in the same place the multi-column layout was
    defined.

## Surface and materiality

14. [LINT] Decorative glassmorphism / `backdrop-filter` without a real layered overlap.
15. [LINT] Decorative multi-layer shadow (three or more stacked `box-shadow`s on the same
    element).
16. [LINT] A zero-offset colored halo (glow) standing in for elevation.
17. [LINT] A hairline border **and** a wide diffuse shadow on the same element: pick one.
18. [LINT] A giant, uniform `border-radius` (≥ 24px on everything, from button to page
    container).
19. [LINT] A thick colored stripe (`border-left`/`border-right` > 1px) on a card, callout, or
    alert.
20. [LINT] An emoji standing in for an icon.
21. [LINT] Icons from different families in the same product, or inconsistent stroke weights.
22. [LINT] A decorative striped or grid background via `repeating-linear-gradient` with no
    surface asking for it.
23. [CRITIC] An icon inside a rounded tile above every title.
24. [CRITIC] A hand-built SVG imitating an illustration, photo, or scene.
25. [CRITIC] A fake product screenshot built out of `div`s.

## Color

26. [LINT] A purple → cyan/lilac gradient as the default palette.
27. [LINT] Gradient text.
28. [LINT] Pure black (`#000`) as text or background.
29. [LINT] Neutral gray as text over a colored background.
30. [LINT] A literal color value in a component instead of a semantic token from `DESIGN.md`.
31. [LINT] Contrast below WCAG AA (4.5:1 body text, 3:1 large text and component boundaries).
32. [CRITIC] Dark mode as the product's sole identity, chosen by reflex rather than by need.
33. [CRITIC] An inverted theme mid-page (one light section between dark ones).
34. [CRITIC] More than one accent color with no declared semantic role.
35. [CRITIC] "Tasteful" beige/cream as the default surface for an affective or crafted
    product.

## Typography

36. [LINT] Inter, Roboto, or the system font as the product's default type voice.
37. [LINT] An entire screen at 400/500 weight, with no contrasting weight pair (200/800 or
    equivalent).
38. [LINT] A flattened size scale — ratio smaller than ~1.2 between adjacent steps.
39. [LINT] `letter-spacing` beyond -0.04em.
40. [LINT] Body line measure outside the 45–75 character range.
41. [LINT] Body text below 16px, or UI text below 14px.
42. [LINT] All-caps running text, or justified text.
43. [LINT] A skipped heading level (`h2` → `h4`), or heading used for size instead of
    structure.
44. [LINT] A literal `font-size` outside `DESIGN.md`'s type scale.
45. [CRITIC] A giant italic serif display face as the hero headline.
46. [CRITIC] Emphasis that switches family (a serif word inside a sans-serif title).

## Behavior

47. [LINT] `bounce` / `elastic` / an overshoot cubic-bezier as the default easing.
48. [LINT] A hover `scale` or `translateY` applied by default to everything clickable.
49. [LINT] No `prefers-reduced-motion` block where animation exists.
50. [LINT] Animating `width`, `height`, `top`, `left`, `margin`, or `padding`.
51. [LINT] An auto-scrolling marquee, a decorative pulsing dot, or a blinking cursor outside
    an editable field.
52. [LINT] A custom cursor.
53. [LINT] `window.addEventListener('scroll', ...)` driving animation, instead of
    IntersectionObserver or CSS scroll-driven animation.
54. [LINT] An image that scales or rotates on hover.
55. [LINT] `outline: none` on focus with no visible replacement indicator.
56. [LINT] `placeholder` used as a field's label.
57. [CRITIC] A cascading entrance animation applied to every section on the page.
58. [CRITIC] Only the happy path implemented — missing empty, loading, error, overflow, or
    offline states.
59. [CRITIC] A generic circular spinner where a skeleton shaped like the final result would
    do.

## Content and copy

60. [LINT] Lorem ipsum or any filler text.
61. [LINT] Poetic placeholder copy like "Your Journey Starts Here."
62. [LINT] A generic "Get Started" on a generic blue button as the primary CTA.
63. [LINT] Marketing buzzwords: revolutionize, empower, unique experience, next-gen,
    seamless.
64. [LINT] Generic example data ("John Doe," "Acme," "user@email.com").
65. [LINT] A generic step label ("Step 1 / Step 2 / Step 3") instead of the step's actual
    name.
66. [LINT] A decorative metadata strip (city · time · version · build) on a product page.
67. [LINT] A scroll hint ("↓ scroll to explore," an animated mouse icon).
68. [LINT] Missing or generic (`"image"`, `"photo"`) `alt` text on a non-decorative image.
69. [LINT] An em dash (—) as a default punctuation habit in interface copy. Narrative prose
    is a declared exception — there, the dash belongs to the language, not to the LLM.
70. [CRITIC] Two CTAs with the same intent on the same page under different labels.
71. [CRITIC] An implausibly round number presented as real data (99.9%, 50%, 10x).
72. [CRITIC] An error message that names neither the problem nor the way out.
73. [CRITIC] A repeated aphoristic cadence ("Not X. Y.", "X. Just Y.") across three or more
    sections.
74. [CRITIC] More than one voice register on the same screen with no brand reason for it.

---

*List absorbed from **Impeccable** (Apache 2.0) and **taste-skill** (MIT), rewritten. The
detectors and bans from both sources were read, translated into our own vocabulary, and
reformulated as short, verifiable rules; no text was copied. The [LINT]/[CRITIC]
classification, the repository path scoping, and the recorded-justification policy are our
own.*
