# Readiness flags — open at the start of P5

Last audit **2026-09-08** (fourth pass). **M5 closed 2026-09-09**; three flags
opened the same day by the probe-v4 playtest, which is not an audit either —
it is the product being used. Score **62/100**:
`100 − 15(H5) − 5(M2) − 5(M6) − 5(M7) − 5(M8) − 1×3(L3,L4,L5)`.
Passes have scored **58 → 67 → 82 → 72 → 92 → 72 → 82 → 87 → 62** (09-03, 09-05,
09-05 evening, 09-07 morning, 09-07 evening, 09-08 morning, 09-08 evening,
09-09 midday, 09-09 afternoon). The deltas are `+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`, then
`+15 H2 closed`, then `+5 M4 closed, −15 H3 opened`, then `+15 H3 closed, +5 M3
closed`, then `−15 H4 opened, −5 M5 opened`, then `+15 H4 closed, −5 M6 opened`,
then `+5 M5 closed`, then `−15 H5, −5 M7, −5 M8`.

**Three flags in one day, all three found by sending mail.** H4, M5 and M6 were
all produced by forwarding documents and reading what came back — none by
re-reading code, and none by an audit pass. Two audits had scored 92 with H4 and
M5 already present.

**The 72s are the honest numbers to keep in the history, and there are two of
them now.** Neither is a regression. On 09-07 a flag that had been there the
whole time got found by feeding production two real links; on 09-08 two more
were found by forwarding one document and reading the reply against its source.
Four audits scored 82 or 92 with H4 open. **Both drops came from running the
product, and neither came from re-reading the code** — which is the only
generalisable finding this file contains.

**H4 opened and closed on the same day**, which is not a wash: it defeated H2's
cost bound and silently narrowed M4's unsubscribe, both of which were already on
the closed list. **Closed does not mean unreachable**, and that is the lesson
worth carrying rather than the two numbers cancelling out.

**62 is the lowest score since 09-03 and it is not a regression.** Nothing broke
on 09-09. Four documents were forwarded through production and three defects
that had been shipping the whole time became visible — one of them on the
refusal, which is the half of this product nobody else ships. **Four audits and
one code review scored this build at 82 or higher with all three present.** That
is now five for five: **everything found this week was found by sending mail,
and nothing was found by re-reading the code.**

**H5 is open. Do not fix one unasked**: read the fix order at the bottom and
ask.

## Open

### H5 — a refusal can publish a false sentence about the document (high)

`convex/reply.ts`, `refusalLine`. Every `not_stated` verdict prints:

> Searched all 120 lines. This document does not state it.

That sentence is unconditional, and the verdict behind it is not. `extract.ts`'s
prompt tells the model to return `not_stated` **"including when the document does
say it but spreads it across lines you would have to combine"** — so the system
distinguishes *absent* from *uncitable*, and then publishes the same sentence for
both. When the second case fires, the product asserts something false about a
document it read correctly.

Observed on production 2026-09-09, `probe-v4/contradiction.html`:

```
22  …TENANT shall pay a late charge of Fifty and 00/100
23  Dollars ($50.00) for that month. The late charge is additional rent…
```

`L3a` — *"What is the late fee amount?"* — was refused, **correctly**: no single
line says both *late charge* and *$50.00* (see **M8** for why the sentence is
broken in two). The reply then told the reader the document does not state it.
The document states it twice, at two different amounts.

**Scored high, and the comparison is H3.** H3 was fifteen points for confident
false refusals produced by a parser that destroyed the href. Nothing is destroyed
here — the refusal logic is right — but what reaches the reader is the same
thing: a confident false claim, on the half of this product that is
differentiated. `README.md` says the system "says plainly where the document is
silent"; on this document it said the opposite of the truth.

**Not the whole fix, and worth saying now:** `not_stated` carries a question key
and a line count and nothing else, so `reply.ts` has nothing to branch on. The
cheap honest sentence — "no single line states it" — is true in every case
including genuine absence, and it is weaker than what ships today. Whether the
stronger sentence is worth a reason field on the refusal is a product decision,
not a bug fix.

