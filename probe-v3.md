# Probe v3 — the forwarded document

**Predeclared 2026-09-02, before any document was fetched.** Committed before
the sweep runs. Today's `② GO` was called on a taxonomy invented after seeing
results; this file exists so that cannot happen twice.

## The product being tested

Forward any document to an email address — a lease, a terms-of-service update,
an HOA notice, an insurance renewal. Get back **what this requires of you and
by when**, every claim quoted from the document, plus **what it conspicuously
does not say.** CC it on a thread instead and the same reply lands in the
thread. Same build; the reply target is a routing decision.

## What is actually at risk

The grounding mechanism is proven and domain-free. The corpus is not. Three
assumptions, ranked:

1. **Omission without an authority.** In the school build, absence was
   detectable because a handbook existed to compare against. A forwarded lease
   has no authority above it. Absence must instead be measured against a
   **predeclared expectation list per document type**. If that list cannot be
   written, the omission engine does not transfer and the product is
   retrieval-only. **This is the kill risk.**
2. **The facts are worth extracting at all.** If consumer documents state the
   things people need plainly and near the top, there is no gap to close.
3. **AgentMail can receive attachments.** Hard technical gate, checked separately.

## Expectation lists — fixed now, not adjusted later

**Lease / rental agreement**

| | Fact a tenant must know |
|---|---|
| L1 | Days after move-out the deposit must be returned |
| L2 | Notice the landlord must give before entering |
| L3 | Late fee amount and the day it starts |
| L4 | Notice required to terminate, and whether it auto-renews |
| L5 | Which repairs the tenant pays for |

**Terms of service / consumer agreement**

| | Fact a subscriber must know |
|---|---|
| T1 | Binding arbitration — and whether you can opt out, and by when |
| T2 | Auto-renewal, and how to cancel |
| T3 | Whether they can change terms unilaterally, and notice given |
| T4 | Whether your data goes to third parties |
| T5 | What happens to your account or content on termination |

## Codes — one primary per cell, no secondary flags

| Code | Meaning |
|------|---------|
| `PRESENT` | Stated, quotable, unambiguous. Record the line index. |
| `BURIED` | `PRESENT`, but past the 60th percentile line of the document. |
| `AMBIG` | Addressed, but not in terms a person could act on. |
| `ABSENT` | Searched the whole document. Not there. |

## Sample

Six real, live documents — three leases, three consumer agreements. Fetched by
URL, no curation, **URLs recorded before coding.** Firecrawl `/v2/scrape` with
`parsers:["pdf"]`, then the proven reflow and TOC filter.

## Thresholds — declared before counting

**① GO — omission product.** `ABSENT` + `AMBIG` ≥ **30%** of cells.
Documents fail to tell people things they must know. The headline is *"here is
what this document never says."*

**② GO — retrieval product.** `ABSENT` + `AMBIG` < 30%, but
`BURIED` ≥ **40%**. Everything is in there and nobody could find it. The
headline is *"here is what this requires of you, in eight seconds."* Weaker
claim, still a real product, same build.

**③ STOP.** `PRESENT` and shallow ≥ **70%** of cells. Consumer documents say
what people need, near the top, in plain terms. There is no gap and this
direction dies. Go back to the school build, which has proven evidence.

First matching rule wins, read top to bottom. **Do not negotiate with the result.**

## Carry forward

- [ ] Winning rule: `① ② ③` → __
- [ ] `PRESENT __ · BURIED __ · AMBIG __ · ABSENT __`
- [ ] AgentMail attachment support: confirmed / not confirmed
- [ ] Result written into `hackathon.md` before any schema work
