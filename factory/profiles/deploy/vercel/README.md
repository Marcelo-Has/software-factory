# deploy/vercel — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What's missing before this matures to `complete`

- **A `vercelAdapter` for `.github/scripts/preview-url.mjs`.** The script's adapter interface
  (`findPreviewUrl`, a `validate` function plus an ordered list of source lookups — see its
  own header comment) is already generic; only Netlify's implementation exists. Writing
  Vercel's — likely a commit-status or deployment-API source lookup, the same shape as
  `netlifyAdapter`'s `fromCommitStatus`/`fromBotComment` — is unstarted.
- **A natural pairing with `frontend/nextjs`**, itself a skeleton — this module's
  `deploy.vercel.root_directory` can't carry a real value until that one names its `app/web/`
  convention.

## Maturing this skeleton

With the first real product that picks this module, in its own issue.
