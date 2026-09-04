# Probe: the universal checklist

**Predeclared 2026-09-04, before any document was fetched.** Committed first, on
purpose. The `② GO` in `docs/probe.md` was called on codes invented after seeing
results and had to be publicly retracted; probe v3 fixed that by fixing the
taxonomy in `c970533` before the first fetch. This file is the same discipline.

## Why this measurement exists

`universal` is one of three checklists and it has **never run once**. Every
finding in the database carries an `L*` or `T*` key. Both `notice` and `other`
route here, so it is what catches whatever a stranger — or a judge — actually
forwards: an insurance renewal, an HOA notice, an employment handbook.

It is also the checklist most likely to fail. Its questions are the diffuse kind
the one-line contract handles worst. *"What does this require you to do?"* has no
single obvious sentence in a document that requires eleven things.

## What this measurement may NOT do

`convex/questions.ts` states that no list is revised in response to an extraction
run — a question list tuned to its own result is the exact error probe v3 exists
to prevent. So **the questions are fixed and this probe cannot change them.**

It decides one thing only: whether `universal` **ships as the catch-all**, or
whether `notice`/`other` instead get an honest *"I don't have questions for this
kind of document"* reply. Publishing a true sentence that is a category error is
the outcome both options exist to avoid.

## Corpus

Three documents, **none a lease and none a terms-of-service page**, one from each
category below. The first candidate per category that (a) Firecrawl returns
≥ 6,000 chars for and (b) is the document itself rather than an article about
one. **No swapping a document after seeing its extraction.**

1. An HOA / condominium association rules or covenants document
2. An insurance policy, benefits notice, or coverage summary
3. An employment handbook or employee policy document

**Classifier exclusion, declared in advance:** if a document classifies as
`lease` or `tos`, it never reaches this checklist, so it is excluded from these
counts and replaced by the next candidate in the same category. That is recorded
as a classifier observation, not as a universal result.

24 cells expected — 3 documents × 8 questions.

## Taxonomy

One primary code per cell.

| code | meaning |
|---|---|
| `GOOD` | answered; the quote supports the answer **and** the cited line addresses the question asked |
| `NARROW` | answered and supported, but the line is a peripheral instance rather than the governing provision |
| `WRONG` | answered, but the quote does not support the answer |
| `REFUSED-OK` | `not_stated`, and I could not find the answer on any single line by hand |
| `REFUSED-FALSE` | `not_stated`, but the document does state it on a single line |
| `N/A` | the question does not apply to this document at all |

`N/A` cells are excluded from every denominator below.

Every answered cell is checked by opening its citation. **Every refusal is
checked by searching the source document by hand** — that is the expensive half
and the reason this probe is only three documents. Refusals are the thing the P2
gate explicitly could not verify, and they are the differentiator, so this is the
first time they get checked as a class rather than one at a time.

## Decision rules — all three fixed before the run

**① STOP if `WRONG` ≥ 1.**
The grounding invariant is absolute and has held at 21/21 across three documents.
A single unsupported answer here means the diffuse questions break the one-line
contract, and `universal` must not ship on any score.

**② STOP if `REFUSED-FALSE` > 20% of all refusals.**
The refusal is what nothing else on the market produces. A catch-all that
confidently reports absence for things the document actually says is worse than
returning nothing, because it is wrong in the one place this product asks to be
trusted.

**③ DOWNGRADE if `NARROW` > 33% of answered cells.**
Lease and ToS ran roughly 19% (4 of 21). A materially worse rate on the
catch-all means it ships with the limit stated plainly in the README and the
submission, rather than silently.

**PASS if none fire** — `universal` ships as the catch-all, and the P2 gate's
coverage gap is closed.

### What a STOP costs, decided now rather than later

`notice` and `other` route to a reply that says the document was read, gives its
line count, and states that there is no predeclared checklist for this kind of
document. No findings are published. That is a worse product and an honest one,
and it is strictly better than a category error carrying a receipt.

**No answer rate threshold, deliberately.** A document that genuinely says little
*should* produce refusals — that is the product working, not failing. Rule ②
already catches the failure that matters, which is refusing what the document
says. A rate rule here would punish the honest case.

