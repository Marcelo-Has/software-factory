# Planted violations — the proof that gates reject

These files exist to **fail**. Each one plants a violation of one deterministic design gate, and
`factory/bench/tests/design/*.test.ts` runs the real gate against them and requires the
rejection.

Why permanent, not just a disposable branch experiment: a gate written and never seen rejecting
is a gate nobody knows works. The branch experiment proves it **once**; these files prove it
**on every CI round** — including the day someone loosens a regex and doesn't notice.

They are not compiled into any UI: they stay out of a product's `tsconfig.json` `include`, out
of the scope of a product's `lint:style` script (which is scoped to its own source tree), out
of the default sweep of the antipatterns lint (scoped to `app/web/src`), and out of a product's
own `.prettierignore`/ESLint `ignores` — a file whose content is deliberately wrong should
never be formatted or auto-fixed.
