# frontend/sveltekit — the pilot frontend module

**Status: complete.** Contract: `factory/profiles/PROFILES.md`. Manifest: `module.yaml`.

This is the frontend half of the pilot composition (`Ledgerline`'s stack,
`factory/templates/examples/ledgerline/ARCHITECTURE.md` §2) — SvelteKit, paired with
`deploy/netlify` and, in the pilot, `backend/baas-supabase`.

## What's here

- `module.yaml` — the manifest (`factory/profiles/PROFILES.md` §2's schema).
- `stylelint.config.js` — the tokens-compliance gate, this module's `gate_adaptations`. Two
  kinds of content live side by side in it, marked apart by its own comments:
  - **Generic mechanism** (reusable by any product on this module): the two-form allowlist (a
    file-level exception plus a point-of-use `stylelint-disable-next-line ... -- reason`
    comment), `reportDescriptionlessDisables`/`reportNeedlessDisables` closing the anonymous-
    and residual-exception gaps, and the `postcss-html` override that teaches stylelint to
    find the `<style>` block inside a `.svelte` file.
  - **A product's specific choices**: the exact token names (`--radius-md`, `--font-book`,
    the spacing scale's `--space-*` naming, ...) and the literal-color/spacing/radius/shadow/
    typography/motion rule shapes come from that product's own approved `DESIGN.md`. A new
    product instantiating this module replaces them with its own approved token names — the
    config's *shape* (which CSS properties are gated, and by which of the two allowlist
    forms) is what's reused as-is.

## What's still deferred to EVP3

Nothing here is wired into any product's own `lint`/`ci` job yet — see
`factory/profiles/PROFILES.md` §6 (the resolver). `commands.lint` in `module.yaml` is the
contract a future product's own script runs; today, only
`factory/bench/tests/design/style.test.ts` exercises this module's `stylelint.config.js`,
against the harness's planted-violation fixtures, to prove the gate mechanism itself bites.

## Origin

`stylelint.config.js` was ported from the origin product, translated to English, during the
EVP1 port (DECISIONS.md D-004). It lived here as raw material — no manifest, no directory
contract — until DECISIONS.md D-010 formalized this directory into a module.
