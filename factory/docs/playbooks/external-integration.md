# Playbook — external integration

> **Scope:** cross-cutting modifier, DP-3 (the logical/integration axis, DECISIONS.md D-007)
> — symmetric to how `mobile.md` modifies a visual category. This playbook doesn't pick, and
> never overrides, an interface category from `factory/docs/playbooks/README.md`'s table; it
> **combines** with whichever one applies, the moment a product declares any external
> integration in `project/docs/contracts/integrations.yaml`.
> **State:** complete.
>
> **What this is.** The Definition-phase **strategy** for any feature that crosses a system
> boundary: where `/define-spec` and `/define-architecture` spend their effort, what
> `gate-contracts.mjs` checks mechanically, and the five scenario classes every integration
> ships behavior coverage for.
>
> **What this is NOT.** Not a visual-design playbook — it has no opinion on layout, density,
> or `design-critic`'s rubric; see the primary category's own playbook for that. And never a
> concrete integration: no vendor name, no vendor-specific request/response shape, no
> credential. The D-3.7 genericity rule (DECISIONS.md D-007) draws that line in the core, not
> just in this file.

---

## 1. Where Definition effort focuses

An external integration is a boundary the product doesn't control. The Definition phase's
job is to decide, on paper, what happens on both sides of that boundary **before**
`/define-architecture` writes `contracts/openapi.yaml` and `contracts/integrations.yaml` —
not to discover it mid-implementation.

### 1.1 Webhooks are the default inbound shape

Most external integrations report back asynchronously — a payment clears, an email bounces,
a shipment updates — after the product's own request already returned. The Definition phase
fixes, for every such event:

- **The endpoint that receives it**, by `operationId`, declared in `contracts/openapi.yaml`
  under `integrations.yaml`'s `webhooks` list for that integration (DECISIONS.md D-009 §2).
- **How the caller is trusted.** A webhook is called by a machine, not a logged-in user — its
  `security` scheme in `openapi.yaml` is signature-verified, never the same scheme the rest
  of the API uses for authenticated users. That's a deliberate, explicit exception, recorded
  in `nfr.md`'s authorization matrix — never a silent gap in it.
- **Never polling as the default.** Polling for status is a fallback for a provider kind with
  no webhook support, decided and justified in an ADR (`ARCHITECTURE.md`) — not the
  unexamined default.

### 1.2 Idempotency is a Definition-phase decision, not an implementation detail

Every integration's `integrations.yaml` entry declares an `idempotency_key` — the field or
header the handler uses to recognize "I've already applied this." Deciding this at Definition
time forces the question every integration needs answered before code exists: **what counts
as a duplicate, and what happens when one arrives.** `nfr.md` §3 carries the same decision in
prose, keyed by `operationId`, so a route's idempotency behavior is never only implicit in a
test.

### 1.3 Authorization at the boundary

Two authorization questions, and they are not the same question:

- **Who can trigger this integration from inside the product** (a user calling
  `upgradeSubscription`, say) — an ordinary row in `nfr.md`'s route x role matrix.
- **Who — or what — can call back in** (the webhook) — see §1.1. Getting this one wrong in
  either direction is a real defect: too loose accepts a forged event; too strict drops a
  legitimate one silently.

### 1.4 Error states, named and legible

An external dependency fails in ways the product's own code never does: timeout, malformed
payload, a valid-but-unexpected event type, a sandbox that behaves differently from
production. Definition fixes the **shape** of that failure — a named error state
(`nfr.md` §5), never a raw provider error surfaced to the end user, and never a state left
half-applied (an invoice marked `sent` when the send itself failed partway).

### 1.5 Extra caution where money or sensitive data crosses the boundary

Payment, billing, and personal-data integrations raise the floor, not just the emphasis:

- **No amount, balance, or currency value trusted from a webhook payload without
  cross-checking it against the product's own record of what was expected** — a payload is
  evidence an event happened, not a number to post blindly.
- **Logical secret names only**, never a value, in `integrations.yaml` — the product's actual
  credentials live in its own runtime config/secret store, never in tracked history
  (DECISIONS.md D-007, the D-3.7 genericity rule).
- **`nfr.md` §5's "no stack trace, no PII" rule applies with zero exceptions** to any error
  path touching a payment or personal-data integration — this is exactly what
  `.github/workflows/security.yml`'s inline rubric checks for (DECISIONS.md D-009 /
  plan §0.4).

---

## 2. The five mandatory scenario classes, and why each exists

DECISIONS.md D-007: whenever a product has an integration, every feature that crosses that
boundary ships `behaviors/*.feature` coverage for **all five**, not just the happy path.
`gate-contracts.mjs` (EVP3) enforces this per integration.

| Class | Tag | Why it's mandatory |
| --- | --- | --- |
| Happy path | `@happy` | The integration has to be shown actually working — the floor every other class sits above. |
| Duplicate / idempotency | `@duplicate` | Third-party callers retry. Without a proven no-op on a repeat delivery, "idempotency key" in `integrations.yaml` is a field nobody checked. |
| External failure | `@external-failure` | The dependency you don't control WILL fail sometime — timeout, error, malformed payload. An integration only ever exercised against a happy provider hides its worst-case behavior until production. |
| Invalid input | `@invalid` | Boundary code amplifies bad input — into a bad charge, a bad state transition, a bad record. Rejecting it with a specific reason is cheaper to prove at Definition time than to firefight later. |
| Unauthorized | `@unauthorized` | The boundary is the seam most likely to have an authorization gap, because two different trust models meet there (§1.3). Proving the deny path closes that seam on paper before it's ever open in code. |

