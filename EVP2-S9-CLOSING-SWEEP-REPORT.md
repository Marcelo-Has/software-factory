# EVP2 S9 — closing sweep: session report

**Session:** S9, branch `evp2/s9-closing-sweep`, based on `main` (after PR #17, the S8.2
GR-7 path-compare fix). **Scope:** repo-wide gate/test sweep, `INVENTORY.md` refresh,
coverage audit against the plan's §2 build map, governance verification, the friction
carry-over check, and the `factory-core-v1` tag.

---

## 1. Gates and tests — repo-wide

Verified identically on `main` and on this branch (this branch is `main` plus one
docs-only commit to `INVENTORY.md`; nothing that changes gate/test behavior).

| Check | Result |
| --- | --- |
| `node .github/scripts/english-only.mjs` | **exit 0**, 236 files scanned |
| `node .github/scripts/boundary-check.mjs` | **exit 0**, 234 files scanned |
| `npm test` | **216 passed, 40 skipped**, 0 failed — 12 test files passed / 2 skipped (of 14) |
| `actionlint` (all 9 `.github/workflows/*.yml`) | **exit 0**, no findings |

**Totals vs. the EVP1 baseline (157 passed / 40 skipped):** +59 passed, skip count
unchanged. The new tests are `factory/bench/tests/hooks/guard-core-writes.test.ts` (24
cases, GR-10) and `factory/bench/tests/definition/` (`gate-contracts.test.ts` +
`gate-definition-done.test.ts`, the DP-3/Definition-Done fixture suites) — nothing else in
the harness grew or shrank test count this wave.

Nothing needed fixing: both gates and the full suite were already green at the start of
this session.

---

## 2. `factory/docs/INVENTORY.md`

Refreshed (commit `3d350f3`) with one line per new artifact of this wave — the 8 new
Definition skills, `gate-contracts.mjs`/`gate-definition-done.mjs`, the GR-10 hook, the
profile-module contract and its 10 modules, ~16 templates + the 14-file Ledgerline example
set, `definition-done.md`, the `external-integration.md` playbook — plus updated notes on
every pre-existing entry this wave materially changed (`settings.json`'s hook swap, `ci.yml`'s
`contract-gates` job, `gate-design-md.mjs`'s extracted parser, the three GR-7-fixed
workflows, `security.md`/`security.yml`'s nfr.md pointer, the F-1..F-9 template/skill fixes).
Each line's origin decision cites `D-007`–`D-010` or the EVP2 session that built it. Tag
line updated from `factory-core-v0` to `factory-core-v1`.

---

## 3. Coverage audit against the plan's §2 build map

Every row of §2.1–§2.6 is **done**. No row is skipped.

| §2.x | Session | Artifact group | Status |
| --- | --- | --- | --- |
| 2.1 | S1 | Guard-rail + decisions (hook, settings.json, test suite, FACTORY.md/REPO-STRUCTURE.md/CLAUDE.md mentions, D-007/D-008, `.gitignore`) | done |
| 2.2 | S2 | 7 document templates + 6 Ledgerline doc examples | done |
| 2.3 | S3 | 9 machine-readable templates + 8 Ledgerline machine-readable/DP-3 examples + `external-integration.md` playbook + README table | done |
| 2.4 | S4 | `gate-contracts.mjs`, `gate-definition-done.mjs`, `gate-design-md.mjs` refactor, `definition-done.md`, `ci.yml` job, `package.json`, fixture suite, `factory-task.md` section, `security.yml` rubric, `security.md` sentence | done |
| 2.5 | S5 | `PROFILES.md`, 3 complete modules, 7 skeleton modules, D-010 | done |
| 2.6 | S6 | `/init`, `/define-product`, `/define-spec`, `/define-architecture`, `answer-decision` routing fix | done |
| 2.6 | S7 | `/design-foundation` reshape, `/design-mockups`, `/plan-milestones`, `/fabric-init` | done |
| 2.7 | — | Target tree structure | matches the delta described |

**Extras not named in the §2 build map** (both legitimate, both already merged before this
session started):

- **`EVP2-S8.1-FRICTION-FIXES-REPORT.md`, `EVP2-S8.2-GR7-PATH-COMPARE-REPORT.md`** — session
  report files. §2 only maps S1–S7's artifacts; S8.1's own prompt required a report ("session
  report lists each friction -> fix commit"), and S8.2 (below) produced one by the same
  convention. Consistent with how `factory/docs/INVENTORY.md` already omits root-level
  session-report files as a class (e.g. `EVP1-S7-AUDIT-FIXES-REPORT.md` isn't inventoried
  either) — not treated as core artifacts.
- **Session S8.2 itself** (`evp2/s8-2-gr7-path-compare`, PR #17) — a fix session between
  S8.1 and S9 that is **not part of the plan's documented S1–S9 sequence**. It hardened the
  GR-7 workspace-divergence check in `review.yml`/`security.yml`/`design-critic.yml` (raw
  porcelain-line compare → normalized path-only compare, fixing a false-positive when later
  git bootstrapping in the job restages an already-expected path). Mechanically scoped,
  doesn't touch D-007..D-010, adds no new agent, `actionlint`/gates/tests all green — but its
  existence outside the plan's session list is worth the owner's explicit sign-off, not
  something this session should silently wave through as "in scope."
- **`factory/bench/tests/definition/fixtures/**`** — the plan (§0.4.5) specifies "1 clean +
  5 violated" fixture trees without naming files; the actual 6 fixture directories × ~13
  files each match that count and intent exactly. Not a deviation, just unenumerated detail.

No artifact exists in the repo that isn't traceable to a plan row or one of the two flagged
extras above.

---

## 4. Governance verification

- **`DECISIONS.md` D-007..D-010** — present, sequential, each with `Date`/`Status: accepted`/
  a `**Why:**` closing section, in the repo's own voice (matches D-001..D-006's form).
- **`factory/docs/FACTORY.md` GR-10 row** — present in the guard-rail table, same shape as
  GR-1..GR-9 (mechanism + lesson columns), no "(origin D-0xx)" suffix (correct — GR-10 is new
  to this repo, not inherited).
- **`.github/workflows/ci.yml` job list** — `english-only`, `boundary-check`, `factory-tests`,
  `contract-gates` (new, always-runs, not required), `detect-app-code`, `product-ci`. Matches
  plan §0.4.4/§0.9's required-checks note (branch protection unchanged: `english-only`,
  `boundary-check`, `factory-tests` stay the three required checks; `contract-gates` is
  explicitly deferred to EVP3).
- **`actionlint`** — clean on all 9 workflow files (§1 above).

---

## 5. S8 frictions carried forward — verified fixed on `main`

Per `EVP2-S8-DRY-RUN-REPORT.md`'s friction log (§4, read from the never-merged
`evp2/s8-dry-run-ghost` evidence branch) and `EVP2-S8.1-FRICTION-FIXES-REPORT.md`'s fix
table. Each of the following was independently re-verified in this session (grep/read
against the current `main`, not just re-trusting the S8.1 report):

