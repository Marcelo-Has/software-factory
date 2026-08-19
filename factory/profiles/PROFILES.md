# PROFILES.md — the profile-module contract

> **Status: contract fixed (DECISIONS.md D-010), resolver wired (DECISIONS.md D-012).** This
> document replaces `factory/profiles/README.md`'s raw-material framing — see §7 for that
> history. §2-§5 fix the module **contract**: shape, schema, and how a product's active
> composition gets chosen and recorded. `.github/scripts/profile-resolve.mjs` reads
> `project/state/profile.json` and each active module's `module.yaml` — see §6 for exactly
> what's wired through it today and what still isn't.

---

## 1. Directory shape

```
factory/profiles/<dimension>/<module>/
  module.yaml        # the manifest — see §2
  README.md           # human-readable: what the module is, what it isn't, how it composes
  <module files>       # whatever the module needs: a lint config, a scaffold script, ...
```

**Dimensions** (exactly four, fixed): `frontend/`, `backend/`, `data-auth/`, `deploy/`. A
product's active stack is **one module per dimension** — never more, never fewer, once D3
concludes (§3). A dimension with no module chosen isn't a valid D3 outcome; `data-auth/baas`
exists precisely so a BaaS-backed product still resolves all four dimensions (§5.1).

A module directory with no `module.yaml` is not a module — it's raw material that hasn't been
formalized yet. Every module under `factory/profiles/` as of D-010 has one.

---

## 2. The `module.yaml` schema

One schema, used identically by every module regardless of dimension or `status`. A field
that doesn't apply to a given module is declared `null` with the reason in the module's own
`README.md` — a declared "not applicable" is not the same failure as a forgotten field (the
same convention `screens.yaml`'s `areas_without_screens` and `integrations.yaml`'s empty
`integrations: []` already use elsewhere in this factory).

```yaml
# ---- identity -----------------------------------------------------------------------------
name: <string>                     # matches the module's directory name
dimension: frontend | backend | data-auth | deploy
status: complete | skeleton        # complete = ready for a product to compose today;
                                    # skeleton = manifest with every mandatory field present,
                                    # README names what's missing — never a placeholder value
                                    # inside module.yaml itself (same semantics as a playbook
                                    # skeleton, factory/docs/playbooks/README.md)

# ---- what it instantiates ------------------------------------------------------------------
app_layout:                        # subpaths under app/ this module creates; [] if this
  - <path>/                        # module's dimension never writes to app/ directly
                                    # (e.g. every deploy/* module: the deploy platform
                                    # consumes another module's app/ output, it doesn't own one)

scaffold:                          # ordered steps that instantiate this module into a fresh
  - <step>                         # app/ tree. A skeleton may leave this as a single
                                    # "[TO FILL IN — see README]" entry.

# ---- what a product's CI/dev scripts would invoke, once EVP3 wires the resolver -----------
commands:
  lint: <string | null>
  test: <string | null>
  build: <string | null>
  e2e: <string | null>

# ---- visual verification loop --------------------------------------------------------------
screenshot:
  method: <string | null>          # how factory's screenshot tooling captures this module's
                                    # UI (e.g. "playwright, one shot per project/docs/screens.yaml
                                    # route x viewport" — ui-routes.mjs's own contract)
  preview_adapter: <string | null> # the deploy/* module name whose preview-url.mjs adapter
                                    # supplies this module's deploy-preview URL. Only a
                                    # frontend module fills this; a deploy module names itself.

# ---- deploy config this module needs or provides -------------------------------------------
deploy:
  <platform-specific keys, or null with a reason>

# ---- where this module plugs into the core's generic, product-agnostic gates --------------
gate_adaptations:
  <gate-script-or-mechanism>: <what this module supplies>

# ---- DP-3 (D-007) — behavior-scenario execution, D-3.3 --------------------------------------
behaviors:
  applicable: <bool>               # false for a module whose dimension never owns an API/
                                    # webhook handler (every frontend/* and deploy/* module —
                                    # see §4). true for backend/* and, where relevant, data-auth/*.
  runner: <string | null>          # the Node family's runner is FIXED — see §4; never re-decide
                                    # it per module. A non-Node backend module states its own.
  mapping: <string | null>         # feature-file -> test-file convention — see §4
  mock: <string | null>            # this module's hermetic mock-first strategy — see §4
```

---

## 3. How the active composition is chosen (D3)

- **Never at D0.** A product's stack is a D3 decision (`/define-architecture`), made after
  `PRODUCT.md` and `SPEC.md` exist — the factory doesn't recommend a stack before it knows
  what the product needs to do.
