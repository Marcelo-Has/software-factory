# bench/ — the factory's evaluation harness

**What it is:** the set of scenarios, rubrics, and collection sheets used to **measure the
factory** — not the product it builds. Each scenario is a realistic task the factory runs end
to end (issue → developer-lead → PR → CI → reviews → verdict) while a human clocks it, counts
turns, measures cost, and scores the result.

**What it's for:** having a **baseline** number before changing the factory, and the same
number after. Without it, every process change (prompt, workflow, rule, agent) is opinion.
The documentary pair is `factory/docs/INVENTORY.md` (the structural "before"); the bench is the
**performance** "before".

**What the bench is NOT:** it is not the product, it never enters `project/docs/ROADMAP.md`,
and nothing it produces is merged. It's a measurement instrument.

---

## Principles

1. **Repeatable.** Scenarios are versioned here, with the issue's exact text. Running the same
   scenario again months later has to produce a fair comparison, not a new task.
2. **Few scenarios (≤ 6).** Covering different dimensions is worth more than covering volume.
   Today there are five: C1 (well-specified backend), C2 (frontend/design), C3 (bug fix), C4
   (Decision Gate trap), C5 (ambiguity trap).
3. **Cost measured per round.** Each scenario records US$ and turn count in `collection.md`. A
   factory that gets it right while spending 4x more hasn't improved.
4. **Trap scenarios measure what the factory must NOT do.** C4 and C5 are failed by
   *delivering*. A factory that implements everything it's asked is a factory that will
   implement the wrong thing when the request is dangerous — data retention, pricing, an
   irreversible commitment.
5. **Bench PRs are NEVER merged.** No scenario code enters `main`. The value is in the
   transcript, not the diff.
6. **Right-sizing applies here too** (`.claude/rules/right-sizing.md`): the harness is a
   spreadsheet and markdown. Don't build measurement tooling before there's something to
   measure.

---

## Execution protocol

- **Controlled trigger, one scenario at a time, by the owner.** The factory stays dormant
  between scenarios (`/pause`). Running two in parallel contaminates the cost measurement and
  scrambles the Actions runs.
- **US$10 cutoff per scenario.** If it's exceeded, stop, note where it stopped, and score what
  happened — the overrun is itself the result.
- **No helping midway.** Every human intervention is recorded in `collection.md` and lowers the
  Autonomy score. If you had to explain something to the agent, that's the finding.
- **At the end of each scenario:** export the transcript (an Actions artifact, 7-day
  retention — download it before it expires), fill in `collection.md`, score by `rubrics.md`.
- **Closing:** bench PRs **closed without merging**, `bench/*` branches deleted, `[BENCH-*]`
  issues closed. What remains is the record in `collection.md` and the notes.

## Suggested order

**C1 → C4 → C5 → C3 → C2.**

Start with the well-specified happy path (C1) to confirm the factory is up and running; then
the two traps (C4, C5), which are cheap and say more about the process than about the code;
then the planted bug (C3), which needs branch prep; and last C2, the most expensive one and the
only one with a design evaluation.

## Files

| File | What it holds |
| --- | --- |
| `scenarios/C1-catalog-page.md` | Well-specified backend: a public catalog endpoint. |
| `scenarios/C2-explainer-page.md` | Frontend/design: an explainer page. |
| `scenarios/C3-planted-bug.md` | The planted-bug protocol — measures `fix.yml`. |
| `scenarios/C4-gate-trap.md` | Decision Gate trap (irreversible data action). |
| `scenarios/C5-ambiguous-spec.md` | Ambiguity trap (a deliberately vague issue) — asserts the F1 clause. |
| `rubrics.md` | The 0–4 scale, dimensions, and weights. |
| `collection.md` | The checklist of what to record on each round. |

## Instantiating a run

The scenarios below are templates ported from the origin project's own bench, generalized: any
concrete product reference has been replaced with "example from the origin project" or left as
a placeholder the owner fills in for the product currently being built. Before triggering a
round, copy the issue body into a real issue in the product's repository, fill in the
placeholders, and apply the label (or open the PR, for C3) to start the clock.
