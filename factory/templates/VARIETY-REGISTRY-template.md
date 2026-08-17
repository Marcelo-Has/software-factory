# Factory variety registry

## How to instantiate

Copy this file to `project/state/VARIETY-REGISTRY.md` — it lives at the **factory** level
across every product this factory has built, not inside a single project, precisely so it can
be read from the outside and compared project-to-project. If your factory instance already
has a registry from an earlier product, **append to that one** instead of starting a new file
per product. Start the table below empty; the first row is written only after a project's
`DESIGN.md` is **approved** (never from a candidate).

---

## What this is

The **anti-homogenization** mechanism for the factory's design layer. One row per project that
went through the Foundation, recording **the identity it walked away with**.

**The problem this solves.** An unguided LLM's default is a UI that's technically perfect and
visually mute. That default doesn't go away between projects — it reappears **identical** on
the next one. Two different brands landing on the same palette and the same typographic pair
haven't discovered the right answer; they've discovered the same default. Without memory
across projects, the factory converges on its own, and nobody notices, because each Foundation,
looked at in isolation, seems defensible.

---

## How to use it

**Who reads it:** the `design-director` role, during the Foundation, **before** exploring
directions — never after already holding a proposal. Consulting the registry after choosing is
seeking permission, not avoiding convergence.

**The rule:**

1. **The Foundation CONSULTS this registry before proposing.** Reading the existing rows is
   part of the process; what was read goes into the Foundation's report.
2. **Converging visually with a recent project requires an anchored justification** — anchored
   in the first three columns: *context/business area*, *type/app category*, and the *project*
   itself. Convergence means: the same typographic family, the same palette temperature, the
   same density, or the same visual signature as an already-registered row.
3. **An anchored justification** ties the similarity to a real, shared constraint — the same
   business area with an established convention, the same interface category with the same
   reading pattern, the same audience. "It's what works best," "it's more readable," and "it
   fits the product" are **not anchors**: they'd justify any project, and that's exactly what
   disqualifies them.
4. **No anchored justification → redo the Foundation.** This isn't a note to log and move
   past — the proposal goes back to exploring at least 3 directions, and the detected
   convergence enters the project's own design memory (`DESIGN.md` §15) as a discarded
   alternative, with the reason.

**Who writes it:** the **approved** Foundation — the row is added when the owner approves
`DESIGN.md`, with the values from the approved document, never from a candidate. The registry
records facts, not proposals.

**Never:** delete or rewrite an existing row. If a project's identity changes later (which
requires a new Decision Gate), **add a new row** with the date of the change. A removed row is
a convergence that stops being detectable.

---

## The registry

<!-- One row per project, most recent last. Fill in as follows:
     · Project              — the repository/product name.
     · Context / area       — the real business area (personalized gifts, health, logistics…).
     · Type / category      — the interface category declared in DESIGN.md §0.
     · Named direction      — the proper name from §1. An adjective isn't a name ("modern,"
                              "clean," "minimalist," "elegant," "premium" are banned by the
                              template).
     · Palette              — the main ROLES, not the hex list: base, surface, ink, accent
                              (with each hex in parentheses).
     · Typographic pair     — display / body.
     · Visual signature     — the one from §3, described by its MECHANIC, not its impression.
     · Date                 — the DESIGN.md approval date (YYYY-MM-DD). -->

| Project | Context / business area | Type / app category | Named direction | Palette (main roles) | Typographic pair | Visual signature | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `[TO FILL]` | `[TO FILL]` | `[TO FILL]` | `[TO FILL]` | `[TO FILL]` | `[TO FILL]` | `[TO FILL]` | `[TO FILL]` |
