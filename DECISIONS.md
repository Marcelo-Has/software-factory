# DECISIONS.md

Numbered decision log for this repo. Numbering is this repo's own, starting at
D-001 — it does not inherit numbers from any product this factory has built or will
build.

---

## D-001 — Bootstrap this repo as the generic factory core

**Date:** 2026-08-17
**Status:** accepted

This repo is the generic, product-agnostic core of an autonomous software factory,
extracted (ported) from an existing product repo. The origin repo stays read-only
and is never referenced by path or content from the core.

Decisions fixed for this port:

- **Hierarchy.** `factory/` (immutable core) × `project/` (product docs, design,
  state) × `app/` (product code). Only `project/` and `app/` are ever written to
  when the factory operates on a product; `factory/`, `.claude/`, and `.github/`
  stay immutable per project.
- **Language.** Everything under `CLAUDE.md`, `DECISIONS.md`, `.claude/`,
  `.github/`, `factory/` is 100% English — no Portuguese anywhere, enforced by a CI
  gate (`english-only.mjs`).
- **Boundary.** The origin repo's product identity (paths, hosting identifiers,
  product name) must never leak into the core, enforced by a CI gate
  (`boundary-check.mjs`).
- **Own history.** This file starts at zero: it is this repo's own decision record,
  not a copy of the origin repo's decision history. Where that history holds a
  lesson worth keeping, it is ported as a lesson (no origin issue numbers), not as
  a decision entry here.
- **Incremental port.** The port happens over a small number of focused sessions
  (skeleton, docs, `.claude/`, `.github/`, harness, closing sweep), each a small,
  auditable commit — so the porting itself is reviewable the same way factory
  output is expected to be.

**Why:** the factory needs to be reusable across products. Keeping it entangled
with one product's history, paths, and language would make every future product
pay the cost of the first one.

---

## D-002 — DP-5: single source of truth per role

**Date:** 2026-08-17
**Status:** accepted

Every role in the choreography has exactly one **executable** source. Never two.

- **Roles executed as native Claude Code subagents** — `developer-lead`,
  `developer-frontend`, `developer-backend`, `design-director` — keep their full
  contract in `.claude/agents/<role>.md`. That file **is** the source of execution
  (it's the native subagent mechanism).
- **Roles executed by a workflow with an inline prompt** — `reviewer`, `verdict`,
  `refiner`, `supervisor`, `design-critic` — have their executable prompt live inline
  in the matching `.github/workflows/<file>.yml`. The corresponding
  `.claude/agents/<role>.md` becomes a **derived role card**: a short role summary
  with no duplicated executable steps, headed
  > Role documentation only — the executable prompt lives in
  > `.github/workflows/<file>.yml`. Never edit behavior here.

**Why:** the origin project carried this exact role split with both files updated by
hand in parallel — the `.md` contract and the workflow's inline prompt — and let them
drift out of sync, most visibly on `design-critic`, which shipped a synchronization
note ("keep both in sync until a later decision") instead of a resolution. Two
editable sources for one behavior is a bug waiting for the next edit that only
touches one of them. This factory resolves it at the port: pick one file as the
single source per role, and make the other one inert documentation by construction.

---

## D-003 — Discard `claude-code-review.yml.disabled`, don't port it

**Date:** 2026-08-17
**Status:** accepted

The origin repo's `.github/workflows/claude-code-review.yml.disabled` is not ported
into this repo's `.github/workflows/`.

**Why:** the file is the unmodified `claude-code-action` boilerplate template — it
carries none of this factory's guard-rails (no `FACTORY_AUTH` toggle, no
`delivery:incomplete` gate, no agent-config restoration step, no fail-closed publish
step) and none of the port's translation or hardening. Its function — an automated
`/code-review` pass on every PR — is already covered, and hardened, by `review.yml`
and `security.yml`, which are this factory's real, dedicated review gates. Porting a
second, unhardened, overlapping reviewer would add a role with no guard-rails next to
two that have them, for no coverage this factory doesn't already have.

---

## D-004 — Harness tests that need real product content self-skip on the empty skeleton

**Date:** 2026-08-18
**Status:** accepted

Three of the six ported `factory/bench/tests/design/*.test.ts` suites (`states`, `style`,
`tokens`) don't just exercise a deterministic gate script against fixtures — they read (or, for
`style`'s last sub-test, lint) live product content: `project/design/DESIGN.md`'s real
required-states table, `app/web`'s real E2E specs and source tree, and
`app/web/src/lib/styles/tokens.css`. None of that exists yet in this generic, empty core.

Each of those suites now guards itself: it checks whether its prerequisite files exist and,
if not, registers a single skipped test explaining why, instead of failing. They activate
automatically once a real `project/design/DESIGN.md` and `app/web` exist — the same pattern
`ci.yml`'s `detect-app-code` job already uses to gate product jobs on "does `app/` have code".

