# INVENTORY.md — factory-core baseline photo

One line per artifact in this repo's factory core (everything outside `project/` and
`app/`, the two directories the factory writes to per product — see `CLAUDE.md`'s golden
rule). This is this repo's **own** inventory, generated fresh at the end of the EVP1 port
(session S6) — it does not carry over the origin repo's `FACTORY-INVENTORY.md`, which was
that repo's photo of itself and is out of scope here (§2.5 of the port plan). Refreshed at
the end of EVP2 (session S9) to add the Definition Phase wave (D0–D6 skills, DP-3 contracts,
the profile-module contract, GR-10) — session labels `S1`–`S9` below refer to EVP2 sessions
unless prefixed `EVP1`.

**Origin decision** below names the `D-xxx` entry in [`DECISIONS.md`](../../DECISIONS.md)
that fixes the artifact's shape, or the port/build session that created it when no specific
decision applies beyond the general port/bootstrap (D-001).

Tag: this state is tagged `factory-core-v1` (annotated); the EVP1 baseline photo was
`factory-core-v0`.

## Root

| Path | Purpose | Origin decision |
|---|---|---|
| `CLAUDE.md` | Factory entrypoint: golden rule, role map, D/FU glossary stub, pointer to `factory/docs/FACTORY.md`. | D-001 (S1) |
| `DECISIONS.md` | This repo's own decision log, own numbering from D-001. | D-001 (S1) |
| `README.md` | Repo-level one-liner. | S1 |
| `package.json` | Root deps: harness only (vitest + what S5 needed for gate tests, `yaml` added EVP2 S4 for `gate-contracts.mjs`/`gate-definition-done.mjs`) — no product deps. | D-001 (S1/S5) |
| `package-lock.json` | Lockfile for the above. | S1/S5 |
| `vitest.config.ts` | Points the harness at `factory/bench/tests/**`; `npm test` = the whole suite. | S5 |
| `.gitignore` | Standard ignores (`node_modules`, build output); `_plan/` added (EVP2 S1) to keep the local, Portuguese execution plan out of the repo. | S1 |
| `.gitattributes` | Normalizes line endings (`text=auto` + explicit LF for `.mjs`/`.yml`/`.ts`/`.json`/`.md`, binary marker for `.png`) so Windows checkouts don't produce CRLF phantom diffs. | S7 |

## `.claude/` — Claude Code config, native subagents, rules, skills

