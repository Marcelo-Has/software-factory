# Milestone Verification — human checklist

The human mirror of the D-014 bundle: the checks a milestone's PR crosses before human merge.
Nothing here is new work beyond what `.github/workflows/ci.yml`, `design-critic.yml`,
`security.yml`, and `verdict.yml` already run — this checklist exists so the bundle is legible
without opening five workflow runs, in the same order D-014 states them. Never a visual-only
sign-off (D-3.4): a milestone with green `design-critic` but no green CI, or green CI but no
`verdict`, is not verified.

## 1. Deterministic CI

- [ ] `english-only`, `boundary-check`, `factory-tests`, `contract-gates` are green.
- [ ] `product-lint`, `product-test`, `product-build` are green.
- [ ] `product-behaviors` is green (see §2 — this is the same job, called out separately
      because it's the DP-3 execution half, not just another lint/build step).

*Job: `.github/workflows/ci.yml`.*

## 2. Behaviors (DP-3 execution, DECISIONS.md D-013)

- [ ] `gate-behavior-mirror.mjs` reports full mirror coverage — no `mirror-missing`,
      `scenario-uncovered`, `mirror-comment-orphan`, or `mirror-placeholder` findings.
- [ ] The mirrored scenarios actually ran and passed (the backend module's resolved `test`
      command, executed by the same job after the coverage gate).
- [ ] Every integration's five mandatory classes (`@happy`, `@duplicate`,
      `@external-failure`, `@invalid`, `@unauthorized`) are green, not just present.

*Job: `product-behaviors` in `.github/workflows/ci.yml`.*

## 3. Design-critic

- [ ] The dual-pass verdict (Pass A + Pass B, `design-critic.yml`) is `APPROVED`, judged
      against `screenshots.yml`'s deploy-preview evidence — never skipped for a milestone that
      touches any screen.

*Job: `.github/workflows/design-critic.yml`.*

## 4. Security

- [ ] `security.yml` is green: gitleaks, `npm audit`, and the idempotency/NFR review rubric
      (EVP2) all clear.

*Job: `.github/workflows/security.yml`.*

## 5. Verdict

- [ ] `verdict.yml` judges the milestone issue's acceptance criteria (from
      `project/docs/milestones.yaml`) as met — not `incomplete`.

*Job: `.github/workflows/verdict.yml`.*

## 6. Merge

- [ ] All five sections above are green/approved before the human merges the milestone PR
      into its base branch. No merge on CI alone, and no merge on design-critic alone —
      the bundle is the gate, not any single member of it.
