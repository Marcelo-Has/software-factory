# FACTORY.md — the choreography

> How the factory works: roles, the two operating regimes, the non-AI guard-rails that
> keep autonomy safe, the FU/D vocabulary, and the operating lessons behind the guard-rails.
> This is the **single canonical description** of the choreography — do not fork a second
> one. Record relevant changes in [`DECISIONS.md`](../../DECISIONS.md).

## The model — an agency of freelancers

Think of an **autonomous agency** that you own. There is a **manager agent** (Supervisor)
and specialist subagents: a **Builder** (developer-lead, with frontend/backend
specializations), two **Inspectors** (Reviewer and Security), a **Fixer**, and a **delivery
Judge** (Verdict) who never wrote the code and decides whether the order is complete. From
outside it looks like the classic agent→subagents hierarchy — and that framing is enough to
understand *who does what*.

The difference is that in this agency **the freelancers never talk to each other.** All
coordination goes through a **shared task board** — GitHub (issues, labels, PRs, comments,
and CI status) — with fixed routing rules. The manager posts a work order on the board and
leaves. The builder clocks in from zero when it sees `status:ready`, pins the PR to the
board, and leaves. The PR's appearance summons the inspectors; a green CI run on an
incomplete PR summons the judge. The roles that only report **don't even publish
themselves**: they write their verdict to a file, and a **non-AI clerk** (a workflow step)
pins it to the board.

Every "subagent" is a **freelancer with a badge** (an allow-list) that only opens certain
doors: the Builder and the Fixer hold the key to the workshop (`Edit`/`Write`, git); the
Inspectors and the Judge only carry a read badge (not even a pen for the board); **nobody**
holds the key to the merge vault — that one is yours, and it's backed by branch protection.

## Orchestration vs. choreography

The standard shape for multi-agent work is **orchestration** (one central maestro agent
conducts everything); this factory is **choreography** (event-driven, no central brain).

| | Standard shape (orchestration) | This factory (choreography) |
|---|---|---|
| Coordinator | one agent (LLM) that reasons and conducts | **GitHub** (fixed rules) **+ you** (judgment) |
| How work flows | the parent calls the child and waits | an **event** on the board **triggers** the next step |
| Context | inherited in the parent's memory | **re-read from zero** off the board (issue/PR/diff) |
| Routing decision | dynamic, chosen by an agent | **fixed trigger** (label→workflow, red CI→fix, green CI on an incomplete PR→verdict) |
| Workers | nested children | **peers in isolated sessions** |

## The two regimes

The factory runs the same choreography under two different traffic patterns, distinguished
by where work comes from.

- **Generation regime.** The product doesn't exist yet, or a whole phase of it doesn't. The
  Supervisor works a roadmap phase-by-phase: it reads `project/docs/ROADMAP.md`, sizes the
  next unblocked item to fit the turn budget, and opens `status:ready` issues in dependency
  order until the phase's definition of done is met. Cadence is cron-driven and issue
  throughput is high; the Supervisor is the primary driver of what gets built next.
- **Maintenance regime.** The product (or the phase) is live. Work arrives as bug reports,
  small features, dependency bumps, and new versions of product skills — filed through
  `ISSUE_TEMPLATE/factory-task.md` rather than dispatched systematically off a roadmap scan.
  The template gains a "Visual requirements" section whenever the issue is labeled
  `area:frontend`. Supervisor cadence can slow down or stop; human-filed and ad hoc issues
  become the norm, and the same roles and guard-rails apply unchanged.

A project moves from Generation to Maintenance per phase, not all at once — the roadmap can
have an early phase in Maintenance (the factory's own scaffolding, already stable) while a
later phase is still in Generation.

## Roles and permissions

| Workflow | Role | Trigger | Writes code? | Turn budget* | Guard-rail |
|---|---|---|---|---|---|
| `supervisor.yml` | Supervisor | cron + dispatch | no (opens issues) | 30 | — |
| `implement.yml` | developer-lead (Builder) | `status:ready` · dispatch · re-entry | **yes** | 100 (target: 40) | exit guard-rail + re-entry cap |
| `review.yml` | Reviewer | `pull_request` | no (read-only, judges the diff) | 80 | verdict-per-file + non-AI publish step |
| `security.yml` | Security | `pull_request` | no (read-only) | 80 | same as Reviewer |
| `verdict.yml` | Verdict (delivery judge) | green CI on a PR labeled `delivery:incomplete` | no (read-only; flips the label via a step) | 40 | the publish step itself is the guard-rail |
| `fix.yml` | Fixer | red CI on a PR | **yes** | 40 | exit guard-rail |
| `daily-report.yml` | Reporter + alarms | cron | no | 25 | alarms are non-AI |
| `claude.yml` | interactive (`@claude`) | mention (owner-gated) | yes* | — | — |
| `ci.yml` | deterministic judge | push/PR | no — no AI at all | — | it *is* the gate |

\* Turn budgets are example baselines carried from the origin project — recalibrate per
product and per model. What matters is that every workflow states its own budget explicitly
(see "Explicit turn budget" below), not the specific numbers.

Common to every role: `gh pr merge` never runs inside a workflow (merge is human-only);
outbound network access is off for judging roles; a PR from a fork never triggers the
privileged workflows (`head_repository == repository`); the agent's own config
(`CLAUDE.md`/`AGENTS.md`/`.claude/`) is restored from the base branch before any judging role
runs, so a PR under review can't rewrite the instructions of whoever is reviewing it; the
embedded git credential is stripped from `.git/config` before broad filesystem reads; every
session's transcript is uploaded as a redacted artifact.

## The five moments of the cycle

1. **Plan.** The Supervisor reads the roadmap and decisions, sizes the next issue to the turn
   budget, and opens it as `status:ready` — or as `decision-needed` if it touches a Decision
   Gate (see [`AUTONOMY.md`](AUTONOMY.md)).
2. **Implement.** The Builder opens a PR first, pushes incrementally, and marks the roadmap
   line in the same PR. If the session dies at the turn ceiling, the exit guard-rail
   re-dispatches the same PR, up to a capped number of retries; past that, it's flagged
   `needs-human`. If the task turns out to hit a Decision Gate mid-flight, the PR becomes
   `[BLOCKED]`.
3. **Judge (in parallel).** `ci.yml` runs deterministically; Reviewer and Security judge the
   **diff** (never the runner's disk) and publish through a non-AI step. Red CI wakes the
   Fixer, which corrects and pushes — and never marks its own delivery complete.
4. **Verdict.** Green CI on a PR still labeled `delivery:incomplete` wakes the Verdict role,
   which compares the PR against the issue's acceptance criteria and either flips the label to
   `delivery:complete` or comments what's missing.
5. **Merge and publish.** You review and merge — branch protection is on. A push to the
   default branch deploys the product per its active profile.

## Non-AI guard-rails

Every guard-rail below is enforced by a plain workflow step, never by an agent's judgment —
"an agent decided the check passed" is exactly the failure mode these close. The `D-xxx`
labels are this repo's own reference tags for the guard-rail *mechanism*, not a claim that the
origin project's decision numbering carries over (it doesn't — see `DECISIONS.md`, D-001).

| Guard-rail | What it enforces | The lesson it encodes |
|---|---|---|
| **D-019 — exit contract** | The Builder must end a session in exactly one of three states — a PR referencing the issue, a `decision-needed` issue, or an explanatory comment — never silent "success" with zero artifact. A workflow step checks this with plain `gh` calls; there is no fourth, implicit outcome. | A role that can finish a job with nothing to show for it eventually will, and a green run is not evidence anything was produced — only a checked artifact is. |
| **D-033 — judge integrity** | Before the Reviewer, Security, or Verdict role runs, the agent's own config (`CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `.claude/`) is restored from the base branch, overwriting whatever the PR under review shipped. | A PR is attacker-controlled input to whoever reviews it. If the reviewer's own instructions can come from the branch being reviewed, the review is not independent — it's asking the suspect to write the verdict form. |
| **D-034 — non-AI publication** | Roles that only report (Reviewer, Security, Verdict, the daily report) cannot call `gh pr comment` / `gh issue` themselves. They write their verdict to a file; a plain, non-AI workflow step publishes it. | A denylist over a free-form shell never closes the channel — there is always another way to emit the same bytes (a different flag, a subshell, an escaped call). An allow-list that removes the *capability* does. |
| **D-037 — fail-closed on the publish step itself** | The publish step *is* the guard-rail: either the label flips, or a verdict file exists and gets published, or the job fails. No separate check infers success by looking for a comment from a specific actor. | Any control that identifies success by checking *who* posted a comment breaks the moment something upstream changes *who* posts — and that break is invisible until the day it matters. When a change swaps who performs an action, every actor-identifying control has to be revisited in the same change. |
| **D-042 — diff over disk** | The Reviewer and Security prompts state explicitly: the source of truth is `gh pr diff` / `git show <sha>:<path>`, never a raw read of the runner's working tree — because D-033 deliberately makes the tree diverge from the PR on config paths. A guard-rail step diffs the workspace against the known-divergent baseline and flags anything unexplained. | A judge that reads the disk instead of the diff can produce an **inverted verdict** — reporting that a PR removes exactly what it adds — the moment something upstream makes disk and diff differ on purpose. If two mechanisms can disagree about the state of the world, name which one is truth, in the prompt, not just in your head. |
| **D-047 — turn-cap re-entry** | A Builder session that dies at the turn ceiling with an open, incomplete PR is not a dead end: the exit guard-rail re-dispatches `implement.yml` at the same PR, up to a capped number of retries, tracked in an auditable label. Past the cap, the PR is flagged for a human, never silently dropped. | Raising the turn ceiling doesn't fix a session that needed more turns than any reasonable ceiling allows — it just makes failure more expensive. What fixes it is treating the ceiling as a checkpoint the work survives, which only works if the in-progress state is pushed early and often. |
| **D-087 — idempotent round-counting, dual-pass verdict** | A round counter derived by **counting a set** (distinct commits already judged) instead of incrementing on every trigger, so two concurrent runs on the same commit compute the same round without racing. Design-review-style verdicts run as **two independent passes with an identical prompt**; the union is fail-closed — one dissenting pass is enough to fail, consensus is never required. | A counter that increments on every trigger double-counts the moment a workflow has more than one legitimate trigger for the same event — fix the race by making the operation idempotent, not by adding a lock. And a single review pass only samples the contract once; a real defect a first pass misses does not stop being a defect. |
| **D-039 — fork gate** | Privileged workflows check `head_repository == repository` before running anything. A PR from a fork never gets write credentials, network access, or an AI role acting on its behalf. | A public repository accepts PRs from anyone. Any workflow with write permissions or a paid API key attached is a target the moment forking is possible, regardless of how unlikely an attack seems today. |
| **D-032 — credential hygiene** | The embedded git credential is stripped from `.git/config` (`git config --unset-all http.<url>.extraheader`) before any step that gives a broad-read agent shell access to the filesystem. | An agent with `Bash(cat:*)` and a token sitting in a config file it can read is a leak waiting for the right prompt, not a hypothetical. Removing the *read path* is cheaper than trusting every future prompt to know not to look. |

## FU/D glossary

- **D-xxx** — a numbered decision recorded in `DECISIONS.md`. Sequential, own numbering per
  repo, never renumbered or reused. Records *why* something is built the way it is.
- **FU-xx** — a numbered follow-up: a scoped remediation item opened after a review or an
  incident, tracked until it's closed. An FU is "we found a defect, here is the fix, tracked
  to closure" — distinct from a Decision Gate, which is "this needs a call only a human can
  make." The origin project's specific FU numbers are not ported; where an FU held a lesson
  worth keeping, it is captured above as a guard-rail or below as an operating lesson, without
  the original issue number.

## Operating lessons

These are hard-won, not aspirational — each one cost real turns and real API spend to learn.

- **Scoreboard before dispatch.** Whenever a session is going to be re-dispatched at an
  existing PR — after a turn-cap death, after a failure, after any re-entry — the real state
  of the diff must be written to the PR's checklist (`- [ ] `/`- [x]`) **before** the next
  session starts, never left for the next session to re-derive. A session that resumes against
  a stale scoreboard re-does work it already finished and can die at the same ceiling for the
  same reason, twice. Measured as the single strongest cost lever available, and it costs
  nothing to apply.
- **Explicit turn budget.** Every prompt that states a turn ceiling has to state the *actual*
  ceiling configured on the workflow, not a stale number left over from an earlier tuning
  pass — an agent that budgets against a number that doesn't match its real ceiling either
  wastes turns being too conservative or runs out having planned for more room than it had.
  When a workflow's allow-list is pruned, the prompt has to say what's left, or the agent burns
  turns discovering the removal by trial and error.
- **Measure before fixing caps.** A turn or cost ceiling that gets raised on one workflow
  because it overflowed once is a symptom fix, not a class fix — the same defect usually exists
  on every workflow with the same allow-list shape, and it will resurface on the next one, in
  production, unmeasured. Before changing a cap, check every workflow with a comparable prompt
  and allow-list for the same exposure, and raise them together with the evidence written down
  — not just the one that happened to break first.
- **PoC before platform choice.** A platform decision that depends on an unverified capability
  (a runtime limit, a headless-browser constraint, an execution-time cap) is conditioned on a
  short, live proof of concept run in the *real* target environment before the rest of the
  system commits to it — official documentation is not a substitute for a live probe, and a
  documented limit can still fail in practice for a reason the docs don't cover. When the PoC
  fails, the fallback candidate is already named, so the failure is a redirect, not a stall.