| Path | Purpose | Origin decision |
|---|---|---|
| `.claude/README.md` | Directory contract: what lives here, what the boundary is. | S1 |
| `.claude/settings.json` | `PreToolUse` hooks (execution guard-rails + secret filters) + permission paths (`app/**`, `project/**` allow). The static `Edit(factory/**)`/`Write(factory/**)` deny was replaced (EVP2 S1) by two marker-gated hook registrations (GR-10) — the file is now identical across the factory-source and every product repo. | D-001 (S3); D-008 (EVP2 S1) |
| `.claude/settings.local.json.example` | Local-override template for `settings.json`. | S3 |
| `.claude/hooks/guard-core-writes.mjs` | `PreToolUse` hook (GR-10): blocks `Edit`/`Write`/`MultiEdit`/`NotebookEdit`, and (defense-in-depth) matching `Bash` write commands, against `factory/`, `.claude/`, `.github/`, `CLAUDE.md`, `DECISIONS.md` — only in **product mode** (`project/state/init.json` exists, or `project/` holds content beyond `README.md`/`.gitkeep`). `ALLOWLIST` const for future exceptions. | D-008 (EVP2 S1) |
| `.claude/agents/developer-lead.md` | Native subagent, full executable contract: PR-first, 3-outcome exit contract, **F1 clause** (verifiable acceptance criteria gate). Single source of execution for this role. | D-001, F1 (S3) |
| `.claude/agents/developer-frontend.md` | Native subagent, full executable contract: UI piece specialist, Visual Verification Loop against `project/design/DESIGN.md`. Single source of execution. | D-001 (S3) |
| `.claude/agents/developer-backend.md` | Native subagent, full executable contract: domain/data/integrations specialist. Single source of execution. | D-001 (S3) |
| `.claude/agents/design-director.md` | Native subagent, full executable contract: runs the Foundation, writes `project/design/DESIGN.md`, Decision Gate on identity. Single source of execution. `PRODUCT.md` section cross-references corrected to §2/§6 and the provenance tag unified to `created-in-Foundation` (EVP2 S8.1, F-5/F-6). | D-001 (S3) |
| `.claude/agents/design-critic.md` | **Derived role card** — executable prompt lives in `.github/workflows/design-critic.yml`. | D-002 (S3) |
| `.claude/agents/refiner.md` | **Derived role card** — executable prompt lives in `.github/workflows/refine.yml`. | D-002 (S3) |
| `.claude/agents/reviewer.md` | **Derived role card** — executable prompt lives in `.github/workflows/review.yml`. | D-002 (S3) |
| `.claude/agents/supervisor.md` | **Derived role card** — executable prompt lives in `.github/workflows/supervisor.yml`. | D-002 (S3) |
| `.claude/agents/verdict.md` | **Derived role card** — executable prompt lives in `.github/workflows/verdict.yml`. | D-002 (S3) |
| `.claude/rules/design-antipatterns.md` | Rule: banned UI antipatterns, `paths:` scoped to `app/web/**`. | S3 |
| `.claude/rules/right-sizing.md` | Rule: quality-vs-phase filter (this file's own guidance). | S3 |
| `.claude/rules/security.md` | Rule: security baseline, BaaS items generalized to "the active profile's rules"; points at `project/docs/nfr.md` as the per-product DP-3 instance of the baseline (EVP2 S4). | S3; D-007 (EVP2 S4) |
| `.claude/rules/testing.md` | Rule: testing baseline, concrete commands delegated to the active profile. | S3 |
| `.claude/skills/answer-decision/SKILL.md` | Skill: answers a `decision-needed` issue. Routes by the GR-10 marker (EVP2 S6): product mode → `project/docs/DECISIONS.md`; factory-source repo → root `DECISIONS.md`. | S3; D-009 §0.3.7 (EVP2 S6) |
| `.claude/skills/fix-ci/SKILL.md` | Skill: fixes a red CI PR. | S3 |
| `.claude/skills/harden-workflows/SKILL.md` | Skill: hardens `review.yml`/`security.yml`/etc. (SHA pinning and friends). | S3 |
| `.claude/skills/new-issue/SKILL.md` | Skill: drafts a well-specified issue. | S3 |
| `.claude/skills/triage-pr/SKILL.md` | Skill: triages and resolves PR review findings. | S3 |
| `.claude/skills/pause/SKILL.md` | Skill: pauses the factory (stops autonomous runs). | S3 |
| `.claude/skills/resume/SKILL.md` | Skill: resumes the factory. | S3 |
| `.claude/skills/design-foundation/SKILL.md` | Skill: runs the Foundation flow (D4). Reshaped (EVP2 S7) to read the real D1–D3 artifacts (`PRODUCT.md`, `SPEC.md`+`screens.yaml`, `ARCHITECTURE.md`, the category playbook) and to produce the candidate trio: `DESIGN.md` + `project/design/tokens.css` + `project/design/DESIGN-DIGEST.md`. R-ASSETS, the ≥3 named directions, the anti-default self-critique, and the stop-at-the-human-gate contract kept intact. | S3; D-009 (EVP2 S7) |
| `.claude/skills/init/SKILL.md` | Skill (D0, `/init`): creates the `project/` structure, `state/init.json` (the GR-10 marker), `state/definition-status.yaml`, `docs/DECISIONS.md`; never decides stack. Ends by running `gate-definition-done.mjs`. | D-009 (EVP2 S6) |
| `.claude/skills/define-product/SKILL.md` | Skill (D1, `/define-product`): instantiates `PRODUCT-template.md` into `project/docs/PRODUCT.md`, interviews section by section, stops at owner approval. | D-009 (EVP2 S6) |
| `.claude/skills/define-spec/SKILL.md` | Skill (D2, `/define-spec`): `SPEC.md` (`#### F-<n> —` features) + `screens.yaml` (full inventory, `areas_without_screens`) + `behaviors/*.feature` for logical flows, reading the `external-integration.md` playbook when the product announces an integration. | D-009 (EVP2 S6) |
| `.claude/skills/define-architecture/SKILL.md` | Skill (D3, `/define-architecture`): `ARCHITECTURE.md` (incl. the stack ADR — reads `factory/profiles/PROFILES.md`'s module registry, recommends, owner accepts/overrides), `DATA-MODEL.md`, `contracts/openapi.yaml`, `contracts/integrations.yaml`, `nfr.md`, `state/profile.json`. | D-009, D-010 (EVP2 S6) |
| `.claude/skills/design-mockups/SKILL.md` | Skill (D5, `/design-mockups`): self-contained static HTML mockups for 100% of `screens.yaml`'s inventory × `mockup_states`, generated/approved in batches by screen area; runs the coverage gate before finishing. | D-009 (EVP2 S7) |
| `.claude/skills/plan-milestones/SKILL.md` | Skill (D6, `/plan-milestones`): groups every screen/feature into coherent-flow milestones with explicit `{turns, usd}` budgets, covering every endpoint/integration; runs the coverage gate before approval. | D-009 (EVP2 S7) |
| `.claude/skills/fabric-init/SKILL.md` | Skill (`/fabric-init`, R-INIT): thin orchestrator + gate — runs `gate-definition-done.mjs`, shows the pending table, routes to the next pending stage's skill, records owner-approved waivers. Never produces a stage artifact itself. | D-009 §0.6 (EVP2 S7) |

## `.github/` — deterministic gates and the choreography

| Path | Purpose | Origin decision |
|---|---|---|
| `.github/README.md` | Directory contract. | S1 |
| `.github/ISSUE_TEMPLATE/factory-task.md` | Issue template: labels, mandatory Visual requirements section on `area:frontend`; mandatory "Behavior / integration requirements" section on `area:backend` (routes/handlers/states, contracts/events touched, mandatory scenario classes covered), mirroring the Visual pattern (EVP2 S4). | S4; D-007 §0.7 (EVP2 S4) |
| `.github/scripts/english-only.mjs` | Gate: fails on non-English content in the factory core (2-layer detection). | S1.1 |
| `.github/scripts/english-only-allowlist.json` | Allowlist of cited proper names exempt from the English gate. | S1.1 |
| `.github/scripts/boundary-check.mjs` | Gate: fails if the factory core references the origin product's paths/identity. | D-001 (S1) |
| `.github/scripts/gate-design-md.mjs` | Gate: UI PRs must ship an approved `project/design/DESIGN.md`. Status-header parser extracted to an exported function, reused by `gate-definition-done.mjs` for every D0–D6 `.md` artifact (byte-identical DESIGN.md wording, 22-case suite untouched); the not-approved case now returns parsed status instead of DESIGN.md-specific prose, so callers compose their own message (EVP2 S4/S8.1, F-1). | S4; D-009 (EVP2 S4/S8.1) |
| `.github/scripts/gate-contracts.mjs` | Gate: the DP-3 logical/integration axis sibling to `gate-design-md.mjs` — PR mode (`FILES`/`BASE_SHA`) and `--definition` full-coverage mode; contract existence/placeholders, `operationId` coverage, the 5 mandatory scenario classes per integration, orphan-tag detection, endpoint/integration → milestone coverage, `nfr.md` presence; right-sizing exit when there are no endpoints/integrations. Pure functions + thin CLI. | D-007 (EVP2 S4) |
| `.github/scripts/gate-definition-done.mjs` | Gate: the "Definition Done" / R-INIT checker — structure, per-stage status/waiver from `definition-status.yaml`, screens × mockups × `mockup_states` coverage, screens/features → exactly one milestone, delegates DP-3 coverage to `gate-contracts.mjs --definition`. Outputs a pending-items table naming the skill that resolves each item. | D-009 (EVP2 S4) |
| `.github/scripts/lint-antipatterns.mjs` | Gate: bans design antipatterns; Svelte selectors isolated in a marked profile-extension block. | S4 |
| `.github/scripts/lighthouse-a11y.mjs` | Gate: Lighthouse accessibility score >= 0.9 per route. | S4 |
| `.github/scripts/screenshots.mjs` | Captures multi-viewport screenshots for design-critic evidence. | S4 |
| `.github/scripts/await-screenshots.mjs` | Waits for the screenshot artifact before design-critic runs. | S4 |
| `.github/scripts/check-visual-evidence.mjs` | Gate: rejects design-critic runs with no screenshot evidence. | S4 |
| `.github/scripts/ui-routes.mjs` | Route discovery, parameterized per profile (SvelteKit = first case). | S4 |
| `.github/scripts/preview-url.mjs` | Resolves the deploy-preview URL behind a neutral adapter interface (Netlify = first adapter). | S4 |
| `.github/scripts/merge-critic-passes.mjs` | Merges multi-pass design-critic results. | S4 |
| `.github/scripts/critic-verdict.mjs` | Computes the design-critic pass/fail verdict from the rubric. | S4 |
| `.github/workflows/ci.yml` | Product jobs gated on "does `app/` have code"; `no-portuguese`->`english-only`, `boundary-check`, `factory-tests` jobs; new `contract-gates` job (always runs `gate-design-md.mjs`+`gate-contracts.mjs` in PR mode; not a required check until EVP3, when product code exists to gate on) (EVP2 S4). | S1, S1.1, S4; D-007 (EVP2 S4) |
| `.github/workflows/implement.yml` | developer-lead run envelope; inline **F1** line; `FACTORY_AUTH` toggle. | F1 (S4) |
| `.github/workflows/review.yml` | Reviewer role's executable prompt (DP-5 source); **F2** infra retry; GR-7 divergence check now compares normalized, path-only sets instead of raw porcelain lines, fixing a false-positive when later git bootstrapping restages an already-expected path (EVP2 S8.2). | D-002 (S4); GR-7 fix (EVP2 S8.2) |
| `.github/workflows/security.yml` | Security scan workflow; **F2** infra retry; inline rubric gains 2 lines (real idempotency where `project/docs/nfr.md` requires it; external error paths without stack/PII leaks) (EVP2 S4); same GR-7 path-compare fix as `review.yml` (EVP2 S8.2). | S4; D-007 §0.7 (EVP2 S4); GR-7 fix (EVP2 S8.2) |
| `.github/workflows/verdict.yml` | Verdict role's executable prompt (DP-5 source); fail-closed; **F2** infra retry. | D-002 (S4) |
| `.github/workflows/fix.yml` | Fixer: reacts to red CI only (known limitation, not addressed in EVP1). | S4 |
| `.github/workflows/refine.yml` | Refiner role's executable prompt (DP-5 source); opt-in `refine:requested`, OWNER-gated, max 2 rounds. | D-002 (S4) |
| `.github/workflows/claude.yml` | OWNER-gated entrypoint for ad hoc Claude runs. | S4 |
| `.github/workflows/daily-report.yml` | Daily status report; re-entry `jq` filter preserved byte-for-byte (has a dedicated test). | S4 |
| `.github/workflows/supervisor.yml` | Supervisor role's executable prompt (DP-5 source); ported **disabled** (schedule off, re-enable documented). | D-002 (S4) |
| `.github/workflows/design-critic.yml` | Design-critic role's executable prompt (DP-5 source); mandatory screenshot evidence; **F2** infra retry; same GR-7 path-compare fix as `review.yml` (its extra expected divergence for downloaded PNGs is untouched) (EVP2 S8.2). | D-002 (S4); GR-7 fix (EVP2 S8.2) |
| `.github/workflows/screenshots.yml` | Captures screenshots at 375/768/1280 viewports. | S4 |

Discarded, not ported: `claude-code-review.yml.disabled` — unmodified `claude-code-action`
boilerplate, superseded by the hardened `review.yml`/`security.yml`. See D-003.

## `factory/docs/` — core documentation

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/README.md` | Directory contract for `factory/`. | S1 |
| `factory/docs/FACTORY.md` | Canonical choreography doc: roles, Generation/Maintenance regimes, guard-rails, D/FU glossary, Operating lessons; guard-rail table gains the **GR-10 — product-session core immutability** row (EVP2 S1). | S2; D-008 (EVP2 S1) |
| `factory/docs/AUTONOMY.md` | Generic Decision Gate framework (money-touching changes as the generic example). | S2 |
| `factory/docs/CRAFT-PRINCIPLES.md` | Craft principles for design/build quality. | S2 |
| `factory/docs/DESIGN-CRITIC-RUBRIC.md` | 7-dimension x severity rubric for the design-critic role. | S2 |
| `factory/docs/SKILL-ROUTER.md` | Authority order across skills. | S2 |
| `factory/docs/playbooks/README.md` | Playbook index; table gains `external-integration.md` (cross-cutting, DP-3) (EVP2 S3). | S2; D-007 (EVP2 S3) |
| `factory/docs/playbooks/data-heavy.md` | Playbook: data-heavy product shape. | S2 |
| `factory/docs/playbooks/editorial.md` | Playbook: editorial product shape. | S2 |
| `factory/docs/playbooks/institutional-marketing.md` | Playbook: institutional-marketing product shape. | S2 |
| `factory/docs/playbooks/mobile.md` | Playbook: mobile product shape. | S2 |
| `factory/docs/playbooks/saas-dashboard.md` | Playbook: SaaS-dashboard product shape. | S2 |
| `factory/docs/playbooks/external-integration.md` | Playbook (new, EVP2 S3): cross-cutting DP-3 modifier (like `mobile.md`, never a primary category) — definition emphases (webhooks, idempotency, authz, error states, money/sensitive-data caution), the 5 mandatory scenario classes and why each exists, right-sizing (no integration → empty `integrations.yaml`), filled example: Ledgerline Pro's "update subscription" flow. | D-007 (EVP2 S3) |
| `factory/docs/INVENTORY.md` | This file — the repo's own baseline photo. Refreshed at the end of EVP2 (S9). | S6; S9 |
| `factory/docs/REPO-STRUCTURE.md` | The repo tree map: one section per top-level directory's contract, `.claude/` conventions, where each regime's pieces live. Kept in sync across EVP2 (GR-10, the 4 new skills, the profiles row, the `.claude/hooks/` mention, the `GR-1..GR-10` count). | S7; kept in sync (EVP2 S1, S5, S6) |

## `factory/templates/` — artifact templates, instantiated into `project/`

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/templates/DESIGN-template.md` | `DESIGN.md` template; cites the origin repo's "Ballpoint Ink" example (cited, never copied). Placeholder marker corrected repo-wide from `[TO FILL]` to the actually-checked `[TO FILL IN]` (~90 occurrences) (EVP2 S4). | S2; fix (EVP2 S4) |
| `factory/templates/BRAND-ASSETS-template.md` | Brand-assets doc template. `design/assets/` corrected to live under `project/` (EVP2 S6). | S2; fix (EVP2 S6) |
| `factory/templates/VARIETY-REGISTRY-template.md` | Variety-registry template (lives in `project/state/` once instantiated). | S2 |
| `factory/templates/ROADMAP-template.md` | Roadmap template, structure extracted from the origin repo's `ROADMAP.md`, product content stripped. | S2 |
| `factory/templates/PRODUCT-template.md` | D1 template: vision, audience, jobs, v1 scope/out-of-scope, personality/brand positioning (the fields D4 consumes). How-to-instantiate header + `Status` row. | D-009 (EVP2 S2) |
| `factory/templates/SPEC-template.md` | D2 template: features as `#### F-<n> —` headings, user flows, bridges to `screens.yaml` and `behaviors/*.feature`. | D-009 (EVP2 S2) |
| `factory/templates/ARCHITECTURE-template.md` | D3 template: ADRs incl. the fixed "Stack decision — factory recommendation × owner preference" section. | D-009 (EVP2 S2) |
| `factory/templates/DATA-MODEL-template.md` | D3 template: data model. | D-009 (EVP2 S2) |
| `factory/templates/nfr-template.md` | D3 template: authz matrix (route × role), validation rules, where idempotency is required, rate limits. | D-009 (EVP2 S2) |
| `factory/templates/MILESTONES-template.md` | D6 template: human narrative; points to `milestones.yaml` as the machine source of truth. | D-009 (EVP2 S2) |
| `factory/templates/DESIGN-DIGEST-template.md` | D4 template: the operational summary Generation reads instead of the long docs; produced as the third member of the **candidate** trio, before approval (EVP2 S8.1, F-7 header fix); gained a `muted` token row (EVP2 S8.1, F-4). | D-009 (EVP2 S2) |
| `factory/templates/screens-template.yaml` | D2 machine-readable template: per-screen `id`/`name`/`area`/`route`/`states`/`mockup_states` + `areas_without_screens`, every field commented. `states` guidance notes distinct `load-error`/`save-error` states for structurally different failure causes (EVP2 S8.1, F-9). | D-009 (EVP2 S3) |
| `factory/templates/behaviors-template.feature` | D2 machine-readable template: tag conventions (`@scenario:<slug>`, `@endpoint:<operationId>`, `@integration:<I-id>`, the 5 mandatory class tags), each demonstrated. Header corrected: behaviors are written in D2, not D3 (EVP2 S8.1, F-3). | D-007, D-009 (EVP2 S3) |
| `factory/templates/openapi-template.yaml` | D3 machine-readable template: OpenAPI 3.1 minimal, `operationId` mandatory, per-route auth. | D-007, D-009 (EVP2 S3) |
| `factory/templates/integrations-template.yaml` | D3 machine-readable template: per integration — id, abstract provider kind, events, objects, webhook endpoints, idempotency key, logical secret names, sandbox availability, mock-trust note. | D-007, D-009 (EVP2 S3) |
| `factory/templates/milestones-template.yaml` | D6 machine-readable template: `id`/`name`/`screens[]`/`features[]`/`endpoints[]`/`integrations[]`/`budget{turns,usd}`/`acceptance[]`. | D-009 (EVP2 S3) |
| `factory/templates/definition-status-template.yaml` | D0 machine-readable template: stages D0–D6, `status` enum, `approved_by`/`date`, `waivers[]`, `decided[]`/`assumed[]`. | D-009 (EVP2 S3) |
| `factory/templates/init-template.json` | D0 machine-readable template: `{ name, language, owner, created }` — `/init`'s own config and the GR-10 marker shape. | D-008, D-009 (EVP2 S3) |
| `factory/templates/PROJECT-DECISIONS-template.md` | D0 template: the product's own decision log (own numbering, product language). | D-009 (EVP2 S3) |
| `factory/templates/mockup-template.html` | D5 template: self-contained HTML skeleton — inline token block + `screen-id`/`state` meta comment. The filename is the contract the gate checks. | D-009 (EVP2 S3) |
| `factory/templates/examples/ledgerline/` | The "Ledgerline" filled example set (R-SAMPLES) for a small fictional invoicing micro-SaaS, cross-linked by stable ids across every D1–D6 artifact kind: `PRODUCT.md`, `SPEC.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `nfr.md`, `MILESTONES.md` (EVP2 S2, all `Status: approved`, no `[TO FILL IN]`); `screens.yaml`, `billing-update-plan.feature` (all 5 mandatory classes), `openapi.yaml` (11 endpoints), `integrations.yaml` (`I-payments`), `milestones.yaml`, `definition-status.yaml`, `S-invoices.html` + `S-invoices--empty.html` (EVP2 S3). 14 files; every cross-reference resolves. | D-009 (EVP2 S2, S3) |

## `factory/profiles/` — the profile-module contract (formalized in EVP2 S5, D-010)

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/profiles/PROFILES.md` | The module contract (replaces `README.md`, whose history folds into §7 "Origin"): directory shape `<dimension>/<module>/`, the full `module.yaml` schema, how D3 chooses/records the active composition (ADR in `ARCHITECTURE.md` + `project/state/profile.json`), the fixed Node-family `behaviors` mapping (vitest + feature-mirror, `@scenario` tags, no cucumber, hermetic mock-first). Wiring the resolver to core scripts is EVP3. | D-010 (EVP2 S5) |
| `factory/profiles/.gitkeep` | Keeps the empty top-level dir tracked. | S1 |
| `factory/profiles/frontend/sveltekit/README.md` | SvelteKit module readme, formalized with the module contract. | S5; D-010 (EVP2 S5) |
| `factory/profiles/frontend/sveltekit/module.yaml` | SvelteKit module manifest — **complete**, absorbs the ported `stylelint.config.js`. | D-010 (EVP2 S5) |
| `factory/profiles/frontend/sveltekit/stylelint.config.js` | Ported Stylelint config; generic rules commented apart from this-product-specific token names. | D-004 (S5) |
| `factory/profiles/deploy/netlify/` (`module.yaml` + `README.md`) | Deploy module — **complete**, formalizes the existing `preview-url.mjs` adapter as `gate_adaptations`. | D-010 (EVP2 S5) |
| `factory/profiles/backend/baas-supabase/` (`module.yaml` + `README.md`) | Backend module — **complete**, incl. a filled `behaviors` block (the reference Node-family instance of the vitest + feature-mirror mapping). | D-010 (EVP2 S5) |
| `factory/profiles/frontend/nextjs/` (`module.yaml` + `README.md`) | Frontend module — **skeleton**: every mandatory field present, open ones `[TO FILL IN — see README]`. | D-010 (EVP2 S5) |
| `factory/profiles/backend/baas-firebase/` (`module.yaml` + `README.md`) | Backend module — **skeleton**. | D-010 (EVP2 S5) |
| `factory/profiles/backend/node-service/` (`module.yaml` + `README.md`) | Backend module — **skeleton**; pairs with the independent `data-auth/postgres` case. | D-010 (EVP2 S5) |
| `factory/profiles/data-auth/baas/` (`module.yaml` + `README.md`) | Data-auth module — **skeleton**; a derived record (a BaaS backend bundles its own store/auth, nothing independent to decide). | D-010 (EVP2 S5) |
| `factory/profiles/data-auth/postgres/` (`module.yaml` + `README.md`) | Data-auth module — **skeleton**; the genuine independent data-auth case. | D-010 (EVP2 S5) |
| `factory/profiles/deploy/vercel/` (`module.yaml` + `README.md`) | Deploy module — **skeleton**. | D-010 (EVP2 S5) |
| `factory/profiles/deploy/cloud-run/` (`module.yaml` + `README.md`) | Deploy module — **skeleton**. | D-010 (EVP2 S5) |

## `factory/checklists/`

| Path | Purpose | Origin decision |
|---|---|---|
| `factory/checklists/.gitkeep` | Placeholder — real content is an EVP2 deliverable. | S1 |
| `factory/checklists/README.md` | Directory contract: ships empty in the core, never written per-product. Real content landed EVP2 S4 (`definition-done.md`). | S7 |
| `factory/checklists/definition-done.md` | The human mirror of `gate-definition-done.mjs` (R-INIT), item by item — the script stays the authoritative, re-runnable source. | D-009 (EVP2 S4) |

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
| `factory/bench/tests/design/style.test.ts` | Lints fixtures against `stylelint.config.js`; last sub-test reads `app/web` live and **self-skips**. Config path updated to `factory/profiles/frontend/sveltekit/stylelint.config.js` after the D-010 module move (EVP2 S5). | D-004 (S5) |
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
| `factory/bench/tests/hooks/guard-core-writes.test.ts` | Exercises `guard-core-writes.mjs` (GR-10): both modes × both matchers, the marker-deletion anti-bypass heuristic, the ALLOWLIST path, a planted violation. Grew from 17 to 24 cases in EVP2 S8.1 (F-2): 3 real false-positive regressions (`cp` core-to-project, `2>&1` fd redirect, `rm` non-core chained with a core read) now pass; 4 true positives (redirect, `cp` dest, `sed -i`, `rm`) still block. | D-008 (EVP2 S1); F-2 fix (EVP2 S8.1) |
| `factory/bench/tests/definition/` | `gate-contracts.test.ts` + `gate-definition-done.test.ts`: 1 clean synthetic `project/` fixture + 5 planted-violation fixtures (missing mockup state, removed mandatory scenario class, endpoint without milestone, regressed `Status`, waiver without approval), plus a case that materializes `factory/templates/examples/ledgerline/` into the canonical layout and asserts its exact pending-item list. | D-007, D-009 (EVP2 S4) |
| `factory/bench/tests/workflows/design-md.test.ts` | 22 cases against `gate-design-md.mjs`, paths updated. | S5 |
| `factory/bench/tests/workflows/reentry.test.ts` | Executes the real `daily-report.yml` re-entry `jq` filter. | S5 |
| `factory/bench/tests/workflows/screenshots.test.ts` | Exercises the screenshot capture/wait logic. | S5 |
| `factory/bench/tests/workflows/visual-evidence.test.ts` | Exercises `check-visual-evidence.mjs`. | S5 |

## Known gaps vs. the port map (see the S6 session report for detail)

Both gaps below were closed in session S7 (the audit-fixes session) — see `DECISIONS.md`
D-005/D-006 and the rows above. `factory/bench/tests/design/a11y-baseline.json` still has
no consumer in this repo's harness (`lighthouse-a11y.mjs` still gates on a fixed `FLOOR`);
wiring a ratchet-based a11y gate against it is a future EVP2 concern, not this session's.
