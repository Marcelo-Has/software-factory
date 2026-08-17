---
description: Pauses the factory — turns off the workflows that act on their own, without deleting anything. Usage: /pause
---

You're going to pause the factory so **nothing runs autonomously**.

## Steps
1. `gh workflow disable supervisor.yml`   (stops creating issues on the cron)
2. `gh workflow disable implement.yml`     (stops implementing even if status:ready appears)
3. `gh workflow disable daily-report.yml`  (stops the scheduled report)
4. Confirm with `gh workflow list` and report each one's state.

## Notes
- `ci`, `review`, `security`, and `fix` stay on, but they're **passive** — they only run when
  YOU open/update a PR. That's intentional.
- Nothing is deleted; reverting is `/resume`.
