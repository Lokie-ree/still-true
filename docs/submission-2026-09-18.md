# Submission copy — 2026-09-18

The description for https://vibeapps.dev/s/still-true, re-derived on 2026-09-18
after the adversarial verification and the two attachment forwards logged in
`hackathon.md` under that date. Supersedes
[`submission-2026-09-16.md`](submission-2026-09-16.md), which stays as history.

**This is a dated snapshot, not a maintained document.** Its numbers are
correct for 2026-09-18 evening and are not updated afterwards. `README.md` is
the canonical description; `npm run gate` and the board are canonical for the
counts. Do not reconcile this file — if a number here disagrees with production
later, production is right and this file is history. Re-deriving the numbers
means a new dated file, not an edit to this one.

Numbers below were read from production on 2026-09-18: `documents:recent` and
`documents:findingsFor` for the board totals, the `documents`, `findings` and
`threads` tables for the attachment rows and the reply times, `npm run gate`
for the test and check counts. What changed from the 09-16 copy, and why, is
the 2026-09-18 evening entry in `hackathon.md`.

---

Forward a document. It tells you what it never says — and how many lines it read before saying so.

**Demo (2:43):** https://youtu.be/HofqXKI8KJs

**A refusal with a number in it.** Forward a lease, a terms-of-service update, an insurance renewal — as a PDF attachment or a link in the body. Every answer comes back quoted from your own text with the line it came from. Where no single line answers the question, you get this:

> Searched all 416 lines. No single line states it.

That is the Livonia Housing Authority's public housing dwelling lease answering *how many days after move-out must the deposit be returned?* Six of its seven questions came back with a quote and a line number — the 48-hour entry notice at line 264, the $25.00 late fee at line 42. The seventh came back as a count. I checked it by hand against the source PDF. Seven occurrences of *deposit*, none of them a deadline. The word *refund* appears zero times. **A tenant cannot learn when their money comes back by reading the lease they signed.**

Then I forwarded the Louisiana Association of Realtors residential lease form — the one used where I live — as a PDF attachment. Same question. Line 177: *"a return of the security deposit within 30 days."* One lease refuses at 416 lines; the other answers at line 177, in 20 seconds. That is the whole product in two documents: it does not know what a lease should say, it knows what yours does.

That 416 is what the board read today, and it has read 418. A PDF's line count can move without the document changing — a scored open flag, `M6`, not a rounding of the truth. The refusal always quotes the number it actually searched.

The wording is deliberately boring and it is load-bearing. It claims only what the system did — it read 416 lines and no single one of them states this — never that the fact is absent from the world. **A refusal is a search result, not a verdict.** A `not_stated` finding stores a question key and a line count and nothing else, so it is structurally incapable of asserting more. It said *"This document does not state it"* until a playtest caught that being false on a document stating the fact across two lines; the sentence is narrower now because the old one was wrong.

Live board: **six documents, 5,133 lines, 37 answered findings, 10 refusals.** Those counts drift by a cell or two between re-reads with nothing about the documents changing, which is why the README calls its own copy of them the least trustworthy sentence on the page. The government's own model Summary of Benefits and Coverage — 169 lines today — refuses four of eight: how to end the plan, what notice you must give, whether the other party can change the terms, and what notice you get first. "Summarize my contract" is a crowded idea. Telling you *countably* what your document fails to say is not.

### Why a fabricated quote is structurally impossible

The model returns a line number. The sentence you read is `sliced` out of your document by index, on the server, after the model has finished talking. Its proposed clause text only locates the cut — if it is not in that line character for character, it is discarded and the whole line publishes. **The quote is the document.** That is a property of the data flow, not a prompt instruction, and it does not degrade when the model does.

It is a guarantee about the quote and only about the quote. The plain sentence above each quote is the model's summary, which is why it sits above the receipt rather than instead of one.

