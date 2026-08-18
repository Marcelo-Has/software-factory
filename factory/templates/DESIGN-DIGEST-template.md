# DESIGN-DIGEST.md — template

## How to instantiate

Copy this file to `project/design/DESIGN-DIGEST.md` and fill it in **after** `DESIGN.md` is
approved and `project/design/tokens.css` exists — this is the third D4 deliverable
(`/design-foundation`), alongside the two of them. Convention (see `DECISIONS.md` D-009):

- `<!-- HOW TO FILL: ... -->` — the instruction. **Removed** from the filled copy.
- `[TO FILL IN]` — a required field still empty. A `DESIGN-DIGEST.md` with any `[TO FILL IN]`
  left in it **is not a candidate for approval**.

**What this file is for.** `DESIGN.md` is the Foundation's full reasoning — references,
rejected alternatives, the fifteen sections a design direction actually requires. It stays the
authority. But an agent building one screen in the Generation phase doesn't need all of it
re-read on every task; it needs the **operational** subset fast: which token to reach for,
which states are mandatory, what the copy voice forbids. That subset is this file — a compact,
skimmable digest, never a second source of truth. Every value here is copied from an approved
`DESIGN.md`/`tokens.css`, never invented here first; if the two ever disagree, `DESIGN.md`
wins and this file is stale and needs regenerating.

**Density matters more than completeness here.** Terse rows beat prose. A Generation-phase
agent should be able to read this whole file in under a minute — closer to a cheat sheet than
to the source document. `factory/templates/DESIGN-template.md`'s "How to instantiate" cites
the origin project's real, approved "Ballpoint Ink" `DESIGN.md` as an illustration of the
specificity a full design contract needs; read this file's own eventual length against that
same illustration in reverse — where `DESIGN.md` earns its length, this digest earns its
brevity.

---

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `[TO FILL IN]` — `candidate` \| `approved` |
| **Date** | `[TO FILL IN]` — date of the current status (YYYY-MM-DD) |
| **Approved by** | `[TO FILL IN]` — the owner (empty while candidate) |
| **Source of truth** | `project/design/DESIGN.md` (§`[TO FILL IN]` and later) + `project/design/tokens.css` — this file is derived, never authoritative on its own |

---

## 1. Direction, in one line

`[TO FILL IN — the named direction from DESIGN.md §1, plus its one-sentence essence]`

**The signature (DESIGN.md §3):** `[TO FILL IN]` — appears on: `[TO FILL IN]`; never on:
`[TO FILL IN]`.

---

## 2. Token quick-reference

<!-- HOW TO FILL: copy the resolved VALUES from tokens.css, not the explanations from
     DESIGN.md §4 — an agent reaches for this table mid-task, not for the reasoning. -->

| Token | Value |
| --- | --- |
| `surface` | `[TO FILL IN]` |
| `foreground` | `[TO FILL IN]` |
| `accent` | `[TO FILL IN]` |
| `destructive` / `success` / `warning` | `[TO FILL IN]` |
| `border` / `focus` | `[TO FILL IN]` |
| Spacing base | `[TO FILL IN]` |
| Radius (`sm`/`md`/`lg`/`full`) | `[TO FILL IN]` |
| Type ratio | `[TO FILL IN]` |
| Motion base duration + curve | `[TO FILL IN]` |

---

## 3. Mandatory checklist per screen

<!-- HOW TO FILL: the operational version of DESIGN.md §11-§12 — a checklist to run against
     any new screen before it's called done. -->

- [ ] Every data-bearing component: empty, loading, error, overflow, offline/degraded states
      designed — not just the happy path.
- [ ] Hover, active, disabled, selected, and **visible focus** implemented.
- [ ] WCAG 2.2 AA contrast verified for any new color pairing.
- [ ] Responsive behavior checked at 375 / 768 / 1280.
- [ ] The signature (§1 above) present where it belongs, absent where it doesn't.
- [ ] `prefers-reduced-motion` respected if the screen animates anything.
- [ ] `[TO FILL IN — any product-specific check from DESIGN.md §12's "beyond the floor" row]`

---

## 4. Copy voice, quick rules

<!-- HOW TO FILL: the operational subset of DESIGN.md §9. -->

**Voice:** `[TO FILL IN — one line]`
**Controls are named:** `[TO FILL IN — the naming rule]`
**Errors are written:** `[TO FILL IN — the rule]`
**Never say:** `[TO FILL IN — the short banned list]`

---

## 5. Component philosophy, quick rule

<!-- HOW TO FILL: the operational subset of DESIGN.md §8 — what to build vs. what to import. -->

**We own:** `[TO FILL IN]`
**We import (library primitives) and always customize with:** `[TO FILL IN]`

---

## 6. When this digest and `DESIGN.md` disagree

`DESIGN.md` wins, always. Flag the disagreement to the owner and regenerate this file — do not
resolve the conflict by editing this file to match a guess.