- **The factory recommends, the owner decides.** `/define-architecture` reads this registry
  and proposes one module per dimension, with a stated reason (interface category, scale,
  team familiarity, an existing integration's shape). The owner accepts each recommendation or
  overrides it — an override with no owner reasoning recorded is a missing decision, not a
  smaller one. `factory/templates/ARCHITECTURE-template.md` §2 is the exact table shape this
  produces; `factory/templates/examples/ledgerline/ARCHITECTURE.md` §2 is a filled instance.
- **Recorded twice, by design.** The human record is the ADR in `ARCHITECTURE.md` §2 (context,
  the recommendation-vs-override table, consequences). The machine record is
  `project/state/profile.json` — one module name per dimension, nothing else. The gates and
  skills that will read `profile.json` (EVP3) never re-derive a decision already made in §2;
  they only need the machine copy of its outcome.
- **`profile.json`'s shape** (documented here since no script reads it yet):
  ```json
  {
    "frontend": "sveltekit",
    "backend": "baas-supabase",
    "data-auth": "baas",
    "deploy": "netlify"
  }
  ```
  Each value is a module `name`, resolvable to `factory/profiles/<dimension>/<name>/`.

**Building `/define-architecture` itself — the skill that actually reads this registry and
writes `profile.json` — is S6 work (plan §2.6), not this session.** This session fixes the
contract that skill will read.

---

## 4. `behaviors` — the DP-3 contract, fixed for the Node family (D-3.3)

Every module built on the Node family (`backend/baas-supabase`, `backend/baas-firebase`,
`backend/node-service`, and any `data-auth/*` module whose policies get exercised through a
Node backend) shares **one fixed** `behaviors` mapping — this is a closed decision from the
EVP2 planning session, never re-decided per module or per product:

- **Runner: `vitest`.** No `cucumber` dependency — Gherkin is intent and oracle, the mirrored
  test is the execution. `project/docs/behaviors/<feature>.feature` is what's read for
  meaning; `app/api/tests/behaviors/<feature>.test.ts` (or the equivalent path a module's own
  `app_layout` declares) is what actually runs.
- **Mapping: feature-mirror.** One `.feature` file maps to exactly one mirroring `.test.ts`
  file, same base name. Every scenario in the `.feature` file appears in the test file as a
  grep-verifiable comment carrying its `@scenario:<slug>` tag, so the correspondence between
  intent and execution is mechanically checkable, not just a naming convention taken on faith.
- **Mock: hermetic, mock-first.** No live network call and no real secret in the test run.
  Typical shape: HTTP interception inside the test process for outbound calls; a webhook
  scenario is exercised by POSTing a synthetic payload straight at the handler, not by
  triggering a real provider; the `@duplicate` class is proven by re-sending the same synthetic
  event id and asserting no second effect. A **real sandbox smoke test against a live
  provider is opt-in per profile, never the default** — this is the same closed decision
  DECISIONS.md D-007 already fixed for the DP-3 axis generally; a module's `behaviors.mock`
  field states its own hermetic strategy, it never reopens the mock-first-vs-real-sandbox
  question.
- **Executing this contract in CI (the harness that actually runs the mirrored tests) is
  EVP3.** This session fixes the declaration and the format only — `gate-contracts.mjs`'s
  `--definition` mode (already built, S4) checks that `.feature` files and their scenario tags
  exist and are well-formed; it does not yet run any mirrored `.test.ts` file.

A module outside the Node family (there are none yet in this registry) would state its own
runner/mapping/mock instead of inheriting this section — nothing here assumes every backend is
Node, only that every Node-family module shares one answer instead of five slightly different
ones.

---

## 5. Module registry

| Dimension | Module | Status | One-liner |
| --- | --- | --- | --- |
| `frontend` | `sveltekit` | **complete** | The pilot frontend module — SvelteKit, absorbs the tokens-compliance `stylelint.config.js`. |
| `frontend` | `nextjs` | skeleton | Manifest only — see the module's `README.md` for what's missing. |
| `backend` | `baas-supabase` | **complete** | The pilot backend module — Supabase-managed Postgres + auth + edge functions; `behaviors` filled per §4. |
| `backend` | `baas-firebase` | skeleton | Manifest only. |
| `backend` | `node-service` | skeleton | Manifest only — a self-hosted Node API server, paired with `data-auth/postgres`. |
| `data-auth` | `baas` | skeleton | The data-auth dimension when it's bundled into a `backend/baas-*` module's own provider — see §5.1. |
| `data-auth` | `postgres` | skeleton | A standalone, self-hosted Postgres + auth library, paired with `backend/node-service`. |
| `deploy` | `netlify` | **complete** | The pilot deploy module — points at the core's existing `preview-url.mjs` Netlify adapter. |
| `deploy` | `vercel` | skeleton | Manifest only. |
| `deploy` | `cloud-run` | skeleton | Manifest only. |

Three modules are `complete` — the pilot composition (`Ledgerline`'s stack in
`factory/templates/examples/ledgerline/ARCHITECTURE.md` §2). Everything else is a `skeleton`:
every mandatory `module.yaml` field is present with either a real value or an explicit,
reasoned `null`/"[TO FILL IN — see README]"; the module's `README.md` names exactly what a
future session needs to fill in to mature it to `complete`. A skeleton module is not authority
for a product to compose today — the same "skeleton is not authority" rule
`factory/docs/playbooks/README.md` already states for playbooks applies here identically.

### 5.1 Why `data-auth/baas` exists as its own module

A BaaS backend (`backend/baas-supabase`, `backend/baas-firebase`) bundles its own data store
and auth provider — there's no independent data-auth decision to make once that backend module
is chosen, only a decision to record. `data-auth/baas` is that record: it resolves the
dimension to something concrete in `profile.json` (§3) without inventing a second, redundant
choice. Its `module.yaml` declares which `backend/baas-*` module it derives from, rather than
scaffolding anything of its own. `data-auth/postgres`, by contrast, is a genuine independent
choice, made when `backend` is `node-service` — there the data store and auth mechanism are
not supplied by the backend module at all.

---

## 6. What's wired now, and what still isn't (DECISIONS.md D-012)

**Wired.** `.github/scripts/profile-resolve.mjs` is the resolver: `readProfile`/
`moduleManifest`/`resolvedCommand`/`gateAdaptation`, fail-closed on a missing module, a
`status: skeleton` module in a dimension `profile.json` actually composes, or a mandatory
field absent (§1/§2/§5). Four consumers read through it:

- `.github/scripts/lint-antipatterns.mjs`'s "profile extension point" block resolves via
  `gateAdaptation(cwd, 'lint_antipatterns_selectors')` when a profile exists, falling back to
  the built-in SvelteKit values otherwise.
- `.github/scripts/ui-routes.mjs`'s `ROUTES` derives from `project/docs/screens.yaml` (every
  screen with a `route`, in file order; a parameterized route needs `screenshot_route` — a new
  field, extends D-009 §3); no `screens.yaml` still falls back to the `['/']` placeholder.