An earlier version took a *list* of supporting lines, "most direct first," and published the first. On PayPal that shipped an answer asserting the 30-day arbitration opt-out under a quote that only said arbitration is binding — synthesised across lines, and keeping the first element made the loss silent. One integer now. **The schema cannot express the answer that broke.**

### The watch, and why it stays quiet

Every url-backed document is re-read daily on a cron. When a clause you asked about changes, the notice lands in the thread you originally mailed from, quoted before and after with both line numbers — **2 minutes 17 seconds** from re-check to inbox, measured on the development deployment; on production, one real notice has gone out, on a fixture whose clauses I edited.

Plenty of things re-read a page. What matters is what must be true before anyone is emailed. **The model is never asked whether something changed** — only what the document says now, and only after three deterministic gates all open:

1. A SHA-256 of the source bytes has moved. Identical bytes cannot be a changed document, however a vendor re-renders them.
2. A SHA-256 over the parsed lines has moved.
3. The exact clause the finding used to quote is no longer in the text.

None of the three consults a model. That matters because the same six documents, read on two deployments hours apart, disagreed on **2 of 47 cells** with nothing about the documents changing. A watch that diffs model answers emails people that their lease moved because a sentence got reworded.

Two wrong turns got me here, both in the build log. **A vendor's change flag can be consumable:** Firecrawl's `changeTracking` compares against your team's previous scrape, so reading it spends it — a failed sweep advanced the baseline and every read afterwards reported *same*, the new text against the new text. **And a page changing is not a clause changing:** on one re-read the extractor stopped finding a late-fee clause that was still in the document, which on a genuinely-changed page would have told somebody a term of their lease was deleted. I also deleted the "a new clause appeared" notice rather than ship it quietly wrong — with no previous quote to search for, the last gate cannot run.

**First production sweep, six real documents, none with a changed clause: zero notices sent.** The sweep this morning: sixteen documents, zero notices. A watch is only as good as its silence, and the build log records the one morning I called that silence "proven" when the logs could only call it consistent.

### How it works

1. **AgentMail** delivers a signed inbound webhook. The `@agentmail/convex` component owns Svix verification, `event_id` dedupe, and the workpool, so a 300-page parse cannot block the next delivery.
2. **Firecrawl** fetches and parses it. A forwarded PDF is pulled through AgentMail's short-lived signed URL, so **this system never holds a copy of anybody's lease**.
3. A reflow pass rejoins lines a PDF hard-wraps at the visual column; a filter drops table-of-contents dot leaders. The document is numbered.
4. **OpenAI** classifies it, picks a predeclared checklist, and per question returns **one integer** — the line that answers it — plus a one-sentence summary. It never writes the quote.
5. **Convex** verifies that integer deterministically before anything publishes, stores the finding with its quote, replies by email, and re-reads daily on a cron.

Reply time on production across the 25 real answers it has sent: **median 21 seconds, slowest 43, every one under a minute.** The board said "about fifteen seconds" until 2026-09-14, when I subtracted two timestamps that had been in the database since the first week and found fifteen described the fastest quarter.

### Try it

Forward a lease, a terms-of-service page or an insurance renewal — PDF attachment or a link in the body — to **still-true@agentmail.to**. Quoted answers with line numbers, and a counted refusal for anything no single line states, inside a minute. Check spam the first time; it sometimes lands there. Nothing you forward appears on the public board.

### Notable

- A finding is a discriminated union, so an answered finding **cannot exist without its quote** — the illegal state is unrepresentable, not discouraged
- Three predeclared checklists, committed before any document was fetched, so no list is tuned to its own result
- Every write path is internal; the public surface is exactly two queries, and a private document's id returns nothing to a stranger — that is one of the checks
- **Eight claims this repo makes about itself are a script that exits non-zero** (`npm run gate`) — read-only against production, free, and it has caught the README drifting five times
- 99 tests, all pure
- **Every open defect is scored, dated and public** in `docs/READINESS.md`, including two currently rated high — and the build log records three retracted production claims, the latest from tonight
