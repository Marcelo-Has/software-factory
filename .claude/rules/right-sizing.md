# Right-sizing — quality without over-engineering

Principle: build for the **current phase** and the **real risk**. Quality that matters =
correctness, real user data security, and expensive-to-reverse decisions. Excess = polishing
what has no user, no data, or is cheap to add later.

## The filter for ANY finding or improvement idea

1. Does it affect **correctness** or **real data security**, in what's being delivered NOW?
   → do it.
2. Is it **expensive to reverse** later (architecture, data model, a near-irreversible
   commitment)? → do it.
3. Neither? → **defer or drop it.** Don't build it now.

## For implementers (developer-lead)

- **YAGNI:** deliver the issue's definition of done, not hypothetical futures.
- No new abstraction/layer without a **second concrete use**.
- **Prefer framework defaults**; don't restructure the standard pattern to satisfy a nitpick.
- Small PR, focused on the issue's scope. Found something out of scope? **Don't do it in the
  same PR** — record it as a suggestion/issue; don't bloat the PR.

## For reviewers (review and security)

- Classify every finding by **severity AND by phase**: is it a blocker for what's being
  delivered, or a future improvement?
- Explicitly mark LOW/INFO and **hypothetical** risks (no current attack surface) as
  **"DEFER — don't act now."** Don't turn them into immediate work.
- **Don't propose** hardening, abstraction, or coverage that isn't tied to a requirement of
  the current phase. A heads-up for the future is welcome, but label it as such.
- The **security baseline** for the current phase's issues (BaaS rules, signed URLs, input
  validation, verified webhooks) is **not "excess"** — it stays mandatory.

## Routing

- A LOW/INFO hardening/polish finding **goes to the hardening-phase backlog**, it does
  **not** become `status:ready`. Only open an issue when you're actually going to act on it.
- When in doubt between "do it now" and "defer": **defer** and note it. It's cheaper to add
  later than to remove premature complexity.
