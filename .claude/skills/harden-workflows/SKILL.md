---
description: Hardens the GitHub Actions workflows — pins actions by SHA and turns npm audit into a gate. Requires MANUAL MERGE (the workflow-validation impasse). Usage: /harden-workflows
---

You're going to harden the workflows. **NOTE:** this work edits `review.yml`/`security.yml`,
so the `review`/`security` checks will fail on *workflow validation* — that's the
**workflow-validation impasse** (GitHub Actions won't run a status-check-defining workflow
version that only exists on the PR branch), resolved by **manual merge**. Say so explicitly
in the PR.

## Steps
1. Create the branch (e.g., `chore/harden-workflows`).
2. For every third-party action in `.github/workflows/*.yml` (checkout, setup-node, gitleaks,
   etc.):
   - Resolve the current tag's SHA: `gh api repos/<owner>/<action-repo>/commits/<tag>` (or
     `git ls-remote`).
   - Replace `uses: org/action@vX` with `uses: org/action@<sha> # vX.Y.Z`.
3. In `security.yml`: remove the `|| true` from `npm audit` (or use `--audit-level=critical`
   without `|| true`).
4. Run whatever you can locally; open the PR referencing the hardening issue.
5. In the PR body, write: **"MANUAL MERGE (workflow-validation impasse): the review/security
   checks fail by construction; review the diff (workflow files only) and merge over it."**
6. Report the summary.

## Rules
- Only workflow files in this PR (no product code — if any shows up, split it out).
- No secrets; comment the version next to each SHA for traceability.
- Optional: suggest Dependabot to keep the SHAs current.
