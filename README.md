# still-true

**Forward it a document. Find out what it actually requires of you.**

Send a lease, a terms-of-service update, an insurance renewal — as an attachment
or a link — to an email address. You get back what that document requires of you
and by when, with **every claim quoted from the source and the line it came
from**. Where the document is silent, it says so and tells you how many lines it
searched — and since 2026-09-09 it says that precisely. A fact stated **across
two lines** cannot be cited under a one-line contract, so the refusal claims
only what it can know: *"Searched all 418 lines. No single line states it."* It
said *"This document does not state it"* until a playtest caught that being
false on a document that states the fact twice
([H5](docs/READINESS.md), closed).

For documents that live at a URL it keeps watching, and tells you when the
specific thing you asked about changes.

Built for the Convex All Gas Hackathon (Aug–Sep 2026).

Live: **https://impressive-marten-163.convex.site**
Demo: **https://youtu.be/HofqXKI8KJs** (2:42)
Try it: forward a PDF or a link to **still-true@agentmail.to**
**Check your spam folder the first time.** The reply is sent over a shared
relay from an address you have no history with; measured 2026-09-14 on two
Gmail accounts, the one with prior exchanges got the inbox and a cold one got
spam.

## Why it can be trusted

The plain sentence above each quote is the model's summary. **The quote is not.**
The model reads the document and returns a **line number**; the quote you see is
`slice`d out of that line on the server, by index, after the model is done
talking. Its proposed clause text is used only to locate the cut — if it is not
in the line character for character it is discarded and the whole line publishes.
So the system cannot show you a quote that is not in your document — the quote
*is* the document. That is a structural guarantee, not a prompt instruction.

It is a guarantee about the quote, and only about the quote. The summary above
it is model prose, which is why it sits above the receipt rather than instead of
one.

It can still cite a true line that does not answer the question. That is why
every citation is visible and one click from its source.

**The watch is held to the same standard.** It never reports a change from a
diff of two model runs — the same six documents read on two deployments hours
apart disagreed on 2 of 47 cells with nothing about the documents changing. A
change is only ever reported when a SHA-256 of the parsed lines has moved *and*
the exact clause a finding used to quote is no longer in the document. Both
gates are deterministic; neither asks the model a second time.

Two things it deliberately does not do: it never interprets, advises, or judges a
document, and it is not legal advice. It quotes and it counts.

## Stack

- **Convex** — state, indexes, the daily re-check cron, realtime queries, static hosting
- **AgentMail** — the inbox: signed inbound webhooks with attachments, replies and change notices
- **Firecrawl** — PDF parsing and link fetching, for the mail path and the re-check alike
- **OpenAI** — constrained extraction returning line indices and an explicit refusal verdict

Firecrawl's own `changeTracking` was the first design for the watch and is not
used: the signal is consumable, so reading it spends it. See
[`convex/lines.ts`](convex/lines.ts) for the live run that settled it.

## Status — 2026-09-14

**Live on production and answering real mail. The demo is recorded.**

- **P1–P3 — the inbox, the parser, the extractor and the cited reply:** shipped.
  Production answered a forwarded link in 15 seconds with six quoted findings and
  one refusal. **That 15 seconds is one event on 09-06, and it is the fast end.**
  Across the 20 real answers production has sent, the median is 20.4 seconds and
  the slowest is 42.6 — measured 2026-09-14 by subtracting `threads.receivedAt`
  from `threads.repliedAt`, two fields that had been sitting there since P1. The
  board said "about fifteen seconds" until that measurement and now says "under a
  minute", which is true of all twenty. Latency does not track document length:
  the fastest run of the twenty is the 1,182-line PayPal agreement, and one
  418-line lease spanned 14.8s to 42.6s in a single evening. The board was designed on 2026-09-10 and is now a pleading page:
  line numbers in a gutter down the left edge, the quote as the largest text on
  a card, the model's summary demoted to an annotation above it — and a refusal
  rendered with an EMPTY gutter, because there is no line to name. No new claim
  is made in words; the hierarchy stopped contradicting the one already there.
- **P4 — the watch:** shipped, and the schedule has now run without a hand on it.
  A sweep on development caught both clauses edited on a test fixture, quoted each
  before and after with its line, stamped nothing on the other 22 answered
  findings, and mailed the change into the thread that had asked about it —
  unprompted, 2m17s after the clauses moved. On production the 2026-09-06 sweep
  stamped all six documents between 11:17:09 and 11:19:16 UTC, the cron's
  scheduled minute: three read identically and stopped before the model ran,
  three had moved text and were re-extracted, and **no clause any finding had
  quoted was gone, so nobody was emailed.** That is both gates, on real
  documents, with nobody watching. Enrolment is still automatic and takes no
  opt-in; **replying STOP now ends it** — that thread and every other one from
  the same address — and a re-check that fails now says so on the document row
  instead of only in logs nobody can read. **A second forward of a URL already
  known no longer ends that watch:** the row is shared by design, and until
  2026-09-14 the second arrival re-classified it, replaced every published
  finding, and left the first sender enrolled in a watch that would never fire
  ([H9](docs/READINESS.md), closed).