| Friction | Fix verified on `main` | Regression test verified |
| --- | --- | --- |
| **F-1** — DESIGN.md-specific error message reused verbatim for every D0–D6 artifact | `gate-design-md.mjs`'s exported parser now returns status data, not prose; `gate-definition-done.mjs` composes its own generic message (confirmed in `gate-definition-done.mjs` output text) | `factory/bench/tests/definition/gate-definition-done.test.ts` asserts the new wording |
| **F-2** — Bash anti-bypass heuristic false-positived on read-only/non-core commands | `guard-core-writes.mjs`'s Bash matcher is token-aware (redirect target / `tee`/`rm`/`sed -i`/`git rm` argument / `cp`\`mv` destination) | `guard-core-writes.test.ts` "F-2 false positives — must pass" block: `cp factory/... project/...`, `... 2>&1`, `rm project/... && node .github/...` all pass; true positives still block |
| **F-3** — `behaviors-template.feature` header said D3, contradicting `define-spec`/`SPEC-template.md` (D2) | Header now reads "Built in D2 (`/define-spec`)..." | n/a (doc-only fix, no gate behavior) |
| **F-4** — `DESIGN-DIGEST-template.md` §2 missing a `muted` row | `muted` row present between `foreground` and `accent` | n/a (doc-only fix) |
| **F-5** — `design-director.md` cited stale `PRODUCT.md` §8.1–8.3 | Now cites §2 (Audience) / §6 (Personality/positioning) | n/a (doc-only fix) |
| **F-6** — provenance tag mismatch (`created-at-Foundation` vs. `created-in-Foundation`) | All 3 occurrences (`design-director.md` ×2, `design-foundation/SKILL.md` ×1) unified to `created-in-Foundation` | n/a (doc-only fix) |
| **F-7** — digest template header said "after DESIGN.md is approved" | Now reads "as the third member of the **candidate** trio... before owner approval" | n/a (doc-only fix) |
| **F-9** — no way to declare structurally distinct error states (load vs. save) | `screens-template.yaml`'s `states` guidance now names `load-error`/`save-error` as the pattern | n/a (comment-only fix, by design — F-9 was scoped as a template comment, not a gate rule) |

**F-8 (SKILL-ROUTER.md's default aesthetic-direction skill has no file to point at)** —
confirmed still untouched, as instructed. Remains **parked for EVP3 planning**.

---

## 6. Open findings parked during S1–S8.1 (report only — not fixed here)

- **`CLAUDE.md`'s "D/FU glossary (stub)" still reads `FU-xx`**, a leftover from before D-006
  renamed that reference scheme to `GR-xx` (flagged as out-of-scope in PR #8's description,
  S1). Still present verbatim (`## D/FU glossary (stub)` / `**FU-xx** — a numbered
  guard-rail...`). Low severity — it's a stub section pending real content, not a wrong claim
  about a real mechanism — but worth a one-line fix whenever that stub is next touched.
- **F-8** (above) — parked for EVP3 planning, per the owner's S8.1 decision.
- **Language config exercised only in English** (`EVP2-S8-DRY-RUN-REPORT.md` §5) — the ghost
  product's `/init` ran with `language: "en"`; a non-English product's full round-trip through
  the Definition skills is deferred to EVP4, per plan §0.8 (decision, not a defect).
- No other out-of-scope findings surfaced in any S1–S7 PR body beyond the one above; S8.1 and
  S8.2's own reports each close with "nothing else touched," confirmed by their diffs.

---

## 7. Tag

`factory-core-v1` (annotated) created after this report's commit, pointing at the tip of
`evp2/s9-closing-sweep` — the state this report describes: EVP2's Definition Phase build
complete, both gates green repo-wide, harness green, `INVENTORY.md` current, all S8
real-defect frictions (F-1, F-2) fixed and regression-tested, F-8 explicitly parked.

---

## 8. Validation

- `node .github/scripts/english-only.mjs` → exit 0, 236 files.
- `node .github/scripts/boundary-check.mjs` → exit 0, 234 files.
- `npm test` → 216 passed / 40 skipped, 0 failed.
- `actionlint .github/workflows/*.yml` → exit 0.
- `INVENTORY.md` covers every new artifact of this wave with an origin decision.
- This report is ready for the Fable review session against the plan's §4 gate table.
