# DECISIONS.md

Numbered decision log for this repo. Numbering is this repo's own, starting at
D-001 — it does not inherit numbers from any product this factory has built or will
build.

---

## D-001 — Bootstrap this repo as the generic factory core

**Date:** 2026-08-17
**Status:** accepted

This repo is the generic, product-agnostic core of an autonomous software factory,
extracted (ported) from an existing product repo. The origin repo stays read-only
and is never referenced by path or content from the core.

Decisions fixed for this port:

- **Hierarchy.** `factory/` (immutable core) × `project/` (product docs, design,
  state) × `app/` (product code). Only `project/` and `app/` are ever written to
  when the factory operates on a product; `factory/`, `.claude/`, and `.github/`
  stay immutable per project.
- **Language.** Everything under `CLAUDE.md`, `DECISIONS.md`, `.claude/`,
  `.github/`, `factory/` is 100% English — no Portuguese anywhere, enforced by a CI
  gate (`no-portuguese.mjs`).
- **Boundary.** The origin repo's product identity (paths, hosting identifiers,
  product name) must never leak into the core, enforced by a CI gate
  (`boundary-check.mjs`).
- **Own history.** This file starts at zero: it is this repo's own decision record,
  not a copy of the origin repo's decision history. Where that history holds a
  lesson worth keeping, it is ported as a lesson (no origin issue numbers), not as
  a decision entry here.
- **Incremental port.** The port happens over a small number of focused sessions
  (skeleton, docs, `.claude/`, `.github/`, harness, closing sweep), each a small,
  auditable commit — so the porting itself is reviewable the same way factory
  output is expected to be.

**Why:** the factory needs to be reusable across products. Keeping it entangled
with one product's history, paths, and language would make every future product
pay the cost of the first one.
