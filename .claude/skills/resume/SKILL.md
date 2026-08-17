---
description: Resumes the factory — re-enables the autonomous workflows paused by /pause. Usage: /resume
---

You're going to resume the factory.

## Steps
1. `gh workflow enable supervisor.yml`
2. `gh workflow enable implement.yml`
3. `gh workflow enable daily-report.yml`
4. Confirm with `gh workflow list` and report each one's state.

## Note
Once resumed, the Supervisor starts creating issues again at the **next cron slot**. To
trigger it immediately, run the Supervisor via `workflow_dispatch` (the "Run workflow" button
in the Actions tab).