As a prerequisite for `style.test.ts`'s fixture-based sub-tests (which need a config to lint
against, though not real product code), this session also ported the origin repo's
`stylelint.config.js` into `factory/profiles/frontend/sveltekit/`, per the raw-material
treatment already decided for stack-specific pieces — translated to English, with its generic
mechanism and this-product-specific token names marked apart in comments. No session in the
port plan had explicitly claimed that file; it's ported here because the harness test that
needs it is this session's own deliverable.

**Why:** the alternative — porting these three tests as literal translations with no guard —
would leave `npm test` red on the empty skeleton, contradicting this session's own validation
bar ("harness FULLY GREEN locally and in CI on the empty skeleton"). Skipping them outright
instead of porting them would silently drop real coverage the moment a product does exist,
since nobody would be prompted to write them then. Self-skipping keeps the test present,
honest about not applying yet, and automatic to activate — no second porting pass required.

---

## D-005 — Redesign the language gate from "no-Portuguese" to "English-only" (retroactive, S1.1)

**Date:** 2026-08-17 (decided during port session S1.1; recorded here retroactively during
the S7 audit-fixes session, which found the decision was never written down)
**Status:** accepted

The gate that used to be framed as "no-Portuguese" is redesigned as "English-only", and
implemented as `.github/scripts/english-only.mjs` (renamed from an earlier
"no-portuguese" framing) with two detection layers:

- **Layer A (generic):** any Unicode letter outside `A-Za-z` is flagged. Catches accented
  or non-Latin scripts (Portuguese, Spanish, French, German, and anything else) without
  knowing the language in advance.
- **Layer B (origin-specific):** a curated Portuguese stopword list, matched as whole
  words, case-insensitive — because Layer A is blind to unaccented Portuguese words that
  are also valid English-adjacent letter sequences (common short connectives and verb
  forms with no diacritics).
- **One shared allowlist** (`english-only-allowlist.json`) for cited proper names, applied
  to both layers.
- **Coverage:** `CLAUDE.md`, `DECISIONS.md`, `.claude/`, `.github/`, `factory/` — never
  `project/` or `app/`, which hold product content out of scope by design.

**Why:** the core's actual requirement is "English-only" (R-EN), not "anti-Portuguese".
Portuguese is only the origin language this core was ported from — a historical fact about
where the material came from, not a property the gate should be named after. Framing the
gate as English-only with Portuguese as Layer B's origin-specific extension makes the
scope correct today and keeps the door open for a fork with different contributors to swap
Layer B's wordlist (or add a Layer C) for its own origin language, without renaming or
reframing the gate itself.

---

## D-006 — Rename guard-rail reference tags from `D-0xx` to `GR-xx`

**Date:** 2026-08-18
**Status:** accepted

`FACTORY.md`'s guard-rail table, and the comments in the workflows/docs that cite it,
reused the *origin* repo's decision numbers (`D-019`, `D-033`, `D-034`, `D-037`, `D-039`,
`D-042`, `D-047`, `D-087`, `D-032`) as reference tags for nine non-AI guard-rail
mechanisms. This repo's own `DECISIONS.md` has its own numbering, starting at D-001
([D-001](#d-001--bootstrap-this-repo-as-the-generic-factory-core)), that will eventually
reach those same numbers and collide with them. The tags are renamed to a dedicated
`GR-xx` (guard-rail) sequence, disjoint from `D-xxx`, per this mapping:

| Origin tag | New tag | Guard-rail |
|---|---|---|
| D-019 | GR-1 | exit contract |
| D-034 | GR-2 | non-AI publication |
| D-037 | GR-3 | fail-closed publish |
| D-047 | GR-4 | turn-cap re-entry |
| D-087 | GR-5 | idempotent rounds / dual pass |
| D-033 | GR-6 | judge config integrity |
| D-042 | GR-7 | diff over disk |
| D-039 | GR-8 | fork gate |
| D-032 | GR-9 | credential hygiene |

Executed as a mechanical sweep across `CLAUDE.md`, `DECISIONS.md`, `.claude/`, `.github/`,
and `factory/`: every occurrence of an origin tag replaced with its `GR-x` equivalent. No
workflow logic changed — only comment text and the `FACTORY.md` table. `FACTORY.md`'s
table keeps an "(origin D-0xx)" suffix next to each `GR-x` heading, as a pointer back to
where the origin project first named the mechanism; nowhere else carries that suffix.

**Why:** a reference tag namespace that is *guaranteed* to collide with this repo's own,
separately-numbered decision log is a bug waiting for D-019 (this repo's own, unrelated
19th decision, whenever it's made) to be misread as the exit-contract guard-rail. A
disjoint `GR-xx` sequence for guard-rail mechanisms removes the collision permanently,
independent of how large `DECISIONS.md` grows.
