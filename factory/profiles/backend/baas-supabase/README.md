# backend/baas-supabase — the pilot backend module

**Status: complete (contract).** Contract: `factory/profiles/PROFILES.md`. Manifest:
`module.yaml`.

This is the backend half of the pilot composition
(`factory/templates/examples/ledgerline/ARCHITECTURE.md` §2), paired with `frontend/sveltekit`,
`data-auth/baas` (its own data store and auth are bundled — see `PROFILES.md` §5.1), and
`deploy/netlify` for the frontend side.

## What "complete" means here, precisely

Every `module.yaml` field this session's contract requires is filled, **including
`behaviors`** (DECISIONS.md D-007/D-3.3) — this is the reference module for what a Node-family
backend's DP-3 declaration looks like when it's actually filled in, not left `null` like a
skeleton. What's **not** here yet, on purpose, per `factory/profiles/PROFILES.md` §4 and §6:

- No harness runs the mirrored `app/api/tests/behaviors/*.test.ts` files in CI — that's EVP3.
- No resolver reads this module's `commands`/`deploy` blocks into an actual CI job — also EVP3.
- No `supabase/` tree exists in this repo — `app/` ships empty in the generic core; `scaffold`
  is what a real product instantiates from, not something this module pre-builds.

## Why RLS testing isn't part of the hermetic mock (and won't become the sandbox smoke either)

Row-level-security policies are the authorization mechanism this module recommends (see the
Ledgerline ARCHITECTURE.md example's ADR-2-adjacent reasoning: "policy per role rather than a
hand-rolled authorization layer"). A hermetic, mock-first behavior test can't exercise a real
Postgres RLS policy without a running database — that would stop being hermetic. This module's
`behaviors.mock` therefore tests the handler function's own logic against a stubbed client
response, and leaves policy-against-real-Postgres verification to whatever a future EVP3
sandbox-smoke pass (opt-in, never the default) decides to cover. Recording this now is a
deliberate scope line, not an oversight: right-sizing (`.claude/rules/right-sizing.md`) says a
future improvement gets named and deferred, not built ahead of the phase that needs it.
