# data-auth/baas — skeleton, a derived record

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What this module is, and isn't

Per `PROFILES.md` §5.1: a BaaS backend module (`backend/baas-supabase`, `backend/baas-firebase`)
bundles its own data store and auth provider — there's no independent data-auth decision to
make once that backend module is chosen, only a decision to *record* so `profile.json` always
resolves all four dimensions (§3). This module is that record. It scaffolds nothing of its own
— `app_layout`, `commands`, `deploy`, and `gate_adaptations` are all `null`/not applicable by
design, not because they're unfinished.

## What's missing before this matures to `complete`

- **The `derives_from` convention.** How this module's manifest (or `profile.json` itself)
  states *which* `backend/baas-*` module it derives from isn't decided yet — a `derives_from`
  field on this module's `module.yaml`, or a fixed rule ("data-auth is always `baas` whenever
  `backend` starts with `baas-`") are both plausible; picking one is unstarted.
- Everything else in this manifest is intentionally, permanently `null` — maturing this module
  means resolving the one open question above, not filling in scaffold/commands/deploy fields
  that will never apply to it.
