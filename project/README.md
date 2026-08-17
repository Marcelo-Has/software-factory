# project/

## Contract

`project/` holds everything specific to the product being built with this factory:
documentation, design artifacts, and mutable state. Together with
[`app/`](../app/README.md), it is the **only** place the factory writes to when
operating on a product — the factory core itself (`factory/`, `.claude/`, `.github/`)
stays immutable per project.

This directory starts empty. Its subfolders are populated by the factory's
bootstrap flow and ongoing sessions, instantiating templates from `factory/templates/`.

## Layout

| Directory | Purpose |
|---|---|
| `docs/` | Product documentation (architecture, roadmap, decisions — product-specific, distinct from the factory's own `DECISIONS.md`). |
| `design/` | Design artifacts: `DESIGN.md`, brand assets, mockups. |
| `state/` | Living state the factory reads and updates across sessions (e.g. a variety registry). |
