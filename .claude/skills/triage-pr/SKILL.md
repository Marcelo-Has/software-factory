---
description: Triages a PR's review comments and resolves only what belongs to it; the rest becomes a sub-follow-up, updates an existing issue, or is kept as the framework's default behavior. Preserves framework defaults. Usage: /triage-pr <PR-number>
argument-hint: <PR-number>
---

You're going to triage and resolve the review findings on PR #$ARGUMENTS.

## Step 1 — Read and VERIFY (don't assume)
- Run `gh pr view $ARGUMENTS --comments` and `gh pr checks $ARGUMENTS`.
- Read ALL verdict comments (review, security) and the checks' state.
- For each finding, VERIFY against the source (project code, the framework's own source,
  `project/docs/`, `.claude/rules/`) instead of assuming. Record what you confirmed.

## Step 2 — Triage (present it and STOP for approval)
Build a table — for each finding: severity · is it a real defect OR the framework's STANDARD
behavior? · classification:
- **[fix in this PR]** — small, a real fix, touches files already in the diff.
- **[new sub-follow-up]** — new scope / hardening.
- **[update existing issue #N]** — belongs to an issue already open.
- **[KEEP — framework default]** — standard framework structure/behavior with no real
  defect: do NOT change it.
- **[note it]** — a heads-up for later: a code comment + a PR comment (don't create a
  premature issue).

Present the table and **wait for explicit approval** before editing anything.

## Step 3 — Execute (only after approval)
- **[fix in this PR]:** `gh pr checkout $ARGUMENTS`; apply a MINIMAL change (don't
  restructure framework defaults); run `npm run lint && npm test && npm run build` until
  green; commit referencing the issue; push to the SAME branch.
- **[new sub-follow-up]:** create it in the repo's standard format
  (Context/Goal/Scope/Out-of-scope/Acceptance-criteria/Requirements/Files/Tests/Dependencies/DoD),
  label `status:ready`.
- **[update existing issue]:** edit the issue, adding only the relevant point to
  Scope/Criteria.
- **[KEEP]/[note it]:** leave a comment explaining why it's intentional/by design (in the
  code and/or the PR).
- Comment on the PR summarizing: fixed here · became a follow-up (links) · went into an
  existing issue (link) · kept as the default (justification) · noted.

## Inviolable rules
- NEVER restructure a framework's default behavior to satisfy a nitpick — keep the default
  and explain it.
- NEVER edit `review.yml` or `security.yml` here (the workflow-validation impasse requires a
  separate manual merge).
- Minimal change; no secrets; small, focused PRs and issues.
- If a finding requires a product decision, open a `decision-needed` instead of guessing.

## Final check
`lint`/`test`/`build` green; if the PR touches headers/security, verify empirically
(`npm run preview` + `curl -I`); the PR's CI green after the push; `gh pr view $ARGUMENTS
--comments` and the created/updated issues checked.
