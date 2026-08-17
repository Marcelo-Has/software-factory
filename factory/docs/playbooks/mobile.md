# Playbook — mobile

> **Skeleton — matures with the first real use.**
>
> This file exists so the category has a place and a name before it has content. It records
> the obvious emphases and, more importantly, **what's still undecided**. A skeleton is
> **not** authority: until it matures, what applies is `factory/docs/CRAFT-PRINCIPLES.md` (the
> floor) and `.claude/rules/design-antipatterns.md` (always), plus the project's own
> `DESIGN.md` (identity).
>
> **Scope note.** Mobile is, almost always, a **platform modifier** rather than a primary
> category: it combines with institutional, panel, or editorial. While this playbook is a
> skeleton, declare the real primary category and treat this as an added layer — and record
> platform conventions in `DESIGN.md` §13. See `factory/docs/playbooks/README.md`.

---

## Obvious emphases

- **Touch target ≥ 44px** of effective area, with spacing between neighboring targets. No
  density justifies a smaller target (craft §7) — and the clickable area has to match the
  visible one.
- **Safe areas and insets** respected: notch, gesture indicator, status bar, open keyboard.
  Full-height surfaces use `dvh`, never `vh`.
- **Gesture vs. button:** every gesture has a visible, reachable equivalent. A gesture is a
  shortcut for someone who already knows it; it's never the only path to an action — nor the
  only way to discover it exists.
- **Thumb zone:** the primary action within reach of one hand; the destructive action outside
  it.
- **Platform human-interface guidelines as a convention reference**, not as identity. Platform
  convention resolves what the user already knows how to do; identity still comes from
  `DESIGN.md`. Where the product breaks convention on purpose, the reason gets written into §13.
- **The virtual keyboard is a layout state**, not an accident: the focused field stays visible,
  the confirm button doesn't end up under the keyboard, the keyboard type matches the field.
- **Network and battery are design constraints:** page weight, images under a slow connection,
  and what happens when the connection drops mid-submission (craft §6, degraded state).
- **Orientation and zoom:** landscape doesn't break, and zoom up to 200% preserves content and
  function (craft §10).

## What's still undecided

- Real scope: responsive web, an installable PWA, a WebView, or a native app — each changes the
  gates.
- How this playbook **composes** with the primary category when the two give conflicting
  guidance (e.g. a panel's high density vs. touch-target size).
- `design-critic`'s mobile-specific extra rubric, and whether it runs beyond the Visual
  Verification Loop's 375/768/1280.
- Where "following platform convention" ends and "looking like a template app" begins.
- Verifiable gates: which ones become a deterministic lint check and which stay with the
  critic.
- Navigation pattern (bottom tab, drawer, stack) and whether it's a playbook decision or a
  `DESIGN.md` one.
- Handling of `prefers-reduced-motion` against native navigation transitions.

## How this skeleton matures

With the **first real project** in the category: what the Foundation had to decide that wasn't
written down, and what the critic found post-render that was characteristic of the category,
become sections 1–4 in the format of the complete playbooks
(`institutional-marketing.md`, `saas-dashboard.md`). Maturing the skeleton is its own issue's
work, not the work of the PR that used it for the first time.