### M7 — an answer can be published under another finding's quote (medium)

`convex/reply.ts:73`, `groupByLine`. Two findings that cite the same line are
merged into one block: **both answers are kept and the first finding's quote
wins.** The second answer is then published under a receipt that does not
license it.

Observed on production 2026-09-09, `probe-v4/injection.html`, line 60:

| stored finding | its own quote |
|---|---|
| `T3a` | `We may modify this Agreement at any time, including the terms governing pricing, features, and permitted use.` |
| `T3b` | `We will provide you with at least thirty (30) days' notice by email to the address associated with your account before a material change takes effect…` |

Both findings are individually correct and each carries the right quote in the
`findings` table. The **email** printed only `T3a`'s, under both answers, so
*"You receive at least 30 days' email notice"* went out beneath a sentence that
does not mention notice.

**This is M5's failure mode one layer up**, and the function's own comment says
why it was safe when written: before `excerpt` shipped on 2026-09-04, two
findings on one line always carried the *identical* whole-line quote, and
grouping them lost nothing. `excerpt` made that assumption false and nothing
re-read the assumption.

Fix: key the group on the line **and** the quote. Identical quotes still merge,
which is the duplicate-receipt problem the grouping was added for.

**The gate cannot see this one and passed 7/7 with it open**, which is the part
worth keeping. "Every published answer carries its quote" reads the `findings`
table, where both quotes are correct and present. The defect is in what the
email prints, and nothing checks the email against the rows it was rendered
from. Same for H5: the gate reads verdicts, not the sentence published under
them.

### M8 — reflow leaves a sentence broken when the wrap lands after a numeral (medium)

`convex/lines.ts`, `reflow`. A wrapped line is joined only when the previous line
ends `[a-z,;:)]` **and** the next starts `[a-z("']`. A money clause breaks both
halves:

```
22  …TENANT shall pay a late charge of Fifty and 00/100
23  Dollars ($50.00) for that month.
```

Ends in a digit; continues with a capital `D`. So the sentence stays in two
pieces, no single line carries the obligation and its amount, and the answer is
refused — which is the root cause under **H5**'s false sentence.

**Why it is scored rather than shrugged at:** the wrap point is arbitrary, but
what it breaks is not. Amounts are where numerals are, and "what does this cost
me" is the question this product exists to answer. The Livonia late fee is
citable today because its wrap happened to land elsewhere.

**The fix is not one character.** Adding `0-9` to the trailing class does not
help while the continuation test still rejects a capital `D`, and loosening
*that* would start welding sentences onto headings — which is the guard reflow
was built around. Measure a candidate against the four real PDFs before
believing it, the way the original 1,688-to-0 measurement was taken.

### M6 — Firecrawl's PDF parse is not deterministic (medium)

Observed on production 2026-09-08, not inferred. The CMS Summary of Benefits at
one URL, one `PARSER_VERSION`, one afternoon:

| read | lines |
|---|---|
| 11:17 cron sweep | 171 |
| 17:49 round trip | 174 |
| 18:31 forward | 174 |
| 18:46 forward | **171** |

The file did not move. Downloaded at 17:49 and again at 18:47, `sha256
863bf56f…` both times, `cmp` clean. Two hashes of the same bytes beside four
different readings of them.

**Cost:** every flip moves `contentHash`, so the early exit in `readAndPublish`
misses, the document is re-extracted, and two model calls are spent to
rediscover the same answers. Small at six documents; it grows with the corpus.

**Why it is scored at all:** `lineCount` is on the public board and the refusal
sentence quotes it — "Searched all 171 lines" one hour and "all 174 lines" the
next, for a document nobody touched. That is a public number moving with no cause
a reader can see, on the surface about to become a landing page, and this project
has had a number move unexplained three times already.