A scenario tagged `@integration:<I-id>` with no matching `@duplicate` (or any of the other
four) is exactly what `gate-contracts.mjs`'s coverage check is built to catch — this table is
also what a reviewer reads to know *why* the gate is asking for it, not just that it is.

---

## 3. Right-sizing: no integration, no cost

Per the factory's right-sizing rule (`.claude/rules/right-sizing.md`) and DECISIONS.md D-007 /
D-3.7: a product with no external integration ships `contracts/integrations.yaml` with an
empty `integrations: []` list. That is a **complete, valid D3 artifact**, not an unfinished
one — the logical axis costs this product nothing further downstream: no mandatory scenario
classes, no webhook route, no extra `nfr.md` idempotency row. This playbook has nothing to
say about a product that never crosses a boundary, and that absence is itself the correct
outcome, not a gap to fill preemptively.

The moment a product's `SPEC.md` marks any feature "crosses a system boundary: yes," this
playbook applies to that feature — and only that feature; a product can have some features
that cross a boundary and others that don't, and this playbook's floor never leaks onto the
ones that don't.

---

## 4. Filled example — Ledgerline Pro's "update subscription" flow

Cited as an example only — never copy this content into a real product's artifacts. The full
cross-linked example lives in `factory/templates/examples/ledgerline/`.

Ledgerline (a small fictional invoicing product, `factory/templates/examples/ledgerline/`)
has exactly one external integration: an abstract payment provider, `I-payments`
(`contracts/integrations.yaml`), used both for per-invoice payment links and for Pro
subscription billing. The subscription-update flow (F-5, "manage the Pro subscription")
walks every layer this playbook talks about:

- **Webhook (§1.1):** `handlePaymentWebhook` (`POST /webhooks/payments` in `openapi.yaml`)
  receives `subscription.updated` and `subscription.canceled` events; its `security` scheme
  is `webhookSignature`, distinct from the `bearerAuth` scheme every user-facing route uses.
- **Idempotency (§1.2):** `integrations.yaml`'s `I-payments` entry declares
  `idempotency_key: external_event_id`; `nfr.md` §3 states the same rule in prose — a repeat
  delivery of an already-applied event id is a no-op, the first delivery stays authoritative.
- **Authorization (§1.3):** `upgradeSubscription` and `cancelSubscription` are owner-only in
  `nfr.md`'s route x role matrix; a `member` calling either is denied — see the
  `@unauthorized` scenario below.
- **Error states (§1.4, §1.5):** a payment-provider timeout during an upgrade attempt leaves
  the account on its prior plan, never a partial upgrade; the response never echoes the
  provider's raw error back to the caller.
- **The five classes**, in `factory/templates/examples/ledgerline/billing-update-plan.feature`:
  `@happy` (owner upgrades to Pro), `@duplicate` (a repeated `subscription.updated` event is
  a no-op), `@external-failure` (the provider times out mid-upgrade), `@invalid` (canceling a
  subscription that's already on the Free plan is rejected), `@unauthorized` (a `member`
  cannot call `upgradeSubscription`).

Reading that one `.feature` file alongside `contracts/integrations.yaml`'s `I-payments` entry
and `nfr.md` §1/§3 is the fastest way to see every section of this playbook applied to one
real, small, coherent flow.

---

## 5. What this playbook doesn't decide

- **Concrete provider identity, request/response shapes, or credentials.** The D-3.7
  genericity rule: generic integration concepts belong in the core; a specific vendor's API
  never does. `integrations.yaml`'s `kind` field stays abstract (`"payment provider"`, never
  a vendor name) in every product, not only in this example.
- **The mock-first functional gate's execution.** Declared here and in
  `factory/profiles/PROFILES.md` (`behaviors.mock`), but the harness that actually runs the
  mirrored tests in CI is EVP3 — a **closed decision, not reopened by this playbook**
  (DECISIONS.md D-007). A real sandbox smoke test against a live provider stays opt-in per
  profile, never the default.
- **Visual treatment of an error, loading, or empty state caused by an integration.** That's
  the primary interface category's playbook and the project's own `DESIGN.md` — this playbook
  only fixes that the state exists and is named, not how it looks.
- **New AI agents for this axis.** Per D-3.5 (DECISIONS.md D-007): DP-3 is served by
  templates, gates, and skills, the same non-AI-first posture as DP-2.

---

## Who reads this, and when

- **`/define-spec`** (D2): reads this playbook the moment a feature's "crosses a system
  boundary" answer is "yes," to know what `behaviors/*.feature` coverage that flow will need
  once `contracts/openapi.yaml` exists to tag against (`SPEC-template.md` §1).
- **`/define-architecture`** (D3): applies §1's emphases while drafting
  `contracts/openapi.yaml`, `contracts/integrations.yaml`, and the idempotency/authorization
  rows of `nfr.md`.
- **`developer-backend`**, during Generation/Maintenance: implements the webhook handler and
  its idempotency check against `nfr.md` and `integrations.yaml`, and covers the five classes
  in the mirrored test per `factory/profiles/PROFILES.md`'s `behaviors` contract.
- **`gate-contracts.mjs`** (EVP3): the mechanical enforcement of §2's coverage table and
  §1.1/§1.2's webhook/idempotency declarations.
