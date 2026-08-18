# frontend/nextjs — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today — see `PROFILES.md` §5 for what "skeleton" means (the same semantics
`factory/docs/playbooks/README.md` already uses for a playbook skeleton).

## What's missing before this matures to `complete`

- **A router convention.** Next.js supports both the App Router and the Pages Router; this
  module needs to standardize on one before `scaffold` can be a real command sequence.
- **A tokens-compliance gate.** `frontend/sveltekit`'s `stylelint.config.js` is this module's
  shape to imitate — same two-form allowlist, same rule categories (color, spacing, radius,
  elevation, typography, motion) — but its exact token names are `frontend/sveltekit`'s own
  product-specific choices, not something this module can copy directly. Writing this
  module's own config, and a matching `postcss-html`-equivalent override if Next.js needs one
  (it may not — CSS Modules/Tailwind don't embed styles the way a `.svelte` file does), is
  unstarted.
- **A `lint-antipatterns.mjs` selector set.** The core's "profile extension point" comment
  block (`.github/scripts/lint-antipatterns.mjs`) is wired to SvelteKit's `.svelte` extension
  and its `on:scroll` event-directive syntax today. A React/Next.js equivalent (`.tsx`/`.jsx`
  extensions, no framework-specific scroll directive — React has none) hasn't been written.
- **A deploy pairing.** Vercel is Next.js's native target, but `deploy/vercel` is itself a
  skeleton (see that module's own README) — this module's `deploy.vercel` field can't be
  filled in with real settings until that one matures.

## Maturing this skeleton

Per the same rule playbooks already follow: maturing happens with the first real product that
picks this module, in its own issue — never inside the PR that used it for the first time.