**What it is NOT:** a broken guarantee. Every churn produced a hash change, a
full re-extraction and **no email**, because `change.diff` asks whether the
quoted clause is still present and it always was. This is the strongest evidence
yet for hashing the text rather than diffing model runs — the second gate,
exercised against real parser noise on production instead of an edited fixture.

Confirm the scope before acting: this is one document. Whether it affects the
other PDFs is unmeasured, and the fix is not obvious — normalising the parse
would mean finding what actually varies first.

### M2 — attachment documents never dedupe (medium)

`convex/mail.ts:769`. `attach` skips the `by_url` lookup when `url === null`,
which is every forwarded attachment.

Confirmed live: dev holds two identical Livonia rows (`j5728ejqz…`,
`j57fyw7wd…`), 418 lines each, created 16 minutes apart.

Fix: dedupe attachments on `contentHash`, which is already computed.

### Low

- **L3** `convex/documents.ts:28` — `recent` orders by `_creationTime`, but a
  re-read patches `fetchedAt`. A freshly re-checked document never resurfaces
  on the board. Needs a `by_fetchedAt` index if freshness is the intent.
- **L4** `convex/mail.ts:326` — an unrecognized payload is dropped with
  `console.error` and no record, which is invisible in a deployment that
  retains no failure logs.
- **L5** `convex/mail.ts:894` — `attach` notifies at most `.take(100)` threads.
  Subscriber 101 is silently never told the clause moved, which is the one
  thing the watch exists to do. Unlike the other bounded reads, this one
  carries no `ponytail:` note naming its ceiling.

## Candidate — evidence too thin to score

**A ranging question refused on a document made of answers.** On production
2026-09-09, `probe-v4/fee-schedule.html` — thirty-three rows of prices — refused
`U2`, *"What does it cost you: fees, charges, deposits, or penalties?"*, and
published `Searched all 46 lines. This document does not state it.` Line 6 alone
reads `Late payment charge | $75.00 | Assessed on any rent not received in full
by the end of the fifth day of the month`, which states a cost by itself, so
unlike **H5** this refusal is not explained by the one-line contract.

**Why it is not scored:** one document, one question, and no root cause. It may
be the model declining a question that ranges over thirty-three rows when the
contract demands a single line; it may be ordinary extraction noise, which was
measured at 2 cells in 47 drifting between two runs on 09-04. **Confirm before
acting:** forward the same fixture twice more and see whether `U2` refuses all
three times. A question that refuses once is noise; one that refuses every time
is a defect in how a list-shaped document meets a one-line contract.

*(The line-count candidate opened earlier today was settled the same day by four
readings of a byte-identical file, and is now scored as **M6** above. It was a
candidate for about six hours.)*

**Hash churn on dynamic pages.** Note that M6 makes this one harder to read, not
easier: a `contentHash` that moved on PayPal may be per-request page content, as
this entry assumes, or the same parser non-determinism M6 documents. The two
scrapes below no longer distinguish them on their own — the PDF case is settled
because the bytes could be hashed, and a live page cannot be. `lines.ts` `fingerprint` hashes the stripped
lines; `stripMarkup` removes tags and URLs but not dates, prices, or
per-request text. On dev, PayPal's `contentHash` moved between two sweeps
twelve minutes apart while the other seven documents held — one data point,
and it may equally have been a real edit. If it is per-request variation it
costs two model calls per document per day and produces no email, because
`change.diff` correctly suppresses it.

Confirm before acting: run
`npx convex run mail:probe '{"url":"https://www.paypal.com/us/legalhub/useragreement-full"}'`
twice, ten minutes apart, and compare `contentHash`. Two scrapes settles it.

## Closed — do not re-flag

