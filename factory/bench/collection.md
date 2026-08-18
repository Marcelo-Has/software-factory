# collection.md — what to record on each round

One sheet per scenario, filled in **during** the run (not from memory, afterward). Copy the
block below for each round. Whatever isn't recorded at the time is gone: the Actions transcript
expires in **7 days**.

---

## Scenario sheet

**Scenario:** C_ · **Round:** _ · **Date:** ____-__-__ · **Issue/PR:** #__ / #__
**Baseline or post-change:** ____ (if post-change, which factory change is being measured)

### Workflows

One row per triggered run, in the order they happened.

| Workflow | Run ID | Conclusion | Duration | Note |
| --- | --- | --- | --- | --- |
| `implement` / `fix` | | | | |
| `ci` | | | | |
| `review` | | | | |
| `security` | | | | |
| `verdict` | | | | |

`gh run list --limit 20` for the IDs; `gh run view <id>` for the conclusion. Record **every**
run, including cancelled and re-dispatched ones — a run cancelled by concurrency and a
re-entry are signal, not noise.

### Agent

- **Number of turns** (transcript — the run's artifact, download before the 7 days): ____
- **Cost US$** (same transcript / run summary): ____ · **US$10 cutoff exceeded?** ☐
- **Permission denials** (which tools, how many times): ____
- **Re-entries** (did the same workflow run again? why?): ____
- **`error_max_turns` / dead run**: ____
- **Total wall-clock time** (from trigger to outcome): ____

### Human interventions

One line per intervention, with what was done and why. **Zero interventions is the target** —
every line here lowers the Autonomy score.

| # | Moment | What the human did | Why it was necessary |
| --- | --- | --- | --- |
| | | | |

### Outcome

- ☐ PR opened · ☐ `decision-needed` · ☐ comment on the issue · ☐ **silence** (none of the three)
- Guard-rails triggered (exit contract in `implement`, review gates in `review`/`security`,
  fix guard-rail in `fix`): ____
- Was `project/docs/ROADMAP.md` touched? ☐ (it shouldn't be — the bench isn't the product)
- Links: transcript saved at ____ · verdict ____

### Scores (see `rubrics.md`)

| Dimension | Weight | Score | Evidence (link/file/line) |
| --- | --- | --- | --- |
| Correctness | 3 | | |
| Code quality | 2 | | |
| Tests | 2 | | |
| Context adherence | 3 | | |
| Autonomy | 3 | | |
| Frontend/design (C2 only) | 3 | | |
| Factory process | 2 | | |
| Cost/efficiency | 1 | | |
| **Final (weighted average)** | | | |

**C4 / C5:** GOT IT RIGHT ☐ / GOT IT WRONG ☐ · quality of the stop: __/4 · justification: ____

### Closing

- ☐ PR closed **without merge** · ☐ branch deleted · ☐ issue closed · ☐ transcript downloaded

---

## C2 extra requirement (frontend/design)

Without this evidence, the design score is capped at 2 (`rubrics.md`).

- **Deploy preview URL** (in the PR): ____
- **axe-core** — run against the preview URL; attach the report. Serious/critical violations:
  ____
- **Lighthouse** — accessibility: ____ (prerequisite ≥ 90) · performance: ____
- **Screenshots at 375 / 768 / 1280 px** — save all three, from the same round:
  - ☐ 375 (mobile) · ☐ 768 (tablet) · ☐ 1280 (desktop)
- Composition notes (what pulled the score up or down): ____

---

## Round rollup

Fill in when a complete round closes, so the before/after comparison fits on one screen.

| Round | Date | C1 | C2 | C3 | C4 | C5 | Total US$ | Interventions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | | | | | | | | |
