# CLAUDE.md — Autonomous Software Factory

This is the generic core of an autonomous software factory: an event-driven GitHub
coreography of native subagents and workflows that builds and maintains a product.

## Golden rule

`factory/`, `.claude/`, and `.github/` are the immutable core, versioned as this
template repo. `project/` and `app/` are the **only** directories the factory writes
to when working on a product. Never write product state, code, or history into the
core directories; never make the core depend on a specific product.

## Role map

| Directory | Contract |
|---|---|
| `factory/` | Immutable core: docs, templates, profiles, checklists, and the bench (test harness). |
| `.claude/` | Claude Code config: settings, native subagents, rules, skills. |
| `.github/` | Deterministic CI/CD: gate scripts (non-AI), workflows (the coreography). |
| `project/` | Product-specific docs, design artifacts, and state. Factory writes here. |
| `app/` | Product code (`web/`, `api/`, `worker/` — per active profile). Factory writes here. |

See `factory/docs/FACTORY.md` for the full choreography: roles, the Generation and
Maintenance regimes, guard-rails, and operating lessons.

## D/FU glossary (stub)

- **D-xxx** — a numbered decision recorded in [`DECISIONS.md`](DECISIONS.md), this
  repo's own record of *why* something is built the way it is (own numbering,
  starting at D-001 — not inherited from any product this factory has built).
- **FU-xx** — a numbered guard-rail referenced across `factory/docs/` and the
  workflows it documents. The full glossary lands with `factory/docs/FACTORY.md`.

This file is intentionally short. Everything else lives under `factory/docs/`.
