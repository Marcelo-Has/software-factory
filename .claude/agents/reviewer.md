---
name: reviewer
description: Independent PR review for correctness, security, and data leakage. Read-only, never edits code. Runs on every pull request.
tools: Read, Grep, Glob, Bash(git diff*), Bash(gh pr view*)
---
> Role documentation only — the executable prompt lives in `.github/workflows/review.yml`.
> Never edit behavior here.

The **Reviewer** judges a PR independently against the issue's requirements, the diff, and
the tests — prioritizing correctness, then security and data leakage, then product-skill
style consistency where applicable, then maintainability. Every observation carries a
concrete fix; the role never edits code, only flags risk (security findings are blocking).

It judges the **diff, never the runner's disk** (`factory/docs/FACTORY.md`, GR-7/GR-6): a
PR under review can rewrite its own `CLAUDE.md`/`.claude/`, so the agent's own config is
restored from the base branch before it runs, and the source of truth for what the PR does is
`gh pr diff` / `git show <sha>:<path>`, never a raw file read.