- `.github/scripts/preview-url.mjs` picks its adapter by the active `deploy` module's own name;
  only `netlify` is implemented, any other resolved module exits 1 naming the gap.
- `.github/workflows/ci.yml`'s `product-lint`/`product-test`/`product-build` jobs run
  `commands.lint`/`test`/`build`, collected via `resolvedCommand`, gated on
  `detect-app-code`'s `has-code` output exactly like the placeholder they replace.

**Still not wired:**

- Generating a product's actual deploy config (`netlify.toml`, a Vercel project setting, a
  Dockerfile `COPY` line) from a module's `deploy` block — a Generation session's scaffold step
  writes it by hand today (`generate.yml`, EVP3 later sessions), not this resolver.
- `.github/workflows/screenshots.yml`'s and `.github/workflows/design-critic.yml`'s trigger
  paths — both are still hardcoded to the SvelteKit pilot's paths. Static YAML can't
  parameterize a trigger path per profile, so this can't become a resolver job. **New module
  obligation:** a frontend module maturing past `skeleton` updates both workflows' trigger
  paths in the same PR that matures it — documented here, not code-enforced.
- Executing the `behaviors` contract (§4) — the harness that actually runs the mirrored
  `.test.ts` files in CI — is a separate EVP3 session (the functional gate,
  `gate-behavior-mirror.mjs` and the `product-behaviors` job), not this resolver.
- `commands.e2e` is resolved by `profile-resolve.mjs` like every other command, but no CI job
  runs it yet — no workflow calls `--command e2e` today.

`factory/bench/tests/design/style.test.ts` still exercises `frontend/sveltekit/stylelint.config.js`
directly (real `stylelint` against the harness's planted-violation fixtures) rather than
through the resolver — that test proves the gate mechanism itself bites, independent of which
product resolves to this module.

---

## 7. Origin

Before D-010, this directory held **raw material**, not modules: the origin product's
`stylelint.config.js`, ported and translated to English (DECISIONS.md D-004), with no
directory contract, no manifest, and nothing describing how a profile would be selected,
activated, or wired into CI. `factory/profiles/README.md` documented that raw-material state
through EVP1 and the first sessions of EVP2; this file replaces it, and that file is removed
in the same commit that adds this one.

The extension points the raw-material README pointed at are unchanged by D-010 and still the
right place to look for how a *product-agnostic* gate stays generic across profiles:

- `.github/scripts/lint-antipatterns.mjs`'s `// ---- profile extension point ----` block
  (framework-specific selectors: where UI source lives, which extensions count, which build
  directories to ignore).
- `.github/scripts/ui-routes.mjs` (the product's real route list — a product-specific input,
  not a profile one, but the same "core stays generic, the product supplies the specifics"
  shape).
- `.github/scripts/preview-url.mjs` (the deploy-preview adapter shape; Netlify is the first,
  and until `deploy/vercel`/`deploy/cloud-run` mature past skeleton, only, implementation).