- **M5 (`excerpt` could trim away the part of the line that licenses the
  answer)** opened 2026-09-08, closed 2026-09-09. On a markdown table row the
  published quote was one cell, so the SBC deductible receipt read `"$500 /
  individual or $1,000 / family"` with the word *deductible* nowhere the reader
  could see. **The inference was measured before it was fixed**: the 09-08
  transcript recorded as *inferred* that the licensing cell was on the cited
  line at all, and one Firecrawl scrape on 09-09 settled it — line 5 is
  `What is the overall deductible? | $500 / individual …` and line 11 is
  `Do you need a referral to see a specialist? | Yes. | This plan will pay …`.
  Both cells were on the line and both were trimmed.
  **The fix is one rule**: on a table row the receipt opens at the ROW rather
  than at the matched cell. The END still snaps to the cell, so the third
  column's "Why This Matters" commentary — the thing cell-snapping was added
  for — stays out. Prose lines are untouched, and the 588-character Livonia
  receipt that motivated `excerpt` is not a table row.
  **The candidate written down here was wrong and this is the reason to keep
  it written down.** "Publish the row's first cell alongside the matched cell"
  would stitch cells 1 and 3 of line 11 into a string that is not in the
  document — and `change.stillSays` decides whether to mail a subscriber by
  searching the document for exactly that string. Every re-check of an
  unchanged document would have reported the clause `gone`. A receipt has to be
  one unbroken slice of one line, and a test now pins that property.
  **Three tests, all observed failing against the old `excerpt` first.**
  **Verified end to end on development**, not by test alone: a real `mail:probe`
  scrape and two real model calls republished all four SBC answers, and each now
  carries its licensing cell — U2 `What is the overall deductible? | $500 /
  individual or $1,000 / family`, U1a/U1b `Do you need a referral to see a
  specialist? | Yes. | …`, U4 the row through `Preauthorization is required`.
  The AT&T and Spotify receipts are byte-identical, which is the check that the
  rule only fires on rows.
  **Not verified on production**, which cannot be deployed from a Claude
  session. The 09-08 transcript's four receipts are unchanged until it is.

- **H4 (both spend gates and the unsubscribe keyed on a string the sender
  controls)** opened and closed 2026-09-08. `threads.fromEmail` was the raw
  `From` header, so a display name was part of a sender's identity: editing one
  minted fresh quota (defeating H2) and one person's two mail clients were two
  people whose STOP half worked. `convex/sender.ts` parses the header with the
  RFC 5322 grammar and stores the lowercased mailbox.
  **Checked first that nothing upstream already knew** — the component's own
  `inboundMessages` schema declares `from: string` and passes AgentMail's message
  through as `v.any()`, so there was nothing structured to prefer.
  **A grammar rather than a regex, for a reason with a test behind it**:
  "take the last angle-bracket pair" survives the quoted comma in our own
  production row and then reads `Name <a@x.com> (note <b@evil.com>)` — a valid
  header from `a@x.com` — as `b@evil.com`. Refuses rather than guesses on a
  two-mailbox header (taking the first would let an attacker's STOP silence a
  victim) and on a group like `undisclosed-recipients:;`, which parses
  successfully with an `undefined` address.
  **`user+tag@` is deliberately NOT merged**; the reason and its cost are in
  `sender.ts` and pinned by a test. Do not "fix" it into stripping without
  reading that comment — the local part is opaque per RFC 5321 §2.3.11 and this
  key gates an unsubscribe.
  **A seventh gate check** asserts every stored `fromEmail` is a bare address,
  independently of `senderAddress` — asking the parser whether the parser was
  right proves nothing. **It was observed FAILING on production first** (`6 of 6
  threads carry a sender that is not a bare address`) and passing after the
  backfill, which is what distinguishes it from a check that cannot fail.
  **Backfilled both deployments** — dev 13 scanned / 12 rewritten / 0
  unidentifiable, exposing `randall@example.com` held as two different strings;
  prod 6 / 6 / 0. Idempotent, and tested to be.
  **Verified by mail on production, and the number was predicted first:** seven
  threads carried five distinct documents, so a STOP had to report five, and it
  did — in three seconds, with no scrape and no model call. **Without the
  backfill that same STOP would have reported 1**, leaving six older threads
  enrolled and still being mailed. All 8 rows came back stopped; a fresh forward
  afterwards created a live thread, so re-enrolment works as designed.
  **Verified with two different live headers**, after the display name was
  changed on the account: `"Randall LaPoint, Jr." <rplapointjr@gmail.com>` and
  `Lokie-ree <rplapointjr@gmail.com>` — a quoted string containing a comma and a
  bare atom — both stored as `rplapointjr@gmail.com`, 10 threads, one identity.
  Under the old code the second was a new person with fresh quota and a STOP that
  reached nine of ten threads.
