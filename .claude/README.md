# .claude/

## Contract

`.claude/` holds Claude Code configuration for this repo: settings, native
subagents (`agents/`), rules, and skills. It is factory material — **immutable per
project**, evolved only through a deliberate factory upgrade, never as a side effect
of product work — even though it lives at the repo root for tooling reasons.

Content: `settings.json` (hooks, permissions), 9 native subagents under `agents/`
(`developer-lead`, `developer-frontend`, `developer-backend`, and `design-director` are
executable contracts; `reviewer`, `verdict`, `refiner`, `supervisor`, and `design-critic`
are role-card documentation — their executable prompt lives inline in the matching
`.github/workflows/*.yml`, per D-002), 4 `rules/` (load by path), and 8 `skills/`.
