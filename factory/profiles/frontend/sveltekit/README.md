# frontend/sveltekit/ — raw material for a future SvelteKit profile

**Status: raw material — formalized as a profile module in EVP2.**

`stylelint.config.js` is the origin product's tokens-compliance gate, ported here translated to
English with the mechanism kept intact. Two kinds of content live side by side in it, and the
comments mark which is which:

- **Generic mechanism** (applies to any product built on this pattern): the two-form allowlist
  (a file-level exception plus a point-of-use `stylelint-disable-next-line ... -- reason`
  comment), `reportDescriptionlessDisables`/`reportNeedlessDisables` closing the anonymous- and
  residual-exception gaps, and the `postcss-html` override that teaches stylelint to find the
  `<style>` block inside a `.svelte` file.
- **This one product's specific choices**: the exact token names (`--radius-md`,
  `--font-book`, the spacing scale's `--space-*` naming, ...) and the literal-color/spacing/
  radius/shadow/typography/motion rule shapes are what THIS origin product's approved
  `DESIGN.md` declared. A new product instantiating this profile replaces them with its own
  approved token names — the config's *shape* (which CSS properties are gated, and by which of
  the two allowlist forms) is the part worth reusing as-is.

`factory/bench/tests/design/style.test.ts` runs the real `stylelint` package against this
config and the planted-violation fixtures in `factory/bench/tests/design/fixtures/`, to prove
the gate mechanism actually rejects what it should. It does not lint any real `app/web` source
— there isn't one yet in this generic core.
