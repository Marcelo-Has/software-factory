---
description: Answers a decision-needed the right way — records it in DECISIONS.md, comments, and closes the issue. Usage: /answer-decision <number> <option/decision>
argument-hint: <number> <option/decision>
---

You're going to answer the `decision-needed` whose number is the first token of
`$ARGUMENTS`, with the decision described in the rest of `$ARGUMENTS` (e.g., `6 A` or
`5 keep the guard-rail`).

## Steps
1. `gh issue view <n>` — read the options and the recommendation.
2. Interpret the user's decision from `$ARGUMENTS`.
3. **Record it in `project/docs/DECISIONS.md`** (the REAL response): turn the matching
   PENDING decision (D-xxx) into `ACCEPTED`, with the chosen option + a 1-line reason + date.
   Commit with a conventional message and push to `main`.
4. **Comment on the issue** (short, it's just a pointer):
   `Decision: <option> — <1-line reason>. Recorded in project/docs/DECISIONS.md (D-xxx), commit <hash>. Closing.`
   and close it with `gh issue close <n>`.
5. If the decision **unblocks** any issue/task, remove the relevant blocker/label.
6. Report what you recorded and closed.

## Rules
- The REAL response is `DECISIONS.md`; **never just a comment** (a comment alone doesn't
  "stick" for the agents).
- If the decision **implies a code change**, don't edit product code directly on `main`:
  create a `status:ready` issue (or a small PR) for that change and cite it in the response.
- If it touches pricing/payments/production/secrets, **confirm with the owner first** before
  applying any code.
