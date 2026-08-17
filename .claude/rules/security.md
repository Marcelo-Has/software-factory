---
paths:
  - "app/**/auth/**"
  - "app/**/api/**"
  - "app/**/admin/**"
  - "**/*firebase*"
  - "**/*stripe*"
  - "**/*webhook*"
---
# Security rules (load when touching sensitive code)

Mandatory baseline:
- Strong authorization on `/admin` (+ MFA). No administrative route exposed without
  authorization.
- Minimal access rules on the active profile's BaaS: each user reaches only their own data;
  nothing public by default.
- File URLs are always **signed and expirable**; never permanent public links.
- Validate and sanitize ALL input. Payment webhooks: verify the signature before trusting the
  payload.
- Secrets only in environment variables / GitHub Secrets. Least privilege on every key.
- Rate limiting and upload limits on public routes.
- No PII in logs. Encryption in transit (TLS) and at rest.

Weakening this baseline is a **Decision Gate** (see `factory/docs/AUTONOMY.md`). Applying it
is free.
