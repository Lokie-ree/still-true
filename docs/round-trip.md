# Round trip — one document, forwarded by hand, predeclared

**Written 2026-09-08 17:47 UTC. Nothing had been sent when this file was
committed, and no finding on the target document had been read in this session.**

The probe-v4 discipline applied to a single document. This project has produced
two audit passes and zero receipts since P5 shipped; the artifact this run exists
to make is a verbatim transcript of one round trip — a document forwarded from a
real address to the real inbox, and the reply that came back — checked the way a
hostile reader would check it.

The value of the transcript depends entirely on these expectations existing
before the reply does. That is the whole reason for this file.

## The run

- **Document:** Summary of Benefits and Coverage — a completed CMS sample SBC.
  `https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf`
- **Row on production:** `jh7f7jak4ratez1y370w2bc7px8dsfv7`, `kind: "other"`,
  `isPublic: true`, currently **171 lines**.
- **From:** the maintainer's own address. **To:** the live inbox.
- **Why this document:** it is already on the public board, so there is no
  privacy question in publishing the reply; and by the 2026-09-05 log entry it is
  the strongest thing in the corpus — a real health plan that answers none of
  four questions a person would actually ask of their own coverage.

Chosen because it is the best document, not the safest. That is worth saying
plainly: this is a favourable case, and a favourable case is the right first
receipt and the wrong only receipt.

## What was already known when this was written

Stating this rather than pretending to a blank slate. A prediction that is
secretly a recollection is not a prediction.

1. `questions.ts` — `kind: "other"` fires the UNIVERSAL checklist: eight
   questions, `U1a U1b U2 U3a U3b U4 U5a U5b`.
2. `hackathon.md`, 2026-09-05 — quotes this document's refusal block verbatim
   with **four** refusals: `U3a`, `U3b`, `U5a`, `U5b`, each reading "Searched all
   173 lines."
3. The board now says **171** lines, not 173. So something in the parse has
   already moved since that entry — most likely H3's parser change (`PARSER_VERSION`
   1 → 2), which the READINESS entry says moved 562 lines across the corpus.
4. `README.md` — production answered a forwarded link in 15 seconds.
5. `README.md` — two deployments reading these same documents hours apart
   disagreed on **2 of 47 cells** with nothing about the documents changing.

The findings currently stored for this document were **not** read before this
file was committed. Numbers 1–3 make the verdict split partly recallable, so the
predictions below are graded on the parts that are not: which cells, the answer
field's behaviour, and the timing.

## Predictions

**P1 — Verdict split: 4 answered, 4 refused.** Directly recalled from (2), so
this one is nearly free. It is listed so that a *different* split is recorded as
a divergence rather than absorbed silently.

**P2 — The four refusals will be `U3a`, `U3b`, `U5a`, `U5b`.** Also recalled,
but the *reason* is a real claim and is what a divergence would falsify: an SBC
is a summary of coverage, not the contract. Termination ("How do you end it?",
"What notice must you give to end it?") and amendment ("Can the other party
change these terms?", "What notice do you get before a change takes effect?")
live in the plan document the SBC summarises, not in the SBC. The refusals should
be honest, not defects.

**P3 — `U2` ("What does it cost you — fees, charges, deposits, or penalties?")
will be answered, and it is the single most likely cell to be answered.** Cost is
the SBC's entire subject: deductible, out-of-pocket limit, copays. Not recalled —
derived from what the document is.

**P4 — `U1a`, `U1b` and `U4` are the uncertain cells.** By (1) and (2) all three
must be answered for the 4/4 split to hold, but an SBC is a description of
benefits rather than a list of obligations, so these are the cells I would expect
to be fragile across runs. **If the split diverges from 4/4, I predict it
diverges here** — most likely `U1b` ("By when must you do it?"), which an SBC has
the least reason to state on one line.

**P5 — Round-trip time: 30–90 seconds, wall clock, from Gmail send to reply
received.** The 15 seconds in the README is the server-side path. This
measurement includes SMTP delivery in both directions, which we do not control
and cannot bound. Under 30 s would be a pleasant surprise; over 3 minutes is
worth investigating; over 10 minutes with no reply is a failure.

**P6 — Line count will read 171, not 173,** and every refusal will say "Searched
all 171 lines." If it says 173, the board's `lineCount` and the reply's disagree
and that is a defect.

**P7 — The `answer` field will stay inside its quote.** This is the cell under
real test. `extract.ts` guards the *quote* structurally (`excerpt` publishes a
slice of `lines[n]`) and guards the *answer* only by prompt instruction. I
predict every answer will be supported by its quote — and I predict at least one
answer will be **more specific in wording** than its quote strictly licenses
(a rounded number, a category name, a "you must" where the line says "may"),
without asserting a fact absent from the line. That gap, if it exists, is the
size of the unguarded channel and is exactly what the README correction has to
describe honestly.

**P8 — Every published quote will appear verbatim in the source document.**
T1, the structural guarantee. Predicted to hold. See the failure table.

**P9 — Forwarding enrols the sender in the watch** and the reply will carry the
WATCH paragraph and the STOP line, because the document is url-backed
(`watchable: true`).

**P10 — No change notice will be sent to anyone.** The document is
probe-seeded and I expect no other `threads` row against it. If the re-read finds
a quoted clause gone, subscribers would be mailed — expected to be nobody, but
this is the one way this run could send mail to a third party, so it is written
down before it can be explained away afterwards.

**P11 — What a stranger can verify from the reply alone: the sentence, not the
index.** A reader can fetch the PDF and confirm each quote appears in it. They
**cannot** reproduce `lineNo`, because the line array is the output of Firecrawl's
parse through `toLines`, and neither is reachable without our API key. Predicted
now because it is a finding about the landing page, not about this document: the
receipt a stranger can actually check is weaker than the receipt the reply
appears to offer.

## Failure vs. surprise

Graded before the result exists, so a bad outcome cannot be renegotiated into an
interesting one.

| Outcome | Grade |
|---|---|
| A published quote is not in the source document | **FAILURE. Stops everything.** T1 falsified; the project's central claim is wrong |
| A refusal on something the document states on a single line | **FAILURE.** The H3 class — a false refusal is the one thing this system is built not to produce |
| An `answer` asserting a number, date or condition absent from its own quote | **FAILURE** of the guarantee as the README states it today; **expected finding** for the corrected wording |
| No reply within 10 minutes, or a `failureBody` apology | **FAILURE.** M1's path firing on a document already known to be readable |
| A change notice mailed to a third party | **FAILURE** of P10, and the worst kind, because it is unsolicited mail |
| Verdict split ≠ 4/4 by one or two cells | **SURPRISE.** Inside the documented 2-of-47 drift; not a defect |
| Line count ≠ 171 | **SURPRISE**, unless it disagrees with the board, which is a defect |
| A refusal that is honest but reads badly | **SURPRISE**, and a copy finding for the landing page |
| Round trip 90 s – 3 min | **SURPRISE.** Slower than hoped, nothing broken |

## What this run cannot settle

- **One document, one model call, one day.** Nothing here generalises to the
  corpus, and a favourable document cannot falsify much.
- **Not an adversarial test.** No injection, no self-contradicting clause, no
  table-only answer. Those are the playtest, and they are the cases that would
  actually stress T2.
- **The line index is unverifiable from outside**, by P11, so "the quote is at
  line 44" is checked here only against our own stored row — which is circular,
  and is reported as circular.
