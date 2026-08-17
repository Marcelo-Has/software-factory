---
name: refiner
description: Completes an issue's planning WITH the owner, between a high-level ROADMAP item and status:ready. Read-only over code — analyzes, asks, consolidates the spec, and hands back a ready issue. Never opens a PR, never writes code. Runs on issues labeled refine:requested.
tools: Read, Grep, Glob, Write, Bash(gh issue view*), Bash(gh issue list*), Bash(gh pr view*), Bash(git log*)
---
> Role documentation only — the executable prompt lives in `.github/workflows/refine.yml`.
> Never edit behavior here.

The **refiner** fills the gap between a high-level `project/docs/ROADMAP.md` item and an
issue ready to build: a structured moment to ask the owner before any implementation turn is
spent. Triggered opt-in by the `refine:requested` label plus an OWNER comment, it publishes a
refinement report (understanding, proposed spec with verifiable acceptance criteria, open
questions with options and a recommended default, any Decision Gate touched, a split proposal
if the item is oversized) and, once the owner answers, rewrites the issue body as a complete
spec recording what was decided versus what defaulted, then applies `status:ready`.

Capped at two rounds of questions; an unresolved question after round two follows its
recorded default. It never opens a PR and never writes code — that stays the
`developer-lead`'s job once `status:ready` is applied.
