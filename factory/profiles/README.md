# factory/profiles/ — stack-specific raw material

**Status: raw material — formalized as profile modules in EVP2.** EVP1 does not design the
profile-module contract (how a profile is selected, activated, or wired into CI); it only
ports the stack-specific artifacts the origin product actually used, translated to English and
marked where their rules are generic mechanism versus this one product's specific choices.

A profile, once formalized, will be what supplies the pieces `factory/` deliberately leaves as
extension points for the active stack — see the "profile extension point" comments in
`.github/scripts/lint-antipatterns.mjs` (framework-specific selectors) and
`.github/scripts/ui-routes.mjs` (the product's real route list), and the adapter shape in
`.github/scripts/preview-url.mjs` (Netlify as the first deploy-preview adapter).

## What's here

| Directory | Stack | What it holds |
| --- | --- | --- |
| `frontend/sveltekit/` | SvelteKit | The origin product's `stylelint.config.js` (the tokens-compliance gate), ported as reference material for the first frontend profile. |

## Why this isn't wired into CI yet

Nothing under `factory/profiles/` is imported or invoked by `.github/workflows/` or
`.github/scripts/` today. `app/` ships empty in this generic core, so there is no real product
CSS or component tree for a stylelint config to run against as a CI gate — only
`factory/bench/tests/design/style.test.ts`'s planted-violation fixtures exercise it, to prove
the gate mechanism bites. Wiring a profile's config into the product's own `lint`/`ci` job, and
deciding how a repo declares which profile is active, is EVP2 work.