- **M3 (a failed `watch.recheck` was silent to everyone)** closed 2026-09-07.
  `documents.watchError` records why the last re-check failed; `recheck` catches,
  records and **rethrows**, so the workpool still retries and the visibility is
  not bought by swallowing the failure. Cleared on the next success by both
  paths — `checked` on the early exit, `attach` on a full re-read — so the field
  means "failing now", not "failed once in July". **Never on the public
  surface**: `documents.recent` answers the open internet with whole rows, and
  this string is a vendor's error body, so `documents.ts` omits it from the
  validator and drops it from the rows.
  **A sixth gate check reads it**, via the CLI with the runner's own
  credentials, which is what makes recording it worth anything — and it reaches
  private documents (10 rows on prod, not the 6 public ones), the case the board
  cannot show and the likeliest to be quietly broken.
  **Verified on development, both directions:** the fixture was replaced with a
  142-byte stub, the sweep recorded `Firecrawl returned 58 chars … too short to
  be the document` and left `lastCheckedAt` frozen at 16:55 — the exact symptom
  this flag described — then the real fixture was restored and the next sweep
  cleared the field and advanced the stamp to 17:11. The public query returned
  11 keys and `watchError` was not among them while a PUBLIC document was
  carrying one.
- **H3 (a link-shaped page produced confident FALSE refusals)** closed
  2026-09-07. `stripMarkup` deleted every href; on a page whose body lives
  behind its links the href WAS the answer. Fixed with one rule and no keyword
  list — keep the address unless the label already contains it, compared on
  alphanumerics — which is the AT&T argument (`att.com/howtocancel` beside its
  own href is the same string twice) generalised rather than a guess about
  which labels sound uninformative. The bare-url pass moved first behind a
  lookbehind, or it would delete the addresses the link pass had just kept.
  **Do NOT re-propose a shell-page detector**: three were predeclared and
  measured on 24 documents that morning and all three false-positived on real
  documents — `%chars in lines ≥120 < 60` catches the DOL COBRA model notice
  (12) and HUD-5380 (28); a `"learn more"` rate catches Microsoft's genuine
  privacy statement (7.01) and MISSES `meta.com/legal` and `apple.com/legal`
  (0 each); refusal rate puts Meta's 75% inside the range of the CMS Summary of
  Benefits (63%). **Verified on development:** 562 lines change across the ten
  production documents with no document's line COUNT moving, 0 bare urls
  survive anywhere, the AT&T receipt is untouched, and two published `T2b`
  receipts became usable — Spotify's had read "…or by clicking here and
  following the instructions" and now carries
  `support.spotify.com/article/cancel-premium/`.
  **What remains unfixed and is not a flag:** `facebook.com/privacy/policy` is a
  summary shell whose sections are headings with the body one link away. Keeping
  hrefs does not put Meta's text on the page and nothing cheap does. Its
  refusals are honest about what that page contains.
- **The parser-shift hazard** closed with it, and this is the part to keep.
  `contentHash` cannot tell a moved document from a moved parser: replaying all
  54 published prod findings through the real `change.stillSays` under the new
  parser reported **6 as `gone`** with nothing having changed. `documents.parserVersion`
  makes `mail.attach` re-baseline rather than diff when a row's version is not
  current, and `mail.checked` stamps the version on the early exit so a document
  the change did not touch cannot keep a stale version and swallow a REAL change
  later. **Verified on development: a sweep that re-extracted five documents
  under the new parser produced 0 new `changedAt` stamps across 76 findings.**
  There is no deploy ordering to get right. The three attachment-backed rows
  stay at version 1 forever, which is correct — they carry no url, are never
  re-checked, and are therefore never diffed.
