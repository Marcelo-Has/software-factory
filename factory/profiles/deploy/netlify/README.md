# deploy/netlify — the pilot deploy module

**Status: complete.** Contract: `factory/profiles/PROFILES.md`. Manifest: `module.yaml`.

This is the deploy half of the pilot composition
(`factory/templates/examples/ledgerline/ARCHITECTURE.md` §2), paired with `frontend/sveltekit`
(and, in the pilot, `backend/baas-supabase`, whose edge functions deploy alongside the same
Netlify site).

## Why this is `complete` with no new code

The core already ships a working Netlify adapter — `.github/scripts/preview-url.mjs`'s
`netlifyAdapter` — built during the port, before this module contract existed. Formalizing
this module means declaring that existing adapter as this module's `gate_adaptations`, not
writing a new one. See `preview-url.mjs`'s own header for the adapter interface
(`findPreviewUrl`, one source per way a preview URL becomes discoverable) if a second deploy
platform's adapter needs to be added later.

## What's still deferred to EVP3

`module.yaml`'s `deploy.netlify.base`/`publish` are per-product values (`[TO FILL IN]`) —
generating an actual `netlify.toml` from a chosen frontend/backend module's `app_layout` is
the resolver's job (`factory/profiles/PROFILES.md` §6), not this module's. Nothing under
`factory/profiles/deploy/netlify/` is read by any script today; `preview-url.mjs` runs
independently of this manifest, driven by environment variables `.github/workflows/` sets
directly.
