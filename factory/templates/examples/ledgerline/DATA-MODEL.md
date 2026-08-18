# DATA-MODEL.md — Ledgerline

> Example artifact for `factory/templates/DATA-MODEL-template.md`. See the note in
> `factory/templates/examples/ledgerline/PRODUCT.md` — never copy this content into a real
> product's `DATA-MODEL.md`.

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `approved` |
| **Date** | 2026-08-18 |
| **Approved by** | Ledgerline's owner |
| **Depends on** | `PRODUCT.md`, `SPEC.md` — both `approved` |

---

## 1. Entities

#### Account

The billing and data-ownership boundary — one per Ledgerline customer (ADR-2 in
`ARCHITECTURE.md`).

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `business_name` | string | required | shown on every invoice this account sends |
| `tax_id` | string | optional | — |
| `address` | string | optional | — |
| `created_at` | timestamp | required | — |

**Owned by / scoped to:** global (this is the tenant root).

#### User

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `account_id` | uuid | required, FK -> Account | — |
| `email` | string | required, unique | — |
| `role` | enum | required — `owner` \| `member` | `owner` can manage billing and settings; `member` cannot (F-4, F-5) |
| `created_at` | timestamp | required | — |

**Owned by / scoped to:** Account.

#### Client

A business or person Ledgerline's account holder invoices — not a Ledgerline user, has no
login.

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `account_id` | uuid | required, FK -> Account | — |
| `name` | string | required | — |
| `email` | string | required | where invoices and payment links are sent |
| `address` | string | optional | — |

**Owned by / scoped to:** Account.

#### Invoice

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `account_id` | uuid | required, FK -> Account | — |
| `client_id` | uuid | required, FK -> Client | — |
| `status` | enum | required — see §3 | — |
| `currency` | string | required, ISO 4217 | Pro-only: any code; Free tier is fixed to the account's default currency |
| `due_date` | date | required | — |
| `issued_at` | timestamp | set when status moves to `sent` | null while `draft` |
| `total` | decimal | computed, never hand-entered | sum of its `InvoiceLineItem`s |
| `created_at` / `updated_at` | timestamp | required | — |

**Owned by / scoped to:** Account (and, transitively, one Client).

#### InvoiceLineItem

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `invoice_id` | uuid | required, FK -> Invoice | — |
| `description` | string | required | — |
| `quantity` | decimal | required, > 0 | — |
| `unit_price` | decimal | required, >= 0 | — |

**Owned by / scoped to:** Invoice (and, transitively, Account).

#### Subscription

One per Account — the Free/Pro plan state (F-5).

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `account_id` | uuid | required, unique, FK -> Account | 1:1 with Account |
| `plan` | enum | required — `free` \| `pro` | — |
| `renews_at` | timestamp | required when `plan = pro` | next Pro billing date |
| `canceled_at` | timestamp | optional | set when the owner cancels; `plan` stays `pro` until `renews_at` passes |

**Owned by / scoped to:** Account.

#### PaymentEvent

A record of every payment-provider webhook delivery, kept for idempotency (`nfr.md` §3) —
not a user-facing entity.

| Field | Type | Constraints | Meaning (if not obvious) |
| --- | --- | --- | --- |
| `id` | uuid | primary key | — |
| `external_event_id` | string | required, unique | the payment provider's own event id — the idempotency key |
| `invoice_id` | uuid | optional, FK -> Invoice | set for an invoice payment event, null for a subscription-only event |
| `account_id` | uuid | required, FK -> Account | set on every event, so a subscription renewal event resolves without an invoice |
| `type` | enum | required — `invoice_payment` \| `subscription_renewal` | — |
| `received_at` | timestamp | required | — |

**Owned by / scoped to:** Account.

---

## 2. Relationships

| From | To | Cardinality | Notes |
| --- | --- | --- | --- |
| Account | User | 1:N | An account with zero users is not reachable in practice — created together at signup |
| Account | Client | 1:N | — |
| Account | Invoice | 1:N | — |
| Client | Invoice | 1:N | A Client can have many Invoices; an Invoice has exactly one Client |
| Invoice | InvoiceLineItem | 1:N | Deleting an Invoice while `draft` cascades to its line items; a non-`draft` Invoice is never deleted, only `void`-ed |
| Account | Subscription | 1:1 | Created at signup, defaulted to `plan: free` |
| Account | PaymentEvent | 1:N | — |
| Invoice | PaymentEvent | 1:N | Usually 0 or 1 for a given invoice; more than one only if the provider redelivers the same event, which `external_event_id`'s uniqueness catches |

---

## 3. Lifecycle and state

**Entity:** Invoice
**States:** `draft`, `sent`, `paid`, `overdue`, `void`
**Transitions:** `draft -> sent` (F-3 send action) · `draft -> void` (discard before sending) ·
`sent -> paid` (payment webhook confirms payment, F-3) · `sent -> overdue` (due date passes
with no payment — a scheduled check, not a user action) · `overdue -> paid` (a late payment
still confirms) · `sent -> void` / `overdue -> void` (owner cancels a sent invoice; the
client-facing payment link is deactivated)

**Entity:** Subscription
**States:** `free`, `pro`
**Transitions:** `free -> pro` (F-5 upgrade, immediate) · `pro -> pro` with `canceled_at` set
(F-5 cancel — plan stays `pro` until `renews_at`) · `pro -> free` (a scheduled check moves the
plan down once `renews_at` passes and `canceled_at` is set)

---

## 4. Open assumptions

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| `overdue` is computed by a scheduled check rather than at read time | Keeps the status queryable without recomputing it on every list request | If wrong, a low-traffic account could show a stale `sent` status past its due date until the next scheduled run |
