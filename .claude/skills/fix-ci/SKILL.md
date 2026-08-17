---
description: Investigates and fixes a PR's red CI, on its own branch. Recognizes the workflow-validation false-red for review.yml/security.yml edits. Usage: /fix-ci <PR-number>
argument-hint: <PR-number>
---

You're going to fix the red CI on PR #$ARGUMENTS.

## Steps
1. `gh pr checks $ARGUMENTS` — see which check failed; `gh pr view $ARGUMENTS` for context.
2. Open the logs for the failed check: `gh run view <run-id> --log-failed`. Identify the
   **root cause** (not the symptom).
3. `gh pr checkout $ARGUMENTS`. Fix the root cause with a **minimal change**. Run
   `npm run lint && npm test && npm run build` until they pass.
4. Commit referencing the issue; push to the **SAME branch** (never to `main`, never open a
   new PR).
5. Report: root cause, what changed, and confirm the checks are green.

## Rules / known traps
- **The workflow-validation impasse:** if the red is `Workflow validation failed ...
  identical content to the default branch` AND the diff touches `review.yml`/`security.yml`,
  that's **not a real failure** — GitHub Actions refuses to run a status-check-defining
  workflow version that only exists on the PR branch. STOP and flag it as a case for
  **manual merge**, not a fix.
- Don't restructure a framework's default behavior just to "pass" CI.
- If the fix requires a product decision, open a `decision-needed` instead of guessing.
- No secrets; minimal, focused change.
