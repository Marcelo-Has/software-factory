# backend/baas-firebase — skeleton

**Status: skeleton.** Contract: `factory/profiles/PROFILES.md`. Not authority for a product to
compose today.

## What's missing before this matures to `complete`

- **Product choice.** Firestore vs. Realtime Database changes the data-model shape enough that
  `scaffold` can't be written generically until one is picked as this module's default.
- **`behaviors` filled in, not just `applicable: true`.** `backend/baas-supabase/module.yaml`
  is the reference for what a filled-in, Node-family `behaviors` block looks like
  (DECISIONS.md D-007/D-3.3, `factory/profiles/PROFILES.md` §4) — this module's `runner`/
  `mapping`/`mock` still need the same specificity, not a placeholder.
- **The hermetic-mock strategy for the Firebase Admin SDK.** `module.yaml` flags explicitly
  that the local emulator suite is the wrong answer here (it's a running service, not
  in-process interception) — the actual stub strategy is unstarted.
- **A `data-auth/baas` cross-reference.** Like `backend/baas-supabase`, this module's data
  store and auth are bundled with the same vendor — `data-auth/baas`'s own skeleton needs to
  name this module as a second possible "derives from" target once both mature.

## Maturing this skeleton

With the first real product that picks this module, in its own issue.