- **M4 (no unsubscribe)** closed 2026-09-07. `STOP` or `UNSUBSCRIBE` as the
  first non-empty line of a reply, recognised in `mail.received` ahead of the
  no-document branch (a bare STOP carries no document) and ahead of both spend
  gates (refusing an unsubscribe because the sender mailed too much is
  backwards). Two scopes — the thread it arrived on, and every thread from its
  sender — because a cc'd reader was enrolled by somebody else's forward and the
  row is not keyed on them. Honoured in the change-notice fan-out only, which is
  the sole unsolicited mail. **Verified on development, observed not reasoned:**
  a sender's STOP stopped 6 threads and generated "about 5 documents"; a cc'd
  stranger's `unsubscribe` stopped a thread started by someone else and said "1
  document"; then the fixture's late fee moved $250 → $400, the sweep stamped
  `L3a` changed at 16:37:44 and **scheduled no mail** — the same thread and
  fixture that were emailed on 09-05, differing only by `stopped: true`. The
  WATCH paragraph no longer ends "You do not need to do anything."
- **H2 (unbounded, recurring spend on a publicly-listed inbox)** closed
  2026-09-05. Two gates in `mail.received`, because they stop different things:
  a `@convex-dev/rate-limiter` token bucket keyed on `fromEmail` (10/hour,
  burst 5) bounds the burst, and a cap of 25 distinct documents per address
  bounds the standing daily cost — the half a refilling limiter cannot reach,
  since a sender adding one URL a week accumulates an unbounded daily bill at a
  perfectly polite pace. Both run after the thread row exists and before the
  scheduler, so a refused message is recorded and answered and costs no vendor
  call. **Verified:** `tsc -b` clean, 66/66 tests. The refusal path has not yet
  been exercised end to end against a live inbox — that is what `npm run gate`
  is for, not a reason to re-flag this.
- **H1 (public read surface leaked forwarded private documents)** closed in P3
  and verified on production: all five board rows carry `isPublic: true`, and
  `findingsFor` gates the client-supplied id. The proposed `url !== null` fix
  was falsified before it was written — a mailed *link* has no attachment, so
  `title` falls back to the sender's subject. Provenance is stored instead.
- **M1 (a failed ingest is silent)** closed in P3, and exercised for real on
  2026-09-04 when Gmail's link wrapper broke the first production forward.
- **The Firecrawl cache finding** closed 2026-09-05 with `maxAge: 0`.
- Prod `functionSpec` matches source: 15 functions, 2 public, both read-only
  queries, no drift. `tsc -b` clean, 64/64 tests pass.
- Prod and dev `contentHash` are byte-identical for all five shared documents,
  so the fingerprint is deterministic across deployments.
- Dev-only legacy rows lacking `isPublic` read as private and stay off the
  board. Safe direction, and not present on prod.

## Listed, deliberately NOT scored — leave them alone

Documented decisions with named upgrade paths:

- `v.any()` on `mail.received` args — every field is narrowed, route is
  Svix-verified.
- The two `as unknown as` casts against `@agentmail/convex` 0.1.0
  (`http.ts`, `mail.ts`), both carrying `ponytail:` comments.
- `watch.watchable`'s `take(200)` and `mail.send`'s no-retry, both with a
  `ponytail:` note naming the upgrade.
- The document cap's `take(200)` over one sender's threads in `mail.received`.
  An address past 200 threads could undercount its own distinct documents; the
  limiter above it caps arrivals at ten an hour, so it cannot get there quickly,
  and the upgrade named in the comment is a count kept on the sender rather than
  derived.
- The `occRetried` warning on `agentmail/callbackPool` (2 calls,
  `occ_retry_count: 0`) — inside the component's sandboxed tables, not our
  code, not actionable.

## Coverage — what the audit could not see

Log evidence has been thin since 09-03 and mostly still is: prod log reads are
refused by the read-only MCP selector, and dev retains zero entries. "No failures
observed" was absence of evidence rather than evidence of absence.

