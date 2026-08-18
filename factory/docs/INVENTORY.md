# INVENTORY.md — factory-core baseline photo

One line per artifact in this repo's factory core (everything outside `project/` and
`app/`, the two directories the factory writes to per product — see `CLAUDE.md`'s golden
rule). This is this repo's **own** inventory, generated fresh at the end of the EVP1 port
(session S6) — it does not carry over the origin repo's `FACTORY-INVENTORY.md`, which was
that repo's photo of itself and is out of scope here (§2.5 of the port plan).

**Origin decision** below names the `D-xxx` entry in [`DECISIONS.md`](../../DECISIONS.md)
that fixes the artifact's shape, or the port session (`S1`–`S6`) that created it when no
specific decision applies beyond the general port/bootstrap (D-001).

Tag: this state is tagged `factory-core-v0` (annotated).

## Root

| Path | Purpose | Origin decision |
|---|---|---|
| `CLAUDE.md` | Factory entrypoint: golden rule, role map, D/FU glossary stub, pointer to `factory/docs/FACTORY.md`. | D-001 (S1) |
| `DECISIONS.md` | This repo's own decision log, own numbering from D-001. | D-001 (S1) |
| `README.md` | Repo-level one-liner. | S1 |
| `package.json` | Root deps: harness only (vitest + what S5 needed for gate tests) — no product deps. | D-001 (S1/S5) |
| `package-lock.json` | Lockfile for the above. | S1/S5 |
| `vitest.config.ts` | Points the harness at `factory/bench/tests/**`; `npm test` = the whole suite. | S5 |
| `.gitignore` | Standard ignores (`node_modules`, build output). | S1 |
| `.gitattributes` | Normalizes line endings (`text=auto` + explicit LF for `.mjs`/`.yml`/`.ts`/`.json`/`.md`, binary marker for `.png`) so Windows checkouts don't produce CRLF phantom diffs. | S7 |

## `.claude/` — Claude Code config, native subagents, rules, skills

