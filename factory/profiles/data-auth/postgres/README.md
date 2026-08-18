# data-auth/postgres — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What this module is

Unlike `data-auth/baas` (a derived record, see that module's README), this is a genuine
independent choice: a self-hosted Postgres instance plus a standalone auth library, paired
with `backend/node-service` — the one backend module with no bundled data-auth provider of its
own.

## What's missing before this matures to `complete`

- **A migration-tool choice** (node-pg-migrate, Prisma, Drizzle, or another) — `scaffold`
  can't be written generically until one is picked.
- **An auth-library choice** — this dimension owns session/credential handling for
  `backend/node-service`, and no library has been evaluated.
- **`app_layout`.** Whether this module's schema/migration files live under `app/api/`
  (co-located with `backend/node-service`) or a dedicated `app/db/` tree isn't decided.
- **A managed-Postgres deploy target.** Per the D-3.7 genericity rule (DECISIONS.md D-007),
  the core names no concrete vendor — this module's `deploy` block needs a provider-neutral
  description of what a product configures, not a specific vendor's settings.

## Maturing this skeleton

With the first real product that picks `backend/node-service` (this module's mandatory pair),
in its own issue.
