# deploy/cloud-run — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What's missing before this matures to `complete`

- **A Dockerfile convention** for `backend/node-service` (this module's mandatory pair) — how
  that module's `app/api/` subtree gets `COPY`'d into a build context.
- **An open question about deploy previews.** Netlify and Vercel both publish a per-PR preview
  URL by default; Cloud Run doesn't, without extra CI wiring (a revision tag per PR, a routing
  rule). Whether this module ends up with its own `preview-url.mjs` adapter, or whether the
  Visual Verification Loop simply doesn't apply to a backend-only deploy target, is genuinely
  undecided — not just unwritten.

## Maturing this skeleton

With the first real product that picks `backend/node-service` and this module together, in its
own issue.
