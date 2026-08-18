# SPEC.md — Ledgerline

> Example artifact for `factory/templates/SPEC-template.md`. See the note in
> `factory/templates/examples/ledgerline/PRODUCT.md` — never copy this content into a real
> product's `SPEC.md`. Screen ids and feature ids on this page are the stable ids the rest of
> this example's artifacts cross-reference.

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `approved` |
| **Date** | 2026-08-18 |
| **Approved by** | Ledgerline's owner |
| **Depends on** | `PRODUCT.md` — `approved` |

---

## 1. Features

#### F-1 — Create and edit an invoice

**User story:** as a freelancer, I can create an invoice for a client with line items and a
due date, and edit it while it's still a draft, so that it's accurate before I send it.
**Screens:** `S-invoice-editor`
**Acceptance criteria:**
- A new invoice starts in `draft` status and is never emailed to the client automatically.
- Line items support a description, quantity, and unit price; the total is computed, never
  hand-entered.
- An invoice can be edited freely while `draft`; once `sent`, only void-and-recreate is
  allowed — not silent edits to a document the client already has.

**Crosses a system boundary (external integration)?** no

#### F-2 — Track invoice status

**User story:** as a freelancer, I can see every invoice's status at a glance, so that I know
who still owes me money without opening each one.
**Screens:** `S-invoices`
**Acceptance criteria:**
- The list shows every invoice with its client, amount, due date, and status
  (`draft`/`sent`/`paid`/`overdue`/`void`).
- An invoice past its due date with no payment shows as `overdue`, not silently as `sent`.
- The list is filterable by status.

**Crosses a system boundary (external integration)?** no

#### F-3 — Send an invoice and collect payment online

**User story:** as a freelancer, I can send an invoice to my client by email with an
online-payment link, so that they can pay without a manual bank transfer.
**Screens:** `S-invoice-editor`, `S-email-invoice-sent`
**Acceptance criteria:**
- Sending moves the invoice from `draft` to `sent` and delivers an email carrying a
  payment link.
- A successful payment moves the invoice to `paid` automatically, from the payment
  provider's confirmation — never from a manual "mark as paid" alone (that stays available
  for offline payments, but online payment is authoritative when it occurs).
- A duplicate payment confirmation for the same invoice never charges or records the
  payment twice.

**Crosses a system boundary (external integration)?** yes — an abstract external payment
provider; see `contracts/integrations.yaml` and
`factory/docs/playbooks/external-integration.md`.

#### F-4 — Manage account and business settings

**User story:** as the account owner, I can set my business name, address, and tax id, so
that invoices carry accurate business information.
**Screens:** `S-settings`
**Acceptance criteria:**
- Business info entered here appears on every invoice generated afterward.
- Only the account owner can change business or billing-relevant settings.

**Crosses a system boundary (external integration)?** no

#### F-5 — Manage the Pro subscription

**User story:** as the account owner, I can upgrade to Pro or cancel it, so that I only pay
for the plan I need.
**Screens:** `S-billing`
**Acceptance criteria:**
- Upgrading removes the Free tier's monthly invoice cap immediately.
- Canceling keeps Pro features active until the end of the current billing period, then
  reverts to Free.
- The billing screen always shows the current plan and, for Pro, the next renewal date.

**Crosses a system boundary (external integration)?** yes — subscription billing runs through
the same abstract payment provider as F-3; see `contracts/integrations.yaml`.

---

## 2. User flows

**Flow:** Create, send, and get paid
**Steps:** `S-invoices -> S-invoice-editor -> S-invoices` (status becomes `sent`, then later
`paid`); the client-facing step in between is the `S-email-invoice-sent` transactional email.
**Why this order:** the list is both the starting point (see what's owed) and the landing
point (see the new status) — the editor is a detour with a clear way back, never a dead end.

**Flow:** Upgrade to Pro
**Steps:** `S-settings -> S-billing -> S-billing` (post-upgrade confirmation state)
**Why this order:** settings is where an owner already is when they hit the Free-tier cap
(F-1's invoice creation blocks past 5/month), so billing is one step away from where the need
is actually felt, not buried in a separate menu.

---

## 3. Screens and behaviors — the machine-readable bridge

**`project/docs/screens.yaml`** inventories the screens above plus their states — including
declaring any area with no screen explicitly, rather than omitting it silently.

**`project/docs/behaviors/*.feature`** carries the Gherkin scenarios for F-3 and F-5 (the two
features that cross the payment-provider boundary), covering the five mandatory classes per
`DECISIONS.md` D-007. Written in D3 once `contracts/openapi.yaml` exists to tag against.

**Screen inventory summary:** 5 screens across 2 areas — `app` (`S-invoices`,
`S-invoice-editor`, `S-settings`, `S-billing`) and `email` (`S-email-invoice-sent`). No
`marketing` or `admin` screens in this v1; `screens.yaml` declares that absence explicitly
rather than by omission.

---

## 4. Open assumptions

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| Offline "mark as paid" stays available alongside online payment | Not every client will use the payment link even when it's offered | If wrong, the manual path is unused complexity; cheap to remove later, not to add |
