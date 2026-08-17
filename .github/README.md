# .github/

## Contract

`.github/` holds the deterministic CI/CD scaffolding: `scripts/` (non-AI gates),
`workflows/` (the coreography of the Generation/Maintenance regimes), and issue
templates. Like `.claude/`, this is factory material — **immutable per project**,
evolved only through a deliberate factory upgrade, never as a side effect of
product work.

## Layout

| Directory | Purpose |
|---|---|
| `scripts/` | Deterministic, non-AI gate scripts run by CI (language gate, boundary gate, and — in later sessions — design/visual-evidence gates). |
| `workflows/` | The GitHub Actions coreography: CI plus the role workflows (implement, review, security, verdict, fix, ...). |
