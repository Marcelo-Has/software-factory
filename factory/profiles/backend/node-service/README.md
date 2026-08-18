# backend/node-service — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What's missing before this matures to `complete`

- **A framework choice.** Fastify, Express, Hono, and others differ enough in scaffold shape
  and routing convention that `scaffold` and `commands` can't be written generically yet.
- **The auth/session layer's shape.** Unlike the BaaS backend modules, this one has no bundled
  auth provider — it's the module that makes `data-auth/postgres` a genuine independent
  decision (`factory/profiles/PROFILES.md` §5.1). What library or hand-rolled mechanism this
  module standardizes on isn't decided.
- **`behaviors.mock`'s specifics.** `runner` and `mapping` are already fixed — this module is
  the most literal instance of the Node-family contract (`PROFILES.md` §4) — but the hermetic
  mock strategy for this module's *own* auth/session layer (not a BaaS provider's SDK) still
  needs designing.
- **A `deploy/cloud-run` pairing**, itself a skeleton — this module's `deploy.cloud-run` field
  can't carry real settings until that one matures.

## Maturing this skeleton

With the first real product that picks this module, in its own issue.