- **P5 — the CC reply:** shipped, and smaller than it was described as being.
  Cc this address on a thread and the document is read out of the quoted
  original, with the cited answer replied to **everyone on the thread** — which
  is the entire reason to cc it rather than forward it. Verified on development:
  a cc'd message whose only link sat behind a `>` was read, answered with six
  quoted findings and one refusal, and sent `reply-all`.

  This README previously said the missing piece was "the document is attached to
  an earlier message". **That case cannot be built, and it is worth saying why
  rather than leaving it on a list.** A message sent before this address was
  cc'd was never delivered to this inbox, so AgentMail does not have it and no
  API can produce it — its threads are inbox-scoped, and it currently holds one
  thread for the development inbox against twelve rows in our own table. What a
  cc genuinely carries is the quoted text, which is where the link lives.

  The real defect the CC path did have was the opposite of a missing feature:
  every apology was replied to the whole thread. "I did not find a document in
  that message", sent to a landlord, a tenant and a broker, is a stranger
  interrupting to announce its own failure. Answers and change notices go to the
  thread now; apologies, rate-limit notices and unsubscribe confirmations go to
  whoever wrote.

The public board carries six documents, 35 answered findings and 12 refusals, as
of the `npm run gate` run on 2026-09-14. It said 36 and 11 on 09-07, 37 and 10
the day before that, and 35 and 12 the day before that. The counts move on their own: two deployments reading
these same six documents hours apart on 09-04 disagreed on 2 of 47 cells with
nothing about the documents changing, so a cell crossing between answered and
refused overnight is the expected amount of drift, not a finding. This system
cannot tell you which of the two happened and does not claim to — a clause that
merely appears is never reported as a change, because there is no previous quote
to put beside it.

Which is why this paragraph is the least trustworthy thing on the page, and why
`npm run gate` reads the numbers off production rather than believing it. It has
now caught this sentence drifting three times.

- Build log and every decision, including the ones that were reversed: [`hackathon.md`](hackathon.md)
- **Known open issues, scored, with a fix order: [`docs/READINESS.md`](docs/READINESS.md)**
- **One round trip, unedited — a document forwarded to the live inbox and the
  reply it got back, with every quote checked by hand against the source PDF and
  every refusal interrogated: [`docs/transcript-sbc.md`](docs/transcript-sbc.md).**
  Predeclared first in [`docs/round-trip.md`](docs/round-trip.md), committed
  before the mail was sent. It found two flags, both now open in READINESS.
- Evidence, including two probes that fired no decision rule: [`docs/probe.md`](docs/probe.md), [`docs/probe-v3.md`](docs/probe-v3.md)
- The one probe that *did* fire a rule — `universal` downgraded rather than stopped, on the checklist most likely to fail: [`docs/probe-universal.md`](docs/probe-universal.md)
- An external pre-build assessment of a since-abandoned direction, and which of its recommendations were declined: [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md)

## Development

```sh
npm install
npm run dev        # convex dev + vite
npm run lint       # typecheck + eslint
npm test           # 98 tests, all pure: extraction, lines, change detection, reply wording, the unsubscribe keyword, the link unwrapper, the sender grammar
npm run gate       # lint + test, then seven read-only checks against production
npm run deploy     # build, push functions, upload static files

bash scripts/reconcile.sh   # check every claim in these docs against the world
```

`gate` asks production whether the system still works. `reconcile` asks whether
these documents still describe it — the failure that breaks no test. It writes
[`docs/reconcile-report.md`](docs/reconcile-report.md), grouped CONFIRMED /
DRIFTED / UNVERIFIABLE, with the command that produced every finding attached,
and exits non-zero on drift. **UNVERIFIABLE is not a soft pass**: an elided URL
or a link that timed out is an open question, and the report says so instead of
guessing.

Runnable by hand against a deployment:

```sh
npx convex run mail:probe '{"url":"https://example.com/terms"}'   # read one URL into the public corpus
npx convex run watch:sweep                                        # re-check every watched document now
```

`AGENTMAIL_API_KEY`, `FIRECRAWL_API_KEY`, `OPENAI_API_KEY` and `OPENAI_MODEL`
are Convex deployment environment variables, never files in this repository. Set
them with `npx convex env set <NAME> <value>`, and again with `--prod` —
deployment variables do not travel between deployments.