| Path | Purpose | Origin decision |
|---|---|---|
| `.claude/README.md` | Directory contract: what lives here, what the boundary is. | S1 |
| `.claude/settings.json` | `PreToolUse` hooks (execution guard-rails) + permission paths (`app/**`, `project/**` allow; `factory/**` deny for product sessions). | D-001 (S3) |
| `.claude/settings.local.json.example` | Local-override template for `settings.json`. | S3 |
| `.claude/agents/developer-lead.md` | Native subagent, full executable contract: PR-first, 3-outcome exit contract, **F1 clause** (verifiable acceptance criteria gate). Single source of execution for this role. | D-001, F1 (S3) |
| `.claude/agents/developer-frontend.md` | Native subagent, full executable contract: UI piece specialist, Visual Verification Loop against `project/design/DESIGN.md`. Single source of execution. | D-001 (S3) |
| `.claude/agents/developer-backend.md` | Native subagent, full executable contract: domain/data/integrations specialist. Single source of execution. | D-001 (S3) |
| `.claude/agents/design-director.md` | Native subagent, full executable contract: runs the Foundation, writes `project/design/DESIGN.md`, Decision Gate on identity. Single source of execution. | D-001 (S3) |
| `.claude/agents/design-critic.md` | **Derived role card** — executable prompt lives in `.github/workflows/design-critic.yml`. | D-002 (S3) |
| `.claude/agents/refiner.md` | **Derived role card** — executable prompt lives in `.github/workflows/refine.yml`. | D-002 (S3) |
| `.claude/agents/reviewer.md` | **Derived role card** — executable prompt lives in `.github/workflows/review.yml`. | D-002 (S3) |
| `.claude/agents/supervisor.md` | **Derived role card** — executable prompt lives in `.github/workflows/supervisor.yml`. | D-002 (S3) |
| `.claude/agents/verdict.md` | **Derived role card** — executable prompt lives in `.github/workflows/verdict.yml`. | D-002 (S3) |
| `.claude/rules/design-antipatterns.md` | Rule: banned UI antipatterns, `paths:` scoped to `app/web/**`. | S3 |
| `.claude/rules/right-sizing.md` | Rule: quality-vs-phase filter (this file's own guidance). | S3 |
| `.claude/rules/security.md` | Rule: security baseline, BaaS items generalized to "the active profile's rules". | S3 |
| `.claude/rules/testing.md` | Rule: testing baseline, concrete commands delegated to the active profile. | S3 |
| `.claude/skills/answer-decision/SKILL.md` | Skill: answers a `decision-needed` issue, writes to `DECISIONS.md`. | S3 |
| `.claude/skills/fix-ci/SKILL.md` | Skill: fixes a red CI PR. | S3 |
| `.claude/skills/harden-workflows/SKILL.md` | Skill: hardens `review.yml`/`security.yml`/etc. (SHA pinning and friends). | S3 |
| `.claude/skills/new-issue/SKILL.md` | Skill: drafts a well-specified issue. | S3 |
| `.claude/skills/triage-pr/SKILL.md` | Skill: triages and resolves PR review findings. | S3 |
| `.claude/skills/pause/SKILL.md` | Skill: pauses the factory (stops autonomous runs). | S3 |
| `.claude/skills/resume/SKILL.md` | Skill: resumes the factory. | S3 |
| `.claude/skills/design-foundation/SKILL.md` | Skill: runs the Foundation flow. Flagged for reshaping as `/design-foundation` (D4) in EVP2. | S3 |

## `.github/` — deterministic gates and the choreography

| Path | Purpose | Origin decision |
|---|---|---|
| `.github/README.md` | Directory contract. | S1 |
| `.github/ISSUE_TEMPLATE/factory-task.md` | Issue template: labels, mandatory Visual requirements section on `area:frontend`. | S4 |
| `.github/scripts/english-only.mjs` | Gate: fails on non-English content in the factory core (2-layer detection). | S1.1 |
| `.github/scripts/english-only-allowlist.json` | Allowlist of cited proper names exempt from the English gate. | S1.1 |
| `.github/scripts/boundary-check.mjs` | Gate: fails if the factory core references the origin product's paths/identity. | D-001 (S1) |
| `.github/scripts/gate-design-md.mjs` | Gate: UI PRs must ship an approved `project/design/DESIGN.md`. | S4 |
| `.github/scripts/lint-antipatterns.mjs` | Gate: bans design antipatterns; Svelte selectors isolated in a marked profile-extension block. | S4 |
| `.github/scripts/lighthouse-a11y.mjs` | Gate: Lighthouse accessibility score >= 0.9 per route. | S4 |
| `.github/scripts/screenshots.mjs` | Captures multi-viewport screenshots for design-critic evidence. | S4 |
| `.github/scripts/await-screenshots.mjs` | Waits for the screenshot artifact before design-critic runs. | S4 |
| `.github/scripts/check-visual-evidence.mjs` | Gate: rejects design-critic runs with no screenshot evidence. | S4 |
| `.github/scripts/ui-routes.mjs` | Route discovery, parameterized per profile (SvelteKit = first case). | S4 |
| `.github/scripts/preview-url.mjs` | Resolves the deploy-preview URL behind a neutral adapter interface (Netlify = first adapter). | S4 |
| `.github/scripts/merge-critic-passes.mjs` | Merges multi-pass design-critic results. | S4 |
| `.github/scripts/critic-verdict.mjs` | Computes the design-critic pass/fail verdict from the rubric. | S4 |
| `.github/workflows/ci.yml` | Product jobs gated on "does `app/` have code"; `no-portuguese`->`english-only`, `boundary-check`, `factory-tests` jobs. | S1, S1.1, S4 |
| `.github/workflows/implement.yml` | developer-lead run envelope; inline **F1** line; `FACTORY_AUTH` toggle. | F1 (S4) |
| `.github/workflows/review.yml` | Reviewer role's executable prompt (DP-5 source); **F2** infra retry. | D-002 (S4) |
| `.github/workflows/security.yml` | Security scan workflow; **F2** infra retry. | S4 |
| `.github/workflows/verdict.yml` | Verdict role's executable prompt (DP-5 source); fail-closed; **F2** infra retry. | D-002 (S4) |
| `.github/workflows/fix.yml` | Fixer: reacts to red CI only (known limitation, not addressed in EVP1). | S4 |
| `.github/workflows/refine.yml` | Refiner role's executable prompt (DP-5 source); opt-in `refine:requested`, OWNER-gated, max 2 rounds. | D-002 (S4) |
| `.github/workflows/claude.yml` | OWNER-gated entrypoint for ad hoc Claude runs. | S4 |
| `.github/workflows/daily-report.yml` | Daily status report; re-entry `jq` filter preserved byte-for-byte (has a dedicated test). | S4 |
| `.github/workflows/supervisor.yml` | Supervisor role's executable prompt (DP-5 source); ported **disabled** (schedule off, re-enable documented). | D-002 (S4) |
| `.github/workflows/design-critic.yml` | Design-critic role's executable prompt (DP-5 source); mandatory screenshot evidence; **F2** infra retry. | D-002 (S4) |
| `.github/workflows/screenshots.yml` | Captures screenshots at 375/768/1280 viewports. | S4 |

Discarded, not ported: `claude-code-review.yml.disabled` — unmodified `claude-code-action`
boilerplate, superseded by the hardened `review.yml`/`security.yml`. See D-003.

## `factory/docs/` — core documentation

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/README.md` | Directory contract for `factory/`. | S1 |
| `factory/docs/FACTORY.md` | Canonical choreography doc: roles, Generation/Maintenance regimes, guard-rails, D/FU glossary, Operating lessons. | S2 |
| `factory/docs/AUTONOMY.md` | Generic Decision Gate framework (money-touching changes as the generic example). | S2 |
| `factory/docs/CRAFT-PRINCIPLES.md` | Craft principles for design/build quality. | S2 |
| `factory/docs/DESIGN-CRITIC-RUBRIC.md` | 7-dimension x severity rubric for the design-critic role. | S2 |
| `factory/docs/SKILL-ROUTER.md` | Authority order across skills. | S2 |
| `factory/docs/playbooks/README.md` | Playbook index. | S2 |
| `factory/docs/playbooks/data-heavy.md` | Playbook: data-heavy product shape. | S2 |
| `factory/docs/playbooks/editorial.md` | Playbook: editorial product shape. | S2 |
| `factory/docs/playbooks/institutional-marketing.md` | Playbook: institutional-marketing product shape. | S2 |
| `factory/docs/playbooks/mobile.md` | Playbook: mobile product shape. | S2 |
| `factory/docs/playbooks/saas-dashboard.md` | Playbook: SaaS-dashboard product shape. | S2 |
| `factory/docs/INVENTORY.md` | This file — the repo's own baseline photo. | S6 |
| `factory/docs/REPO-STRUCTURE.md` | The repo tree map: one section per top-level directory's contract, `.claude/` conventions, where each regime's pieces live. | S7 |

## `factory/templates/` — artifact templates, instantiated into `project/`

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/templates/DESIGN-template.md` | `DESIGN.md` template; cites the origin repo's "Ballpoint Ink" example (cited, never copied). | S2 |
| `factory/templates/BRAND-ASSETS-template.md` | Brand-assets doc template. | S2 |
| `factory/templates/VARIETY-REGISTRY-template.md` | Variety-registry template (lives in `project/state/` once instantiated). | S2 |
| `factory/templates/ROADMAP-template.md` | Roadmap template, structure extracted from the origin repo's `ROADMAP.md`, product content stripped. | S2 |

## `factory/profiles/` — stack-specific raw material (formalized in EVP2)

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/profiles/README.md` | Explains the raw-material treatment: not yet formal profile modules. | S2 |
| `factory/profiles/.gitkeep` | Keeps the empty top-level dir tracked. | S1 |
| `factory/profiles/frontend/sveltekit/README.md` | Marks the SvelteKit material as raw, "formalized as profile modules in EVP2". | S5 |
| `factory/profiles/frontend/sveltekit/stylelint.config.js` | Ported Stylelint config; generic rules commented apart from this-product-specific token names. | D-004 (S5) |

## `factory/checklists/`

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/checklists/.gitkeep` | Placeholder — real content is an EVP2 deliverable. | S1 |
| `factory/checklists/README.md` | Directory contract: ships empty in the core, real checklists land in EVP2, never written per-product. | S7 |

## `factory/bench/` — the harness

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/bench/README.md` | Harness overview. | S5 |
| `factory/bench/collection.md` | Transcription/cost collection mechanism, described generically. | S5 |
| `factory/bench/rubrics.md` | Scoring rubrics. | S5 |
| `factory/bench/scenarios/C1-catalog-page.md` | Bench scenario C1 (catalog page), generalized. | S5 |
| `factory/bench/scenarios/C2-explainer-page.md` | Bench scenario C2 (explainer page) — the design baseline scenario. | S5 |
| `factory/bench/scenarios/C3-planted-bug.md` | Bench scenario C3 (planted bug). | S5 |
| `factory/bench/scenarios/C4-gate-trap.md` | Bench scenario C4 (gate trap). | S5 |
| `factory/bench/scenarios/C5-ambiguous-spec.md` | Bench scenario C5 (ambiguous spec) — now asserts the **F1** clause. | F1 (S5) |
| `factory/bench/tests/design/antipatterns.test.ts` | Exercises `lint-antipatterns.mjs` against fixtures. | S5 |
| `factory/bench/tests/design/critic-passes.test.ts` | Exercises multi-pass merge logic. | S5 |
| `factory/bench/tests/design/critic-verdict.test.ts` | Exercises `critic-verdict.mjs` against fixtures. | S5 |
| `factory/bench/tests/design/states.test.ts` | Reads `project/design/DESIGN.md`'s required-states table; **self-skips** on the empty skeleton. | D-004 (S5) |
| `factory/bench/tests/design/style.test.ts` | Lints fixtures against `stylelint.config.js`; last sub-test reads `app/web` live and **self-skips**. | D-004 (S5) |
| `factory/bench/tests/design/tokens.test.ts` | Reads `app/web/src/lib/styles/tokens.css`; **self-skips** on the empty skeleton. | D-004 (S5) |
| `factory/bench/tests/design/a11y-baseline.json` | Ratchet baseline for a future a11y gate: axe rules tolerated per `<route>@<width>`. Ported from the source repo's `tests/design/a11y-baseline.json`, generalized (translated to English, origin product route names replaced by the single `/` route placeholder `ui-routes.mjs` already uses) since nothing in this repo's harness consumes it yet — `lighthouse-a11y.mjs` still gates on a fixed `FLOOR`, not this file. | S7 |
| `factory/bench/tests/design/fixtures/README.md` | Fixture index. | S5 |
| `factory/bench/tests/design/fixtures/antipatterns-clean.svelte` | Fixture: no antipatterns present. | S5 |
| `factory/bench/tests/design/fixtures/antipatterns-empty-justification.svelte` | Fixture: antipattern with an empty justification. | S5 |
| `factory/bench/tests/design/fixtures/antipatterns-justified.svelte` | Fixture: antipattern with a valid justification. | S5 |
| `factory/bench/tests/design/fixtures/antipatterns-useless-justification.svelte` | Fixture: antipattern with a non-justifying justification. | S5 |
| `factory/bench/tests/design/fixtures/antipatterns-violated.svelte` | Fixture: unjustified antipattern (gate must reject). | S5 |
| `factory/bench/tests/design/fixtures/tokens-anonymous-exception.css` | Fixture: token exception with no owner. | S5 |
| `factory/bench/tests/design/fixtures/tokens-clean.css` | Fixture: no token violations. | S5 |
| `factory/bench/tests/design/fixtures/tokens-justified-exception.css` | Fixture: justified token exception. | S5 |
| `factory/bench/tests/design/fixtures/tokens-needless-exception.css` | Fixture: unjustified token exception. | S5 |
| `factory/bench/tests/design/fixtures/tokens-violated.css` | Fixture: raw value bypassing tokens (gate must reject). | S5 |
| `factory/bench/tests/design/fixtures/verdict-approved.md` | Fixture: an approved design-critic verdict. | S5 |
| `factory/bench/tests/design/fixtures/verdict-outright.md` | Fixture: an outright-rejected verdict (no evidence). | S5 |
| `factory/bench/tests/design/fixtures/verdict-rejected.md` | Fixture: a rejected verdict. | S5 |
| `factory/bench/tests/hooks/pretooluse.test.ts` | Exercises the `PreToolUse` hooks in the new `.claude/settings.json`. | S5 |
| `factory/bench/tests/workflows/design-md.test.ts` | 22 cases against `gate-design-md.mjs`, paths updated. | S5 |
| `factory/bench/tests/workflows/reentry.test.ts` | Executes the real `daily-report.yml` re-entry `jq` filter. | S5 |
| `factory/bench/tests/workflows/screenshots.test.ts` | Exercises the screenshot capture/wait logic. | S5 |
| `factory/bench/tests/workflows/visual-evidence.test.ts` | Exercises `check-visual-evidence.mjs`. | S5 |

## Known gaps vs. the port map (see the S6 session report for detail)

Both gaps below were closed in session S7 (the audit-fixes session) — see `DECISIONS.md`
D-005/D-006 and the rows above. `factory/bench/tests/design/a11y-baseline.json` still has
no consumer in this repo's harness (`lighthouse-a11y.mjs` still gates on a fixed `FLOOR`);
wiring a ratchet-based a11y gate against it is a future EVP2 concern, not this session's.
