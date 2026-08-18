# nfr.md — Ledgerline

> Example artifact for `factory/templates/nfr-template.md`. See the note in
> `factory/templates/examples/ledgerline/PRODUCT.md` — never copy this content into a real
> product's `nfr.md`. `operationId`s here match the candidates named in `ARCHITECTURE.md` §4.

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `approved` |
| **Date** | 2026-08-18 |
| **Approved by** | Ledgerline's owner |
| **Depends on** | `ARCHITECTURE.md`, `DATA-MODEL.md` |
| **Has own endpoints?** | yes |

---

## 1. Authorization matrix — route x role

| `operationId` | Route | `owner` | `member` | Unauthenticated |
| --- | --- | --- | --- | --- |
| `listInvoices` | GET /invoices | allow | allow | deny |
| `createInvoice` | POST /invoices | allow | allow | deny |
| `getInvoice` | GET /invoices/:id | allow | allow | deny |
| `updateInvoice` | PATCH /invoices/:id | allow | allow, only while `status = draft` | deny |
| `sendInvoice` | POST /invoices/:id/send | allow | allow | deny |
| `handlePaymentWebhook` | POST /webhooks/payments | n/a | n/a | allow, signature-verified (ADR-1) |
| `getAccountSettings` | GET /account | allow | allow, read-only | deny |
| `updateAccountSettings` | PATCH /account | allow | deny | deny |
| `getSubscription` | GET /subscription | allow | allow, read-only | deny |
| `upgradeSubscription` | POST /subscription/upgrade | allow | deny | deny |
| `cancelSubscription` | POST /subscription/cancel | allow | deny | deny |

---

## 2. Validation rules

| Field / input | Rule | Where enforced |
| --- | --- | --- |
| `Invoice.currency` | must be a valid ISO 4217 three-letter code | server |
| `Invoice.due_date` | must be today or a future date at creation time | server |
| `InvoiceLineItem.quantity` | must be greater than 0 | client and server |
| `InvoiceLineItem.unit_price` | must be greater than or equal to 0 | client and server |
| `Client.email` | must be a syntactically valid email address | client and server |

---

## 3. Idempotency

| `operationId` | Idempotency key | What counts as a duplicate | Behavior on duplicate |
| --- | --- | --- | --- |
| `handlePaymentWebhook` | `external_event_id` (from the payment provider's payload) | A `PaymentEvent` already exists with the same `external_event_id` | Return success without re-applying the invoice/subscription state change — the first delivery is authoritative |

**Operations that do NOT require idempotency, and why:** the authenticated CRUD routes
(`createInvoice`, `updateInvoice`, `sendInvoice`, `upgradeSubscription`, `cancelSubscription`)
are called directly by a logged-in user's client, not retried by an untrusted third party —
an accidental double-click is a UI-level concern (disable the button while the request is in
flight), not a server-side idempotency requirement. Only `handlePaymentWebhook` sits behind a
boundary where the caller (the external payment provider) is expected to retry deliveries.

---

## 4. Rate limits

| `operationId` | Limit | Scope (per user / per IP / per account) | Behavior over limit |
| --- | --- | --- | --- |
| `sendInvoice` | 30 sends per hour | per account | 429 with `retry-after`; the invoice stays `draft` |

---

## 5. Error handling — external and internal failure paths

Every error response returns a generic, user-facing message and an internal error id for
support lookup — never a stack trace, an internal file path, or another client's data. The
payment webhook specifically: a signature-verification failure returns a generic `400` and
logs the failure internally, without echoing the received payload back in the response body.

---

## 6. Open assumptions

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| 30 sends/hour is a generous-enough limit for a legitimate small agency | No real usage data exists yet for this fictional product | If wrong, a busy agency could be throttled during a legitimate batch-send; the fix is a limit increase, not a redesign |
