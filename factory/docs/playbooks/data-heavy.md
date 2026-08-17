# Playbook — data-heavy

> **Skeleton — matures with the first real use.**
>
> This file exists so the category has a place and a name before it has content. It records
> the obvious emphases and, more importantly, **what's still undecided**. A skeleton is
> **not** authority: until it matures, what applies is `factory/docs/CRAFT-PRINCIPLES.md` (the
> floor) and `.claude/rules/design-antipatterns.md` (always), plus the project's own
> `DESIGN.md` (identity).
>
> **Category:** analysis, exploration, and monitoring of large volumes of data — not "a
> dashboard with more rows." While this is a skeleton, use `saas-dashboard.md` as the base and
> treat these emphases as an added layer. See `factory/docs/playbooks/README.md`.

---

## Obvious emphases

- **Maximum legible density:** the goal is to fit as much data as possible **without** falling
  below the floor — UI text never below 14px, contrast never below AA. Density is earned by
  removing decoration and containers, never by shrinking text.
- **Drill-down as the navigation structure:** aggregate → slice → record, with the path back
  always visible. Every level declares what it gains and loses relative to the one before.
- **Perceived latency is design:** what appears in the first 200ms, what arrives later, and how
  the screen behaves while it's arriving. A skeleton with the final shape, never a layout that
  jumps — and a partial result shown **marked as partial**.
- **Numeric legibility doesn't negotiate:** tabular figures, right alignment, constant
  precision per column, unit in the header. See `saas-dashboard.md` §3.2.
- **Filtering and slicing are the screen's primary state.** The active slice is always visible,
  nameable, and reversible; data without a declared slice isn't interpretable data.
- **Density doesn't suspend the states** (craft §6): empty, loading, error, overflow, and
  **partial** are still mandatory — at high volume, partial is the rule, not the exception.
- **Content scale is an input constraint:** design for the worst plausible volume (hundreds of
  thousands of rows, a long time series, a category with 300 values), not for the pretty
  sample.
- **Color has a semantic role and is never alone** (craft §4): at high volume, color becomes
  the main reading channel, which is exactly where it fails — color blindness, a bad monitor,
  printing.

## What's still undecided

- **Data visualization**: the biggest gap. What chart types, when to use each, axis scaling,
  zero handling, label density, legend vs. direct labeling — and **where the categorical or
  sequential palette comes from** without becoming a second accent (craft §4).
- Whether the data palette is a `DESIGN.md` decision (identity) or derived by a category rule.
- `design-critic`'s extra rubric for a chart: how to evaluate distortion, axis cherry-picking,
  and overlapping-series legibility over a screenshot.
- Virtualization, pagination, and infinite scroll: what's the product's default, and what each
  one costs in keyboard access, focus, and page search.
- Export (CSV, image, report) as a design deliverable, not an afterthought.
- Chart accessibility: a textual alternative, an equivalent table, keyboard navigation through
  a series.
- Acceptable performance limits and how they become a verifiable gate.
- Where `saas-dashboard.md` ends and this playbook begins — the boundary isn't written yet.

## How this skeleton matures

With the **first real project** in the category: what the Foundation had to decide that wasn't
written down, and what the critic found post-render that was characteristic of the category,
become sections 1–4 in the format of the complete playbooks
(`institutional-marketing.md`, `saas-dashboard.md`). Maturing the skeleton is its own issue's
work, not the work of the PR that used it for the first time.
