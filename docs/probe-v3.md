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

---

# Results — 2026-09-02

## Run 1 failed to execute. Not coded.

Six URLs. Netflix returned **360 chars** and Planet Fitness **389** — JS-rendered,
so Firecrawl got nothing. Coding those `ABSENT` would repeat this morning's
error exactly. Worse, two of the three "leases" were **articles about leases**,
not leases: TurboTenant's page reads *"New York law does not specifically
dictate…"* and LegalTemplates' reads *"Our dataset shows that 69% of rental
agreements…"*. I fetched pages **about** documents instead of documents.

Discarded whole. A fetch-failure guard (`< 6,000 chars → EXCLUDED`) was added
before run 2.

## Run 2 — 15 coded cells, all terms-of-service

All three leases failed to fetch, including HUD's model lease at **15 chars**.
So the lease hypothesis — where omission was most likely — remains **untested**.

`PRESENT(shallow) 8 (53%) · BURIED 3 (20%) · ABSENT 4 (27%)`

**① omission** — needs ≥30%. Has 27%. **Does not fire.**
**② retrieval** — needs `BURIED` ≥40%. Has 20%. **Does not fire.**
**③ STOP** — needs `PRESENT`-shallow ≥70%. Has 53%. **Does not fire.**

**No rule fires.** Second no-fire of the day.

## Why — the instrument was wrong, and this is the finding

The tally is not trustworthy, and the reason matters more than the tally.

- **`ABSENT` is contaminated.** Apple coded `ABSENT` on *"they can change
  terms"* — Apple's agreement certainly says so; the regex missed it. PayPal
  coded `ABSENT` on auto-renew, but PayPal is not a subscription, so the cell
  is not-applicable rather than absent.
- **`BURIED` is contaminated the other way.** The first regex hit is not the
  best hit. PayPal's `T4` matched at 100% depth on *"personal data provided to
  you by PayPal"* — not a third-party sharing clause at all. Noise.
- **`AMBIG` was never measurable.** The code exists in the taxonomy and no
  regex can assign it. *Stated but not in terms a person could act on* is the
  distinction the entire product turns on, and only a model can draw it.

A keyword sweep worked on the school handbook because policy sentences are
distinctive and self-contained. Legalese is diffuse, hedged, and cross-
referenced. **The sweep is the wrong instrument for this corpus.**

> **The extractor is the instrument.** No further sweep has information value.
> The remaining uncertainty is answerable only by building the thing.

## What does not need a probe

Not a hypothesis. A measurement, taken at 238 wpm:

| Agreement | Words | Reading time |
|---|---|---|
| **AT&T Consumer Service Agreement** | **51,654** | **3 h 37 m** |
| PayPal User Agreement | 26,403 | 1 h 51 m |
| Spotify End User Agreement | 8,670 | 36 m |
| Apple Media Services T&C | 8,467 | 36 m |

People click *I agree* on these. No probe is required to establish that they
did not read 3 hours 37 minutes of text.

And one fact reproduced across both runs, in the two largest documents:
**the arbitration opt-out sits at the 89th percentile.** PayPal line 1005 of
1135; Spotify line 293 of 328. It is the most time-limited right in a consumer
agreement — typically 30 days, after which the right to sue or join a class
action is waived — and it is at the bottom of the longest document the person
will ever be asked to accept.

## Technical gate — CLEARED

**AgentMail receives attachments.** A `Message` carries an `attachments` array
with `attachment_id`; `GET` returns the raw file. PDFs supported.
`docs.agentmail.to/attachments`. The forward-a-lease path is viable.

## Carry forward

- [x] Winning rule: **none fired.** Recorded as a no-fire, not negotiated.
- [x] `PRESENT 8 · BURIED 3 · ABSENT 4` — **unreliable**, instrument too crude
- [x] AgentMail attachment support: **confirmed**
- [ ] Lease corpus: still untested, all three fetches failed
- [ ] Next measurement uses the real extractor, as P1's exit test