## Result — run 2026-09-04

All three candidates fetched on the first try and **all three classified
`other`**, so all reached `universal` and no classifier exclusion was needed.

| # | document | lines |
|---|---|---|
| 1 | Independence Place West Condominium Handbook of Rules and Regulations | 693 |
| 2 | Summary of Benefits and Coverage (CMS completed sample) | 173 |
| 3 | City of Las Vegas Employee Handbook | 606 |

### Coding

| | U1a | U1b | U2 | U3a | U3b | U4 | U5a | U5b |
|---|---|---|---|---|---|---|---|---|
| **Condo** | NARROW | NARROW | NARROW | N/A | N/A | GOOD | REF-OK | REF-OK |
| **SBC** | GOOD | GOOD | GOOD | REF-OK | REF-OK | GOOD | REF-OK | REF-OK |
| **Handbook** | NARROW | REF-OK | NARROW | GOOD | GOOD | NARROW | GOOD | GOOD |

`GOOD 9 · NARROW 6 · WRONG 0 · REFUSED-OK 7 · REFUSED-FALSE 0 · N/A 2`

24 cells, 2 excluded as `N/A`, 22 counted: **15 answered, 7 refused.**

### Rules

- **① `WRONG` ≥ 1 → STOP.** `WRONG = 0`. **Does not fire.** The grounding
  invariant holds on the diffuse questions too, now 36/36 answered findings
  across six documents.
- **② `REFUSED-FALSE` > 20% of refusals → STOP.** `0 / 7 = 0%`. **Does not
  fire.**
- **③ `NARROW` > 33% of answered → DOWNGRADE.** `6 / 15 = 40%`. **FIRES.**

**Verdict: PASS with DOWNGRADE.** `universal` ships as the catch-all, and the
narrow-citation rate ships stated rather than hidden.

### The refusals held, and that is the result worth keeping

Seven refusals, **zero false**, each checked by searching the source PDF rather
than by trusting the extractor. The one most expected to fail did not: a condo
rulebook that never grants the Board a power to change its own rules. Its three
occurrences of *amend* all refer to the externally recorded Declaration and
Bylaws, and `revise`, `reserves the right`, `may adopt` and `changed` appear
zero times. The SBC likewise never says how coverage ends or whether terms can
change — `terminat`, `cancel`, `amend` and `change` are absent from all 173
lines.

This is the first time refusals were verified as a class. The P2 gate could not
do it — "there is no citation to open" — and it is the half of the product
nothing else ships.

### Why rule ③ fired, and why it was predictable

`NARROW` ran **40% against 19% (4 of 21) on lease and ToS** — roughly twice the
rate. The predeclaration said this was the likely failure and named the reason:
*"What does this require you to do?"* has no single sentence in a document that
requires eleven things. So the model picks one true requirement out of many, and
on the condo rulebook it picked the leasing-notification clause out of a
693-line book covering pets, parking, noise, trash and architectural approval.
Supported, checkable, and not what a reader most needed.

The handbook's `U1a` shows the other shape: *"It is essential to understand and
adhere to all City policies and procedures"* is the most general sentence in the
document, perfectly supported, and teaches nobody anything.

**This cannot be fixed by editing the questions** — `convex/questions.ts`
forbids tuning a list to its own result, and rule ③ is a downgrade rather than a
stop precisely so the finding is published instead of optimised away.

### Two legibility findings, outside the taxonomy

Neither affects correctness, both affect whether a receipt can be read.

1. **Markdown link URLs land inside quotes.** Every SBC citation carries bare
   `https://www.healthcare.gov/sbc-glossary/#deductible` strings mid-sentence,
   because Firecrawl renders the glossary links as text plus URL. Same class as
   the `<sup>`/`<u>` markup already stripped in `convex/lines.ts`, and not yet
   handled there.
2. **A quote can end on a colon.** The condo `U1a` receipt reads *"Prior to
   leasing your unit, the following information must be submitted to the
   management company:"* — promising a list the one-line contract cannot show.
   Structural to citing exactly one line, not a bug in the excerpt.
