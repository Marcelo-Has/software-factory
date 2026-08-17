# factory/

## Contract

`factory/` is the **immutable core** of the software factory. It is versioned and
evolved as part of this template repo, never as a side effect of building a product.

- Once this repo is used as the base for a product, `factory/` does not change unless
  the change is a deliberate factory upgrade (own PR, own review, ported back into the
  template).
- Nothing in here may depend on, or reference, a specific product: no product names,
  paths, hosting identifiers, or history. That boundary is enforced by
  `.github/scripts/boundary-check.mjs`.
- Product-specific work lives in [`project/`](../project/README.md) (docs, design,
  state) and [`app/`](../app/README.md) (code) — the only two directories the factory
  writes to when operating on a product.

## Layout

| Directory | Purpose |
|---|---|
| `docs/` | The factory's own documentation: choreography, autonomy framework, craft principles, playbooks. |
| `templates/` | Blank templates instantiated into `project/` when a product is bootstrapped. |
| `profiles/` | Stack-specific raw material (e.g. a frontend framework's lint config), not yet formalized into a profile module contract. |
| `checklists/` | Operating checklists used during factory sessions. |
| `bench/` | The harness: scenarios, rubrics, and the tests that prove the factory's gates actually bite. |

Content for most of these lands in later port sessions; this directory tree is the
skeleton they fill in.
