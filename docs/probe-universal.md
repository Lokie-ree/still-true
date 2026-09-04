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

## Result

_Not yet run._
