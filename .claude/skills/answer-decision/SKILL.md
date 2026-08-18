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
3. **Pick the decision log by mode (`DECISIONS.md` D-009 §7):** does
   `project/state/init.json` exist? That's the GR-10 product marker
   (`.claude/hooks/guard-core-writes.mjs`, `factory/docs/FACTORY.md`'s guard-rail table). If it
   exists, this is a **product repo** — the log is `project/docs/DECISIONS.md`, in the language
   `init.json` declares. If it doesn't, this is the **factory-source repo itself** — the log is
   the root `DECISIONS.md`, in English. Never write to both, and never guess: check
   `project/state/init.json` every time, this isn't a one-time setting.
4. **Record it in that log** (the REAL response): turn the matching PENDING decision (D-xxx —
   the log's own numbering) into `ACCEPTED`, with the chosen option + a 1-line reason + date.
   Commit with a conventional message and push to `main`.
5. **Comment on the issue** (short, it's just a pointer):
   `Decision: <option> — <1-line reason>. Recorded in <the log path used above> (D-xxx), commit <hash>. Closing.`
   and close it with `gh issue close <n>`.
6. If the decision **unblocks** any issue/task, remove the relevant blocker/label.
7. Report what you recorded and closed.

## Rules
- The REAL response is that decision log (`project/docs/DECISIONS.md` in product mode, root
  `DECISIONS.md` in the factory-source repo); **never just a comment** (a comment alone doesn't
  "stick" for the agents).
- If the decision **implies a code change**, don't edit product code directly on `main`:
  create a `status:ready` issue (or a small PR) for that change and cite it in the response.
- If it touches pricing/payments/production/secrets, **confirm with the owner first** before
  applying any code.
