# EVP2 S8.1 — fixing the S8 dry-run frictions: session report

**Session:** S8.1, branch `evp2/s8-1-friction-fixes`, based on `main` (not on
`evp2/s8-dry-run-ghost`, which stays an unmerged, ghost-product evidence branch per that
session's own instructions).
**Scope:** fix exactly F-1..F-7 plus a template comment for F-9 from
`EVP2-S8-DRY-RUN-REPORT.md`'s friction log (§4). F-8 (`SKILL-ROUTER.md`'s missing default
direction skill) is deliberately untouched — parked for EVP3 planning, per instructions.

---

## 1. Friction → fix → commit

| Friction | Fix | Commit |
| --- | --- | --- |
| F-1 — `validateStatusHeader`'s error message hardcoded to DESIGN.md's "deriving UI" wording, reused verbatim by every other D0-D6 artifact | `gate-design-md.mjs`'s exported `validate()` now returns the parsed `status` instead of prose for the not-approved case; each caller composes its own message. `gate-design-md.mjs` keeps its DESIGN.md wording byte-for-byte; `gate-definition-done.mjs` emits a generic one. Definition-fixture test updated to assert the new wording. | `a638cf0` |
| F-2 — `guard-core-writes.mjs`'s Bash heuristic false-positived on read-only/non-core-targeting commands (co-occurrence, no read/write direction) | Replaced with token-aware target detection: a redirect's target token, `tee`'s/`rm`'s/`sed -i`'s/`git rm`'s arguments, or `cp`'s/`mv`'s destination (last path arg) must itself be core. `2>&1`-style fd duplication is never a write target. Regression tests added for the 3 real false positives and 4 still-blocked true positives. | `48db5a3` |
| F-3 — `behaviors-template.feature`'s header said behaviors are built in D3, contradicting `define-spec/SKILL.md` step 5 and `SPEC-template.md` §3 (both: D2) | Header rewritten: behaviors are built in D2, naming `operationId`/`I-<slug>` values D3 later makes real, never re-inventing them. | `43b2044` |
| F-4 — `DESIGN-DIGEST-template.md` §2's token table had no `muted` row, despite `muted` being used pervasively in `DESIGN.md` §4.1/§9 | Added a `muted` row between `foreground` and `accent`. | `c32b93f` |
| F-5 — `design-director.md` step 2 cited stale `PRODUCT.md` §8.1–8.3 for audience/positioning/personality | Corrected to §2 (Audience) and §6 (Personality and brand positioning), matching `design-foundation/SKILL.md` step 3 and the real `PRODUCT-template.md` (7 sections). | `37659f2` |
| F-6 — provenance tag mismatch: `design-foundation/SKILL.md` and `design-director.md` wrote `created-at-Foundation`; `DESIGN-template.md` §14 (the field's own legend) and `BRAND-ASSETS-template.md` use `created-in-Foundation` | All 3 occurrences (2 in `design-director.md`, 1 in `design-foundation/SKILL.md`) unified to `created-in-Foundation`. | `73a4a73` |
| F-7 — `DESIGN-DIGEST-template.md`'s header said to fill it in "after DESIGN.md is approved", contradicting `design-foundation/SKILL.md` step 9 (digest is the third member of the candidate trio, `Status: candidate`, before approval) | Header rewritten to match step 9. | `787e058` |
| F-9 — a screen with structurally different failure causes (load vs. save) has only one generic `error` `mockup_state`, no way to represent both | Added a comment to `screens-template.yaml`'s `states` field guidance: declare distinct states (e.g. `load-error`, `save-error`) instead of one generic `error` when the causes are structurally different. | `5e0d240` |

F-8 not touched, as instructed.

---

## 2. Validation

- `npm test` → **216 passed, 40 skipped**, 0 failed, 12 test files passed / 2 skipped.
  - `factory/bench/tests/workflows/design-md.test.ts` — all 22 cases pass untouched (F-1's
    DESIGN.md-facing wording is byte-for-byte the same as before).
  - `factory/bench/tests/definition/gate-definition-done.test.ts` — the regressed-status
    fixture test now asserts the new generic wording.
  - `factory/bench/tests/hooks/guard-core-writes.test.ts` — grew from 19 to 24 cases: the 3
    real S8 false positives now pass, and 4 true positives (including the pre-existing
    `git rm CLAUDE.md` case) still block.
- `node .github/scripts/english-only.mjs` → **exit 0**, 236 files scanned.
- `node .github/scripts/boundary-check.mjs` → **exit 0**, 234 files scanned.

## 3. Nothing else touched

No out-of-scope work was done on this branch. F-8 is explicitly parked, not fixed. The branch
is ready for the owner to review and push/PR.