**M3 closing changes that for the one case that matters.** A failed re-check now
writes `documents.watchError`, and `npm run gate` reads it on every run across
both public and private documents. That is not general log access — a failure
anywhere else is still invisible — but the watch is the part that runs unattended
every day, and it is no longer the part nobody can see.

**What `scripts/reconcile.sh` still cannot settle (2026-09-08).** The doc
reconciler closed eight drifts, including three open flags above that pointed at
the wrong `mail.ts` line. Four classes stayed UNVERIFIABLE across every run and
will not resolve on another. **Do not read the UNVERIFIABLE count as a score** —
it grows every time a dated log entry quotes a file and a line, which is the
point of a log:

- **Two Gmail-wrapped URLs** in `transcript-sbc.md` and `hackathon.md` are
  elided with `…` in the prose. They cannot be fetched as written, and expanding
  them would edit a quoted receipt.
- **`att.com/howtocancel` and `healthcare.gov/sbc-glossary`** answered on two
  runs and returned no HTTP response at all on two others. A network failure
  here is not evidence a link is dead, and the report refuses to score it as
  one — but it does mean **link liveness is sampled, not known**.
- **Line numbers inside dated log entries** point into the tree as it stood that
  day. Whether one was right when written cannot be decided by reading today's
  file.

The general gap is unchanged and worth stating plainly: the reconciler checks a
link for a **status code**, not for saying what the doc says it says. HTTP 200
is not agreement, and no check here reads a page and compares it to the sentence
citing it.

**One thing the rows said that the logs could not (2026-09-06).** The board carries
`lastCheckedAt`, `fetchedAt` and `verifiedAt`, and all three are readable without
credentials. On the 09-06 sweep they show six documents stamped inside two
minutes at the cron's scheduled 11:17 UTC, three of them re-extracted and three
stopped before the model — which is the early exit, the schedule and both change
gates, observed from outside with no log access at all. Where a claim can be
asked of the data instead of the logs, ask the data.

## Fix order

**H5 → M7 → M8 → M2 → M6 → (L3, L4, L5).** M5 is closed.

H5 and M7 both stop something false being published and both have a one-line
first fix, which is why they go before the flags that merely cost money or
patience. H5 leads because its falsehood is on the refusal — the claim no rival
makes — and M7 follows because it is understood completely: key the group on the
quote as well as the line.

M8 sits behind them for M6's reason: its first step is a measurement. "Join a
line ending in a digit" is a guess until it has been run against the four real
PDFs that produced reflow's original 1,688-broken-clauses-to-0, and a reflow
change moves every line number in the corpus.

M6 is last of the mediums and that is deliberate: its first step is a
measurement, not a fix. Nobody knows yet whether the non-determinism touches the
other five documents or only this PDF, and "normalise the parse" is not a task
until something has been shown to vary. M2 is understood.

H4 went first and is closed. It was the only flag that made a promise this
project had already sent to a real inbox untrue — the STOP sentence went out in
the 09-08 reply and is quoted verbatim in
[`transcript-sbc.md`](transcript-sbc.md) — and its unsubscribe half failed for
people who had done nothing but own two mail clients.

M5 went first, because the transcript is meant to be the first thing on the
landing page and M5 was the reason a hostile reader would disbelieve it. It cost
one Firecrawl scrape to settle the inference the transcript had left open, and
that scrape is what showed the fix written down here would have broken the
watch.

Everything above M2 is closed. H2 was first because it was the only one that
cost money while nobody was watching; M4 next, because P5 turned it from a flag
about one stranger into a flag about everyone on a forwarded thread; H3 after
M4 deliberately, because it is the deploy most likely to send mail nobody asked
for and M4 is the way out for anyone wrongly mailed; M3 last of the four,
because until it landed the next audit had silence where evidence should be.

M2 is what is left, and it is cheap: dedupe attachment documents on the
`contentHash` that is already computed.
