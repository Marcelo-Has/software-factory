# MILESTONES.md — Ledgerline

> Example artifact for `factory/templates/MILESTONES-template.md`. See the note in
> `factory/templates/examples/ledgerline/PRODUCT.md` — never copy this content into a real
> product's `MILESTONES.md`. `project/docs/milestones.yaml` — the machine source this file
> narrates — is built alongside the rest of the machine-readable Definition templates.

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `approved` |
| **Date** | 2026-08-18 |
| **Approved by** | Ledgerline's owner |
| **Depends on** | `SPEC.md`, `ARCHITECTURE.md` — both `approved` |

---

## 1. Coverage rule

Every screen (`screens.yaml`) and every feature (`SPEC.md`'s `#### F-<n>` headings) belongs to
**exactly one** milestone — never zero, never more than one. `gate-definition-done.mjs`
enforces this and reports, screen by screen and feature by feature, whichever is missing or
duplicated.

---

## 2. Milestones

#### M-1 — Core invoicing

**Why this grouping:** an invoice has to exist and be readable before it can be sent or paid —
this is the smallest slice that's independently demoable (create an invoice, see it listed).
**Screens:** `S-invoices`, `S-invoice-editor`
**Features:** `F-1` (create and edit an invoice), `F-2` (track invoice status)
**Endpoints / integrations:** `listInvoices`, `createInvoice`, `getInvoice`,
`updateInvoice` — none
**Budget:** 40 turns, $25
**Acceptance:** an account owner can create a draft invoice with line items, see it in the
invoice list with a computed total, and edit it while it stays `draft`.

#### M-2 — Send and get paid

**Why this grouping:** sending and payment collection are one user-facing action from the
client's perspective (they receive one email with one payment link) and share the same
external-integration surface — splitting them would leave a demoable slice with an invoice
that can never actually be paid.
**Screens:** `S-email-invoice-sent`
**Features:** `F-3` (send an invoice and collect payment online)
**Endpoints / integrations:** `sendInvoice`, `handlePaymentWebhook` — `I-payments`
**Budget:** 30 turns, $20
**Acceptance:** sending an invoice delivers the transactional email with a working payment
link, and a successful payment moves the invoice to `paid` from the provider's webhook, with a
duplicate delivery of the same event confirmed as a no-op.

#### M-3 — Account, settings, and Pro

**Why this grouping:** the Free-tier cap and the Pro upsell only make sense once M-1 and M-2
have already demonstrated the core value — settings and billing are the account-level layer
around the invoicing loop, not a prerequisite for it.
**Screens:** `S-settings`, `S-billing`
**Features:** `F-4` (manage account and business settings), `F-5` (manage the Pro subscription)
**Endpoints / integrations:** `getAccountSettings`, `updateAccountSettings`,
`getSubscription`, `upgradeSubscription`, `cancelSubscription` — `I-payments`
**Budget:** 25 turns, $15
**Acceptance:** an account owner can update business info that then appears on new invoices,
and can upgrade to Pro (immediately lifting the Free-tier cap) or cancel it (reverting to Free
at the next renewal date).

---

## 3. Sequencing rationale

M-1 has no dependency on the other two and is the natural starting point — nothing else in the
product is reachable without an invoice existing first. M-2 depends on M-1 (there must be an
invoice to send) and is sequenced immediately after it, since a product that can create
invoices but never send them delivers no real job-to-be-done from `PRODUCT.md` §3. M-3 depends
on neither M-1 nor M-2 functionally — the Pro subscription plumbing (`I-payments`) is
independent of invoice sending — but it's sequenced last because the Free-tier cap it
enforces only becomes a felt need once M-1 is in use, and validating `I-payments` once in M-2
de-risks reusing it for subscription billing in M-3.

---

## 4. Open assumptions

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| The budgets above are plausible placeholders, not measured estimates | No real delivery data exists yet for this fictional product | A real product's `MILESTONES.md` should replace these with estimates grounded in the factory's own turn-budget history, not copy them |
