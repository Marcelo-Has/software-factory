# REPO-STRUCTURE.md — the repo map

> A map of this repo's tree and what each part is for. Not a duplicate of
> [`FACTORY.md`](FACTORY.md) (the choreography) — read that for *how* the roles and
> regimes work. This file only answers *where things live*.

## The golden rule (CLAUDE.md)

`factory/`, `.claude/`, and `.github/` are the **immutable core**, versioned as this
template repo. `project/` and `app/` are the **only** directories the factory writes to
when working on a product. The core never depends on, or references, a specific
product — enforced by `.github/scripts/boundary-check.mjs`. The core is also 100%
English — enforced by `.github/scripts/english-only.mjs`.

## Top-level layout

```
factory/    immutable core: docs, templates, profiles, checklists, the bench
.claude/    Claude Code config: settings, native subagents, rules, skills
.github/    deterministic CI/CD: gate scripts, workflows, issue templates
project/    product-specific docs, design artifacts, state (factory writes here)
app/        product code — app/web/, app/api/, app/worker/ per active profile (factory writes here)
```

### `factory/` — immutable core

See [`factory/README.md`](../README.md) for the full contract. Layout:

| Directory | Contract |
|---|---|
| `factory/docs/` | The factory's own documentation: `FACTORY.md` (choreography), `AUTONOMY.md` (Decision Gate framework), `CRAFT-PRINCIPLES.md`, `DESIGN-CRITIC-RUBRIC.md`, `SKILL-ROUTER.md`, `INVENTORY.md` (this repo's own baseline photo), `playbooks/` (per-product-shape guidance). |
| `factory/templates/` | Blank templates instantiated into `project/` when a product is bootstrapped (`DESIGN-template.md`, `ROADMAP-template.md`, `BRAND-ASSETS-template.md`, `VARIETY-REGISTRY-template.md`). |
| `factory/profiles/` | The profile-module contract (`PROFILES.md`, DECISIONS.md D-010): `<dimension>/<module>/module.yaml` + `README.md`, one module per `frontend`/`backend`/`data-auth`/`deploy` dimension. Ten modules — three `complete` (`frontend/sveltekit`, `backend/baas-supabase`, `deploy/netlify`), seven `skeleton`. Wiring the core's scripts to `project/state/profile.json` (the resolver) is EVP3. |
| `factory/checklists/` | Deterministic operating checklists — ships empty in the core; see [`factory/checklists/README.md`](../checklists/README.md). |
| `factory/bench/` | The harness: `scenarios/` (bench prompts), `rubrics.md`, `collection.md`, and `tests/` (vitest suites that prove the gate scripts actually bite). |

### `.claude/` — Claude Code config

See [`.claude/README.md`](../../.claude/README.md) for the full contract.

- **`.claude/agents/`** — 9 native subagents, one file per role. Per
  [D-002](../../DECISIONS.md), each role has exactly one **executable** source:
  - **Executable contracts** (the file itself runs the role): `developer-lead`,
    `developer-frontend`, `developer-backend`, `design-director`.
  - **Derived role cards** (documentation only — the executable prompt lives inline
    in the matching `.github/workflows/<file>.yml`): `reviewer`, `verdict`, `refiner`,
    `supervisor`, `design-critic`. These files are headed with a note pointing at
    their real source; never edit behavior in them.
- **`.claude/rules/`** — loaded by path: `right-sizing.md` (quality-vs-phase filter),
  `security.md`, `testing.md`, `design-antipatterns.md` (scoped to `app/web/**`).
- **`.claude/skills/`** — one directory per skill, each holding a `SKILL.md`:
  `answer-decision`, `design-foundation`, `fix-ci`, `harden-workflows`, `new-issue`,
  `pause`, `resume`, `triage-pr`.
- **`.claude/hooks/`** — `PreToolUse` hook scripts registered in `settings.json`:
  `guard-core-writes.mjs` (GR-10 — see `factory/docs/FACTORY.md`), the marker-gated
  guard that keeps `factory/`, `.claude/`, `.github/`, `CLAUDE.md`, and `DECISIONS.md`
  immutable during a product session, without blocking factory-evolution sessions.
- **`.claude/settings.json`** — `PreToolUse` hooks and permission paths (`app/**` /
  `project/**` allow). Core immutability is enforced by the `guard-core-writes.mjs`
  hook (GR-10), not a static `deny`, so this file is identical across the
  factory-source repo and every product repo.

### `.github/` — deterministic CI/CD

See [`.github/README.md`](../../.github/README.md) for the full contract.

- **`.github/workflows/`** — the coreography: `ci.yml` (deterministic judge, no AI),
  `implement.yml` (Builder), `review.yml` / `security.yml` (Inspectors),
  `verdict.yml` (delivery Judge), `fix.yml` (Fixer), `supervisor.yml` (Planner,
  ported disabled), `refine.yml`, `design-critic.yml`, `screenshots.yml`,
  `daily-report.yml`, `claude.yml` (owner-gated ad hoc entrypoint).
- **`.github/scripts/`** — non-AI gates the workflows call: `english-only.mjs` +
  `english-only-allowlist.json`, `boundary-check.mjs`, `gate-design-md.mjs`,
  `lint-antipatterns.mjs`, `lighthouse-a11y.mjs`, `ui-routes.mjs` (route/viewport
  source of truth), `screenshots.mjs` / `await-screenshots.mjs` /
  `check-visual-evidence.mjs`, `merge-critic-passes.mjs`, `critic-verdict.mjs`,
  `preview-url.mjs`.
- **`.github/ISSUE_TEMPLATE/factory-task.md`** — the mandatory issue pattern for
  every unit of factory work.

### `project/` and `app/` — product state (factory writes here)

- **`project/`** — `docs/` (product docs, roadmap, product-specific decisions),
  `design/` (`DESIGN.md`, brand assets, mockups), `state/` (living state, e.g. a
  variety registry). See [`project/README.md`](../../project/README.md).
- **`app/`** — the product's actual code, empty until a profile is chosen
  (`app/web/`, `app/api/`, `app/worker/`). See [`app/README.md`](../../app/README.md).

## Where each regime's pieces live

- **Generation regime** (Supervisor working a roadmap): `supervisor.yml` +
  `.claude/agents/supervisor.md` (role card) read `project/docs/ROADMAP.md` and
  `DECISIONS.md`, and open issues from `.github/ISSUE_TEMPLATE/factory-task.md`.
- **Maintenance regime** (issue-driven): the same template, workflows, and roles;
  cadence and origin of issues differ, not the mechanism.
- **The bench** (proves the gates bite): `factory/bench/scenarios/` are the bench
  prompts; `factory/bench/tests/` are the vitest suites that exercise the
  `.github/scripts/*.mjs` gates against fixtures — run via `npm test`
  (`vitest.config.ts` at the repo root).

## Guard-rails

See [`FACTORY.md`](FACTORY.md)'s guard-rail table for the full list of non-AI
guard-rails (`GR-1`..`GR-9`) enforced by workflow steps, not agent judgment.
