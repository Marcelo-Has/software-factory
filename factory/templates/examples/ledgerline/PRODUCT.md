# PRODUCT.md — Ledgerline

> Example artifact for `factory/templates/PRODUCT-template.md`, filled with a small fictional
> product ("Ledgerline") so the Definition Phase templates and gates have something real to
> check themselves against — never copy this content into a real product's `PRODUCT.md`. See
> `factory/templates/examples/ledgerline/` for the rest of this example's cross-linked
> artifacts.

## 0. Header

| Field | Value |
| --- | --- |
| **Status** | `approved` |
| **Date** | 2026-08-18 |
| **Approved by** | Ledgerline's owner |

---

## 1. Vision

Freelancers and small agencies lose paid work time formatting invoices by hand and chasing
late payments over email. Ledgerline promises a five-minute path from "job done" to "invoice
sent and trackable" — and a clear, always-current answer to "who still owes me money."

---

## 2. Audience

**Primary audience:** solo freelancers and two-to-ten-person agencies who bill clients by the
hour or by project, and currently invoice by hand in a document editor or spreadsheet.
**Secondary audience:** Not applicable — single audience for v1.

---

## 3. Jobs to be done

| # | Job | Why it matters to them |
| --- | --- | --- |
| 1 | Turn finished work into a sent, professional invoice quickly | Every minute spent formatting an invoice is unbilled time |
| 2 | Know, at a glance, which invoices are outstanding vs. paid | Manually tracking payment status across email threads is error-prone and stressful |
| 3 | Get paid without coordinating a manual bank transfer | A client who has to "remember to wire it" pays later than a client with a payment link |

---

## 4. Scope — v1

Create and edit invoices for named clients; send an invoice by email with an online-payment
link; track each invoice's status automatically (draft, sent, paid, overdue, void); manage
basic account and billing settings; a Free tier capped at 5 sent invoices per month, and a
Pro subscription that removes the cap and adds multi-currency invoices and custom invoice
branding.

---

## 5. Out of scope — for now

| Excluded | Why, for now |
| --- | --- |
| Automated recurring invoice sending (only manual "duplicate last invoice" for now) | The Pro plan sells the removal of friction first; a scheduling engine is a second, separable v1.1 bet |
| Multi-user roles beyond owner/member | Most target accounts are one to three people; a permissions system beyond "can manage billing or not" has no validated demand yet |
| Accounting-software integrations (export to external bookkeeping tools) | No signal yet on which tool matters most to the audience; guessing wrong here is expensive to unwind later |
| Multiple team members inviting their own clients into shared workspaces at scale | Out of proportion to the audience size (freelancers, small agencies); revisit if the audience shifts |

---

## 6. Personality and brand positioning

**Personality (3 adjectives, each justified):** *Precise* — the product handles the audience's
own money, and vague or rounded numbers erode trust. *Reassuring* — invoicing anxiety (will
this look professional? will I get paid?) is the emotional context every screen sits inside.
*Unfussy* — the audience bills by the hour; five extra clicks between "job done" and "invoice
sent" is a real cost to them, not a UX nitpick.

**How this product wants to be positioned against alternatives:** the fast, focused invoicing
tool — not a full accounting suite. Someone who needs Ledgerline shouldn't also need a
40-minute onboarding call.

**What this product is explicitly NOT:** not playful or gamified (this is not a
consumer-habit app); not an enterprise operations dashboard (no multi-department reporting,
no approval chains); not positioned as "all-in-one" against QuickBooks-class tools — it wins
by doing one job fast, not by doing every job.

---

## 7. Open assumptions

| Assumption | Why it was assumed instead of asked | Risk if wrong |
| --- | --- | --- |
| A 5-invoice/month Free cap is the right Free/Pro line | No pricing research run yet for this fictional product; a round, easy-to-explain number was chosen for the example | A cap that's too low frustrates before value is proven; too high removes the upgrade incentive |
