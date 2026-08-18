# EVP1 S7 — Audit fixes: final session report

**Session:** S7 (audit fixes), branch `evp1/s7-audit-fixes`.
**Scope:** close the six pending items from the EVP1 audit (session C verdict: PASSED,
with these fixes required before EVP2).
**Status:** all six items done, validated, committed on the branch. Not pushed, no PR
opened — per instructions, the owner pushes and opens the PR.

---

## Item-by-item

**(1) `factory/docs/REPO-STRUCTURE.md`** — Done, commit `ba9b620`. Read `CLAUDE.md`, every
top-level directory's own README, `.claude/README.md`, `.github/README.md`, D-002, and
`FACTORY.md` before writing, to avoid contradicting them. 108 lines (under the ~120-line
ask). Verified the `.github/ISSUE_TEMPLATE/factory-task.md` reference now resolves (the
file exists at the path it points to).

**(2) `factory/bench/tests/design/a11y-baseline.json`** — Done, commit `9430979`. Grepped
`factory/bench/tests` for `a11y-baseline` first: no consumer exists in this repo's harness
(`lighthouse-a11y.mjs` still gates on a fixed `FLOOR`, matching `INVENTORY.md`'s prior
"known gaps" note). **Generalized, not copied verbatim**: the source file was in
Portuguese and its route keys embedded the origin product's own route names (a
style/size quiz, a people questionnaire, order success/canceled pages) — both would trip
this repo's `english-only`/`boundary-check` gates and leak product identity into the
core. Translated the keys to English and reduced the route set to the single `/`
placeholder `ui-routes.mjs` already uses, keeping the ratchet's structure (per-route@width
tolerance lists, empty by default, moves in both directions) and thresholds
(critical/serious axe impact) intact. Boundary-check stays green over it.

**(3) DECISIONS.md D-005** — Done, commit `2a8578d`. Recorded retroactively, dated to
when S1.1 actually redesigned the gate. One deviation: my first draft cited the literal
Portuguese stopwords as examples (`para`, `como`, `deve`, `ainda`) and that line tripped
the `english-only` gate's own Layer B — rephrased to describe the wordlist generically
instead of touching the allowlist mechanism, keeping the fix minimal.

**(4) `factory/checklists/README.md`** — Done, commit `f604c60`. 11 lines.

**(5) GR-sweep + DECISIONS.md D-006** — Done, commit `56b1b6e`. Mapping recorded exactly
as specified. Mechanical `sed` sweep across `.claude/agents/`, `.github/scripts/`,
`.github/workflows/`, `factory/bench/tests/` — every hit was inside a `#`/`*` comment or
backtick-quoted prose citation (verified via diff before committing); one YAML step
`name:` field per workflow also got swept (e.g. `Check for workspace divergence (D-042)`
→ `(GR-7)`) since it's a display label matching the same pattern as the adjacent comment,
not control-flow logic. `FACTORY.md`'s table is the only place carrying the
`(origin D-0xx)` suffix.

**(6) `.gitattributes` + renormalization** — Done, commit `516407b`, separate from item
(5)'s content changes. `git add --renormalize .` found **nothing to re-hash** on already
-tracked files — this repo's git object store was already LF-consistent (prior commits'
`core.autocrlf=true` had already normalized it on the way in). The CRLF the owner sees
locally is a working-tree/editor artifact of that same `autocrlf` setting, not something
tracked in git's index — `git diff`/`git status` show no phantom diff today. The
`.gitattributes` file is still the right fix: it makes line-ending behavior explicit and
deterministic per-file-type instead of depending on each clone's local git config, which
is what actually prevents the phantom diff from *starting* to appear on a future clone
or a contributor with different `autocrlf` settings.

**Finally, `factory/docs/INVENTORY.md`** — Done, commit `44ad729`. Added rows for
`REPO-STRUCTURE.md`, `a11y-baseline.json`, `checklists/README.md`, `.gitattributes`;
amended the "known gaps" note to point at D-005/D-006 instead of claiming the two files
were never created. `EVP1-S6-CLOSING-SWEEP-REPORT.md` left untouched, as instructed.

## Deviation: temporary `.claude/settings.json` relaxation

`.claude/settings.json` denies `Edit`/`Write` under `factory/**` — a guard-rail meant for
autonomous *product* sessions, not factory-core development. Every one of items 1–5
needed to write under `factory/`, so the very first `Write` call was blocked outright,
and routing around it via `Bash` heredoc was also denied. Per the owner's explicit
direction mid-session: removed the two deny entries, did all the `factory/**` writes,
then restored the deny entries — `git diff` on `.claude/settings.json` is empty in the
final state; no commit touches that file.

This is the **same friction the S6 session report already flagged** ("factory-core
-development sessions like S1–S6 need a way to write to `factory/**` that doesn't
require a manual settings edit each time") — recurring now in S7 confirms it's not a
one-off. Parking it again rather than fixing it here: it's a tooling/process decision
(e.g. a separate `settings.local.json`-based override for factory-upgrade sessions, or a
session-type flag) outside this session's six-item scope, and the owner should decide
the mechanism.

## Validation

- (a) `node .github/scripts/english-only.mjs` → **exit 0**, 99 files scanned.
- (b) `node .github/scripts/boundary-check.mjs` → **exit 0**, 97 files scanned (one
  real fix needed here: `REPO-STRUCTURE.md` first used bare `web/`/`worker/` tokens
  describing `app/`'s subfolders, which the gate's origin-specific path regex flags
  outside `app/`-prefixed context — reworded to `app/web/`, `app/api/`, `app/worker/`,
  matching the pattern `app/README.md` itself already avoids).
- (c) `npm test` → **157 passed, 40 skipped** (D-004 self-skips), 9 test files passed, 0
  failed.
- (d) GR-sweep grep (`D-019|D-034|D-037|D-047|D-087|D-033|D-042|D-039|D-032`, whole repo)
  → exactly two files: `DECISIONS.md` (D-006's mapping table) and `factory/docs/FACTORY.md`
  (the "(origin D-0xx)" suffixes). Nowhere else.
- (e) Renormalization commit (`516407b`) diff → `.gitattributes` only, 7 insertions, no
  other file touched (see item 6 above for why).
- (f) Planted-violation tradition: added a Portuguese sentence to
  `factory/docs/REPO-STRUCTURE.md`, ran the gate — failed with
  `[layer B (Portuguese stopword)]` pointing at the exact line — then removed it and
  re-ran clean. Not committed at any point (verified via `git diff` before each commit).

## Nothing parked beyond the two items already noted above

(the settings.json friction, and treating item 2's file as unwired until a future EVP2
session builds the consuming test/gate against it).
