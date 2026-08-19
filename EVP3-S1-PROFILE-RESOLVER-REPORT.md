# EVP3 S1 — profile resolver + extension-point wiring: session report

**Session:** S1, branch `evp3/s1-profile-resolver`, based on `main` (tag `factory-core-v1`).
**Scope:** build `.github/scripts/profile-resolve.mjs` (DECISIONS.md D-012) and wire it into
the four extension points `PROFILES.md` §6 named as deferred: `ui-routes.mjs`'s `ROUTES`,
`lint-antipatterns.mjs`'s framework-selector block, `preview-url.mjs`'s adapter choice, and
`ci.yml`'s `product-*` jobs.

---

## 1. Gates and tests

| Check | Result |
| --- | --- |
| `npm test` | **240 passed, 40 skipped**, 0 failed — 15 test files passed / 2 skipped (of 17) |
| `node .github/scripts/english-only.mjs` | **exit 0**, 261 files scanned |
| `node .github/scripts/boundary-check.mjs` | **exit 0**, 259 files scanned |
| `actionlint` (all `.github/workflows/*.yml`) | **exit 0**, no findings |

**Vs. the S9/`factory-core-v1` baseline (216 passed / 40 skipped):** +24 passed. The new
suite is `factory/bench/tests/profiles/` (3 files: `profile-resolve.test.ts`,
`ui-routes-screens.test.ts`, `lint-antipatterns-extension-point.test.ts`) — every pre-existing
suite, including `factory/bench/tests/design/antipatterns.test.ts` and
`factory/bench/tests/workflows/screenshots.test.ts`, passes **untouched**, proving the
no-profile default path (today's real repo state) is bit-for-bit unchanged.

---

## 2. What was built (D-012, `DECISIONS.md`)

- `.github/scripts/profile-resolve.mjs` — `readProfile`/`moduleManifest`/`resolvedCommand`/
  `gateAdaptation`, modeled on `gate-contracts.mjs`. Fail-closed on a missing module, a
  `status: skeleton` module in a composed dimension, or a mandatory field absent.
- `ui-routes.mjs`'s `ROUTES` now derives from `project/docs/screens.yaml` (new
  `screenshot_route` field extends D-009 for parameterized routes).
- `lint-antipatterns.mjs`'s "profile extension point" block resolves via
  `gateAdaptation('lint_antipatterns_selectors')`; `frontend/sveltekit/module.yaml`'s
  corresponding field changed from prose to a structured value.
- `preview-url.mjs` picks its adapter by the active `deploy` module's name.
- `ci.yml`'s `product-ci` placeholder replaced by `product-lint`/`product-test`/
  `product-build`, commands sourced from the resolver CLI.
- `factory/templates/screens-template.yaml` and `factory/profiles/PROFILES.md` §6 updated to
  document the above.

Full contract, fail-closed cases, and rationale are in `DECISIONS.md` D-012 — not repeated
here.

---

## 3. A constraint discovered mid-session, and how it changed the implementation

The plan's design assumed `ui-routes.mjs` could parse `screens.yaml` with the `yaml` npm
package (already a devDependency, and the pattern `gate-contracts.mjs` already uses). Running
the full suite surfaced two pre-existing tests in
`factory/bench/tests/workflows/visual-evidence.test.ts` that assert `check-visual-evidence.mjs`
— which imports `ui-routes.mjs` — **must run with zero `node_modules` present**, because
`design-critic.yml`'s job that runs it never calls `npm ci`. Importing `yaml` inside
`ui-routes.mjs` broke that contract immediately (`ERR_MODULE_NOT_FOUND` in the isolated-scripts
test, and the static import-graph test).

Fixed by writing `parseScreens`, a bespoke, line-oriented scan of `screens.yaml`'s fixed shape
(mirrors `gate-contracts.mjs`'s own `parseScenarios` precedent for Gherkin) instead of using
the `yaml` package — `ui-routes.mjs` stays dependency-free. `lint-antipatterns.mjs` and
`preview-url.mjs` both import `profile-resolve.mjs` (which does use `yaml`) freely, since both
only ever run from jobs that call `npm ci` first (`ci.yml`'s `product-lint`, and
`screenshots.yml`'s screenshot-capture job) — verified by reading both workflows, not assumed.

---

## 4. Out-of-scope / forward-looking items (not fixed here, per the plan's own scoping)

- **`data-auth/baas` is permanently `status: skeleton`** (PROFILES.md §5.1 — a derived record
  with nothing to scaffold), yet it's also the value `PROFILES.md` §3's own worked example
  names for the pilot's `data-auth` dimension. This resolver's fail-closed rule means resolving
  that exact reference composition today would throw. Maturing `data-auth/baas` to `complete`
  is explicitly out of EVP3's scope (EVP4: "maturing skeleton modules"). This session's test
  fixtures are fully synthetic for exactly this reason — they don't depend on the real
  registry's current statuses. Left open for whoever builds `/define-architecture`.
- **Deploy-config generation** (`netlify.toml`, a Vercel setting, a Dockerfile line) from a
  module's `deploy` block stays a Generation-session scaffold step, not automated by this
  resolver — matches the plan's §0.3.6.
- **`screenshots.yml`/`design-critic.yml`'s trigger paths** stay hardcoded to the SvelteKit
  pilot; static YAML can't parameterize them per profile. `PROFILES.md` §6 now states the new
  obligation (a maturing frontend module updates both in the same PR) as documentation, not a
  code-enforced gate.
- **`resolvedCommand`/`gateAdaptation` collect across every dimension**, not one "owning"
  dimension per command/adaptation name (see D-012's design rationale). One consequence worth
  flagging explicitly: `backend/baas-supabase`'s own `commands.lint` (`npx eslint app/api`)
  now also runs under `ci.yml`'s `product-lint` job automatically, alongside the frontend
  stylelint command the plan's §0.3.5 text named explicitly. This is a strict superset of what
  was spelled out, not a deviation — flagged here for visibility, not because it needs fixing.
- **`commands.e2e`** resolves through `profile-resolve.mjs` like every other command name, but
  no workflow calls `--command e2e` yet — no regression, just an unused capability today.

---

## 5. Validation

- `npm test` → 240 passed / 40 skipped, 0 failed.
- `node .github/scripts/english-only.mjs` → exit 0, 261 files.
- `node .github/scripts/boundary-check.mjs` → exit 0, 259 files.
- `actionlint .github/workflows/*.yml` → exit 0.
- Manual CLI sanity: `profile-resolve.mjs --command lint`/`--adaptation
  lint_antipatterns_selectors` run against a scratch copy of the real
  `frontend/sveltekit/module.yaml`, confirming the resolved values match the script's own
  hardcoded defaults exactly (pilot behavior unchanged bit-for-bit).
- Each violated fixture (`violated-module-missing`, `violated-skeleton-composed`,
  `violated-missing-mandatory-field`, `screens-violated-missing-screenshot-route`) asserted
  failing with the specific fail-closed message; each clean fixture asserted passing.
