# EVP2 S8.2 — GR-7 path-based divergence compare: session report

**Session:** S8.2, branch `evp2/s8-2-gr7-path-compare`, based on `main`.
**Scope:** fix the GR-7 divergence check's brittle full-line comparison in `review.yml`,
`security.yml`, and `design-critic.yml` (`verdict.yml` doesn't carry the ws-expected/ws-final
block, so it's untouched).

---

## 1. The problem

The "Check for workspace divergence (GR-7)" step compared the `git status --porcelain`
snapshot taken right after the agent-config restoration (`ws-expected.txt`) against the
snapshot taken at job end (`ws-final.txt`) **line for line**. A path is genuinely expected to
diverge — that's the whole point of the GR-6 restoration — but the two status characters
`git status --porcelain` prints for that same path can differ between the two snapshots
whenever something later in the job (notably `claude-code-action`'s own git bootstrap)
restages it, e.g. ` M path` at restoration time becoming `M  path` by job end. A full-line
compare then flags an already-expected, already-explained divergence as unexpected, which is
exactly the false-positive noise GR-7 exists to prevent.

## 2. The fix

In all three workflows, both snapshot steps now derive a normalized, sorted, deduplicated
**path-only** file from the porcelain snapshot, and the unexpected-set computation runs on
those instead of on the raw porcelain lines:

```sh
cut -c4- "$SNAPSHOT" | sed -E 's/.* -> //' | sort -u > "$SNAPSHOT-paths.txt"
```

- `cut -c4-` strips the two status characters and the one-space separator porcelain v1 always
  emits before the path.
- `sed -E 's/.* -> //'` collapses a rename line's `old -> new` remainder down to the new path
  (the only one that matters — the new path is what a later reader of the tree will see).
- `sort -u` makes the `grep -Fxv -f` set-difference exact regardless of ordering.

`ws-expected.txt` (the restoration-time snapshot, still printed to the job log for the human
diagnostic) is unchanged; `ws-expected-paths.txt` is the new derived file the comparison
actually runs against. The final-snapshot step mirrors the same normalization into
`ws-final-paths.txt` before diffing. A path recorded as diverged at restoration time now stays
EXPECTED no matter how later git bootstrapping in the job restages it — only a path that
**wasn't** in the expected set at all is flagged.

Everything else is untouched: fail-open semantics (`|| true` after `grep`, `set -euo pipefail`
otherwise), the `::warning::` log line, the publish step's fail-closed publication guard-rail
(GR-2/GR-3), and `design-critic.yml`'s extra expected divergence for the downloaded PNGs.

The publish step's banner in all three workflows also had its wording corrected: "These paths
changed outside the ... restoration" misdescribed the GR-6 set (paths *inside* it are exactly
what's expected to diverge — the banner only fires for paths outside it). Changed to "These
paths diverged beyond the ... restoration", keeping each workflow's own noun phrase
(`agent-config restoration` for `review.yml`/`security.yml`, `config/rubric restoration` for
`design-critic.yml`) and the following `gh pr diff` check instruction, which was already
correct and untouched.

## 3. Dry-run validation

Simulated with the actual `cut -c4- | sed -E 's/.* -> //' | sort -u` pipeline and
`grep -Fxv -f`, no workflow changes needed to reproduce:

### S8.1 case — restoration diverges the three `.claude/`-family paths, nothing else

| ws-expected-paths.txt | ws-final-paths.txt | unexpected set |
| --- | --- | --- |
| `.claude/agents/reviewer.md`, `.claude/settings.json`, `CLAUDE.md` | same 3 paths | **empty** |

### Same case, but the action's own git bootstrap restages (status chars change, paths don't)

| ws-expected (raw porcelain) | ws-final (raw porcelain) | old brittle line-compare | new path-compare |
| --- | --- | --- | --- |
| ` M .claude/agents/reviewer.md`<br>` M .claude/settings.json`<br>` M CLAUDE.md` | `M  .claude/agents/reviewer.md`<br>`M  .claude/settings.json`<br>`A  CLAUDE.md` | flags all 3 (false positive) | **empty** |

### True-positive case — a path absent from the expected set must still be flagged

| ws-expected-paths.txt | ws-final-paths.txt | unexpected set |
| --- | --- | --- |
| `.claude/agents/reviewer.md` | `.claude/agents/reviewer.md`, `app/api/src/secrets.py` | `app/api/src/secrets.py` |

### Rename case — normalization keeps the new path

| ws-expected-paths.txt | raw final line | ws-final-paths.txt | unexpected set |
| --- | --- | --- | --- |
| `CLAUDE.md` | `R  CLAUDE.md -> CLAUDE.old.md` | `CLAUDE.old.md` | `CLAUDE.old.md` (correctly flagged — the tracked path actually changed) |

## 4. Validation

- `npx actionlint` has no CLI binary behind the npm package of the same name (`actionlint`
  metadata reports "Actionlint as wasm", no `bin` field) — downloaded the official
  `actionlint_1.7.7_windows_amd64` release binary directly from
  `github.com/rhysd/actionlint` instead. Sanity-checked it actually lints (flagged a
  deliberately broken expression in a throwaway file, exit 1) before trusting a clean run.
  `actionlint review.yml security.yml design-critic.yml` → **exit 0, no findings** on all
  three.
- `npm test` → **216 passed, 40 skipped**, 0 failed (12 test files passed / 2 skipped) —
  unaffected by this change, no test exercises these workflow YAML files directly.
- `node .github/scripts/english-only.mjs` → **exit 0**, 236 files scanned.
- `node .github/scripts/boundary-check.mjs` → **exit 0**, 234 files scanned.

## 5. Nothing else touched

`verdict.yml` doesn't carry this block and was left alone, as instructed. No out-of-scope
findings surfaced during this session. The branch is ready for the owner to review and
push/PR.
