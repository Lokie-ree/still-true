# Readiness flags — open at the start of P5

Last audit **2026-09-08** (fourth pass). **M5 closed 2026-09-09**; three flags
opened the same day by the probe-v4 playtest, which is not an audit either —
it is the product being used; **H5 and M7 closed the same evening**, together,
by an invariant rather than by two patches — and **H6 opened the same evening**,
by the A5 check written to confirm that fix on production. **M10 opened 2026-09-11**, and it is the only flag today that is not also closed
today. Score **62/100**:
`100 − 15(H6) − 5(M2) − 5(M6) − 5(M8) − 5(M10) − 1×3(L3,L4,L5)`.
Passes have scored **58 → 67 → 82 → 72 → 92 → 72 → 82 → 87 → 62 → 82 → 67 → 62** (09-03, 09-05,
09-05 evening, 09-07 morning, 09-07 evening, 09-08 morning, 09-08 evening,
09-09 midday, 09-09 afternoon, 09-09 evening, 09-09 night, 09-11). The deltas are `+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`, then
`+15 H2 closed`, then `+5 M4 closed, −15 H3 opened`, then `+15 H3 closed, +5 M3
closed`, then `−15 H4 opened, −5 M5 opened`, then `+15 H4 closed, −5 M6 opened`,
then `+5 M5 closed`, then `−15 H5, −5 M7, −5 M8`, then `+15 H5 closed, +5 M7 closed`, then `−15 H6`, then `−5 M10` — 2026-09-11,
where H8, M9 and L6 all opened and closed inside one day and move nothing.

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

**62 was the lowest score since 09-03, it was not a regression, and it lasted one
evening.** Nothing broke on 09-09. Four documents were forwarded through production and three defects
that had been shipping the whole time became visible — one of them on the
refusal, which is the half of this product nobody else ships. **Four audits and
one code review scored this build at 82 or higher with all three present.** That
is now five for five: **everything found this week was found by sending mail,
and nothing was found by re-reading the code.**

**Amended 2026-09-09 (evening): there is a third discovery mode, and it found
three things in twenty minutes.** Neither auditing the code nor sending mail
found that `src/App.tsx` was still shipping H5's false sentence and M7's wrong
receipt after both were closed, or that the board led with the one document
that refuses nothing. All three were found by **opening the public page and
reading it against the email** — the two renderers put side by side. Sending
mail exercises one of them. A code audit reads files one at a time, which is
exactly how a defect fixed in `reply.ts` and alive in `App.tsx` stays
invisible. **The mode is: compare the two surfaces that are supposed to say the
same thing.**

**Amended 2026-09-10: there is a fourth, and it is free.** H7 — the README and
the board both claiming *"the model never writes the answer text"* when
`extract.ts` forbids the model to copy document text into `answer`, making that
field the one thing on the page it does write — was found by reading a published
sentence against the prompt that produces the field it describes. No deploy, no
mail, no model call. The other three modes compare a rendering to something.
**This one compares a claim about the pipeline to the pipeline**, and the surface
it applies to is every sentence in `README.md` and `src/App.tsx` that begins
"the model" or "the system". Opened and closed the same day; see *Closed*.

**The three flags were not three problems.** M5, M7 and the 09-04 excerpt bug
were one class — *the receipt published under an answer was not that answer's
receipt* — walking down a pipeline and being swatted at each station. H5 and M7
closed together, behind a property test over the rendered reply rather than two
more patches. M8 is what is left of that day, and it is a parser flag rather
than a receipt one.

**Amended 2026-09-11 (afternoon): H8, opened and closed by running the rehearsal
instead of reading it.** A re-check re-classified the fixture — `other` at 11:18
UTC, `lease` at 15:29 — and a re-classification skips every change in `diff`,
replaces the findings with another checklist's, and ends that document's watch
in silence. Three audits had read the line that does it. **Nothing that reads
code was ever going to find this**, because the defect is a relationship between
a model call in `mail.ts` and a `questionKey` comparison in `change.ts` that runs
a day later. It is in *Closed*; the score line does not move.

**Amended 2026-09-11: M9 and L6, opened and closed the same morning, by opening
the deployed board on a phone.** Not a new discovery mode — it is the 09-09 one,
*open the public page and read it* — but run on real hardware and, decisively,
run on **every card** rather than the first screen. The 09-10 redesign ran the
same check at 390px and recorded *"no horizontal overflow"*; the overflow was in
the sixth card. Both flags are in *Closed* and the score line does not move. The
lesson is larger than either of them: **this page's failures keep being below the
fold, and its checks keep being of the top of it.**

**H6 is open, and it is the first flag to reach the central claim rather than
the wording around it.** M2, M6, M8 and the lows are known and parked — do not
fix one unasked: read the fix order at the bottom and ask.

**Four flags in one day, all four found by sending mail**, and the fourth was
found by the check written to confirm the third was fixed.

## Open

### H6 — an answer can out-run the line it cites (high)

`convex/extract.ts`: the `SYSTEM` prompt's central instruction, and `verify()`,
which cannot check it.

The contract is stated to the model in as many words: *"That line must state the
answer BY ITSELF: a reader shown only that line must be able to see that your
answer is true."* On production 2026-09-09 at 15:13 UTC, on
`probe-v4/contradiction.html`:

```
The late fee is $50.00.
  "Dollars ($50.00) for that month."
  line 23 · read Sep 9
```

Line 23 does not say *late fee*. Those words are on line 22, which reflow
declined to join (**M8**). A reader shown only the cited line cannot see that
the answer is true, which is the one thing the contract forbids.

**What did NOT fail, and the distinction is the whole product.** The quote is
verbatim from the document, located by index, after the model finished talking.
Nothing was fabricated and the structural guarantee — *it cannot show you a
sentence that is not in your document* — holds exactly as advertised. What failed
is the claim one level up: that the sentence shown **supports** the answer above
it. That has always been a model instruction rather than a structural property,
and this is the first time it has been observed breaking on production.

**How it surfaced, which is worth as much as the flag.** This document refused
the same question at 14:15 and answered it at 15:13, unchanged. The morning's
refusal was correct and produced **H5**; the afternoon's answer is incorrect and
produces this. The same extraction noise measured at 2 cells in 47 on 09-04 is
what moved it, and on the same run the deposit answer flipped from the addendum's
14 days to the body's 30. **A5 was written to confirm H5's fix and found a worse
flag instead**, which is the argument for predeclared checks rather than for
re-reading code.

**Do not reach for a checker.** Three shell-page heuristics were predeclared and
measured on 24 documents on 09-07 and all three false-positived; a fourth
heuristic — "the cited line must contain a noun from the answer" — is the same
mistake wearing a different hat, and a false refusal is worse than this. The
candidates, in the order they should be considered:

1. **Fix M8 first.** The orphaned `Dollars ($50.00)` line exists only because
   reflow will not join a wrap that lands after a numeral. That removes this
   instance and any like it, and it is a parser fix with a measurable before and
   after — unlike anything that tries to judge support.
2. **Then measure whether the class recurs** on a corpus where no clause is
   split. If it does not, the class was M8 wearing a mask.
3. **A second model call to verify support is the last resort**, and it puts a
   non-deterministic judgment inside a gate — the thing `change.diff` was
   deliberately built to avoid. It would need the 09-04 drift measurement run
   against it before anyone believes it.

**Not scored higher than 15** because the structural guarantee is intact and the
receipt is still a real sentence a reader can find. Not scored lower because the
answer above it was wrong, on production, in a reply a person would have acted
on.

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

### M10 — the sweep's retries arrive during the minute they are not welcome (medium)

`convex/watch.ts`, the `Workpool` retry behaviour. Opened 2026-09-11 by reading
the deployment's own logs after the 11:17 UTC sweep.

**11 `Firecrawl 429` failures in 42 seconds**, and two documents —
`probe-v4/fee-schedule.html` and `probe-v4/injection.html` — exhausted all three
attempts and carried a `watchError` for a day. Twelve of fourteen survived, so
nothing on the board was wrong; the flag is that **which two fail is a coin
toss**, and tomorrow it can be any document, including one a stranger forwarded.

**The limit is Firecrawl's. The amplification is ours.** `maxParallelism: 2`
caps concurrency, not rate: two at a time still puts 14 documents — 3 of them
PDFs, which cost more than one request each — through in seconds. Then
`initialBackoffMs: 10_000, base: 2` schedules all three attempts at 0s, 10s and
30s, inside the same 60-second window that is already exhausted. Firecrawl
replied `retry after 40s, resets at 11:18:07`; we came back at 10s and 30s.

**Mitigated the same day, not closed.** The backoff is now 60s — attempts at 0s,
60s and 120s, each in a window Firecrawl has reset. That is one constant and it
removes the self-inflicted half. It does not remove the fan-out: the sweep still
fires the whole corpus as fast as it can, and a corpus big enough exhausts the
limit on **first** attempts, where no backoff helps.

**The fix is a rate limiter, and this deployment already installs one.**
`@convex-dev/rate-limiter` gates the mail path; the same component can gate
Firecrawl calls to N per minute so the sweep paces itself instead of apologising
afterwards. Sizing it needs the real per-minute limit, which nobody has read off
the plan: the 429 bodies report `Consumed (req/min): 35` and
`Consumed (req/min): 11` in the same minute, so the number is not known from
here. **Reading it is step one and it is free.**

**Scored 5, not 15.** Every failure is recorded on the row (M3's fix), surfaced
by `npm run gate`, and cleared by the next successful read. No answer is wrong
and no quote is stale. What is at risk is the promise the watch makes, on a day
nobody is looking.

**Not scheduled before the video.** The backoff ships tonight only because it is
one constant in a deploy that is happening anyway. The limiter waits.

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

- **H8 (a re-check re-classified the document, and a re-classification silently
  ends the watch)** opened and closed 2026-09-11, found by running the proving
  run the video depends on. `readAndPublish` called `classify()` on every
  reading, including a re-check. `classify` is a model call and it is not
  deterministic: on production the video fixture read as **`other` at 11:18 UTC
  and `lease` at 15:29**, one word of it changed and nothing else.

  That is not a cosmetic wobble. `diff` matches a new finding to a prior one by
  `questionKey`, and *a question the previous reading never asked is a first
  answer, not a change* — correct on its own, and catastrophic across a
  checklist boundary, where **every** key is new at once. So every change is
  skipped, the stored findings are replaced by another checklist's answers, and
  **the watch on that document is over**: no error, no `watchError`, no notice,
  and a reply already told that sender it would keep watching. The next reading
  compares against the new baseline and finds nothing either. It is silent, it
  is permanent, and nothing in the product would ever have reported it.

  Fixed by pinning: on a re-check, the checklist is the one the document was
  FIRST answered against. `hashOf` became `priorReading` and returns the stored
  `kind` with the hash — the same query, on the same path, already called there
  — and `classify` now runs on a first reading only. A lease does not stop being
  a lease between two readings, and the first reading is the one a reply was
  built on and a sender was told about.

  **Scored 15 and it is the fourth flag this week found by using the product
  rather than reading it.** The two audits and the code review that have read
  `mail.ts` since 09-04 all read this line and none of them saw it, because
  nothing is wrong with the line: it is wrong only in relation to `diff`, in a
  file it does not import, on a path that only runs a day later. **The score
  line does not move** — opened and closed inside one pass, like H7 — but this
  one had been shipping since the watch existed.

  **Not verified on production**, which cannot be deployed from a Claude
  session. The check after the deploy is the proving run: edit the entry notice,
  `bash scripts/recheck-fixture.sh`, and confirm `kind` is still `lease` and a
  notice quoting L2 arrives.

  **What it cost, recorded because the alternative was worse.** It surfaced at
  15:29 on the day before the shoot, in a rehearsal step written to catch
  exactly this and nearly deleted twice for being redundant. Tomorrow morning it
  would have produced an empty inbox, no error anywhere, and no time.

- **M9 (one quoted URL pushed the board off the right edge of a phone)** opened
  and closed 2026-09-11. PayPal's line-74 clause quotes
  `(https://www.paypal.com/us/webapps/mpp/ua/upcoming-policies-full?locale.x=en_US)`
  — 80 characters with no break opportunity. A grid track's automatic minimum is
  its content's min-content width, so that one token sized the finding column:
  **539px of content in a 315px track** with `main` at 412px, measured on
  production before anything was touched. The column grew past the card and every
  sibling line in it then laid out at the expanded width, so the answer and the
  refusal spilled too, though neither contains anything unbreakable. **The quote
  is what ran off screen** — the largest text on the card and the entire claim of
  the product.
  The second symptom, the whole page rendering at ~57% of the viewport including
  the hero, was **the same defect**: one card overflowed the document and mobile
  Chrome shrank the document to its scroll width. Nothing is sized against a
  fixed width; `max-w-2xl` is inert below 672px. Fixed with
  `[overflow-wrap:anywhere]` on the findings block and `minmax(0,1fr)` on both
  content tracks in `src/App.tsx` — no breakpoint, no media query, no Convex
  function touched.
  **This reverses a claim in `hackathon.md`**: the 09-10 redesign entry says
  *"Mobile at 390px holds; no horizontal overflow."* PayPal was enrolled 09-04
  and its quotes have not moved since, so the overflow was present the whole
  time. The check was run and found nothing because **the defect was in the sixth
  card** — the same shape as the 09-06 page-order finding, where the
  differentiator sat in the fourth card below the fold. The rule is not "test
  mobile"; it is that a check of a rendering has to visit every row of it, and
  `[...document.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1)`
  is how you stop that depending on which card was on screen. Two elements
  before, zero after.
  **The score line does not move**: opened and closed inside one pass, like H7.
  Recorded because the do-not-re-flag list is what stops the next session
  rediscovering it — and because `overflow-wrap` is now load-bearing on every
  quote this product will ever publish.

- **L6 (the gutter counted backwards inside a card)** opened and closed
  2026-09-11. PayPal's line numbers read **1071, 1077, 373, 72, 74, 452, 752**.
  `groupByReceipt` returned its map in insertion order, which is `findingsFor`'s
  order, which is `_creationTime`. This is the 09-06 page-level ordering defect
  one level down — the same accident of seeding time, inside a card instead of
  across them — on a page whose layout asserts it is a document. Sorted by
  `lineNo`. Refusals are deliberately still first and still unsorted: they have
  no line.

- **H7 (the README and the board claimed the model never writes the answer
  text)** opened and closed 2026-09-10. `README.md`'s "Why it can be trusted"
  said *"The model never writes the answer text"* and the `src/App.tsx` footer
  said *"the model returns a line number and never writes the sentence"*.
  `extract.ts`'s prompt tells the model *never to copy document text into the
  `answer` field* — so the plain-English answer **is** model prose, and both
  sentences were false about it. The guarantee they were reaching for is real
  and is about the **quote**:
  `verify()` calls `excerpt(lines[lineNo - 1], claim.support_quote)`, `excerpt`
  returns `whole.slice(start, end)` of the document line, and a proposed clause
  not found in that line character for character is discarded so the whole line
  publishes. Both places now say the summary is the model's and the quote is
  not.
  **Found by reading a published sentence against the prompt that produces the
  field it describes** — a fourth discovery mode, and the cheapest one yet: no
  deploy, no mail, no model call. The three earlier modes all compare a
  rendering to something. This one compares a *claim about* the pipeline to the
  pipeline.
  **The score line does not move.** It opened and closed inside one pass and
  never survived a pass boundary, unlike H4 on 09-08. Recorded here anyway
  because it is the fourth retraction of the same class — *this project
  published something about itself that its own source contradicts* — and the
  do-not-re-flag list is the only thing that stops the next session
  rediscovering it.
  **Not verified on production**, which cannot be deployed from a Claude
  session. The check after the next deploy is: load the board, read the footer.

- **H5 (a refusal published a false sentence about the document)** opened and
  closed 2026-09-09. Every `not_stated` printed *"This document does not state
  it"*, and `extract.ts` tells the model to refuse **also** when the document
  says it across lines you would have to combine — so the verdict meant one of
  two things and the sentence asserted the stronger one. Observed on production
  on `probe-v4/contradiction.html`, where the late fee sits on lines 22 and 23
  and the refusal was **correct**. It now reads *"Searched all N lines. No
  single line states it."*, which is true when the fact is absent and true when
  it is split. The section header asserted absence too, so **"WHAT IT NEVER
  SAYS" is now "WHAT NO SINGLE LINE SAYS"**, and so did the no-document reply —
  the third copy of the same claim, fixed with them.
  **Deliberately weaker than what shipped before.** Buying the stronger sentence
  back means giving `not_stated` a reason field so `reply.ts` has something to
  branch on. That is a product decision and **NOT a flag**; do not open one.
  **The test guards the class, not the wording**: nothing in a refusal may match
  `/does not state|never says|is silent/`.
  **Not verified on production**, which cannot be deployed from a Claude
  session. The check to run after the next deploy is written into
  [`probe-v4.md`](probe-v4.md).
  **Amended 2026-09-09: the closure reached three copies and there were four.**
  `src/App.tsx` is a second renderer of the same findings and it went on
  printing *"This document does not state it"* and *"What it never says"* to
  the open internet after the email stopped. Nothing tests that file, and the
  class guard could not reach it because the board restated the sentence
  instead of calling the function. Fixed by **exporting `refusalLine` from
  `reply.ts` and importing it**, so the wording has one definition and the
  existing guard now covers the board through it.

- **M7 on the board (the same defect, in the second renderer)** found and closed
  2026-09-09, hours after M7 itself. `src/App.tsx` carried its own
  `groupByLine` keyed on `f.lineNo` alone — the exact pre-fix shape — so the
  public page could publish one answer under another finding's receipt while
  the email no longer could. Fixed by **exporting `receiptKey` from `reply.ts`**
  and keying the board's merge with it.
  **The generalisable half is not either patch.** Two flags were found, fixed,
  scored and moved to *Closed* on 09-09, and both stayed live on the public
  surface, because "closed" was recorded against the file where the defect was
  found rather than against every renderer of the data. That is the **third**
  instance of the H4 lesson — *closed does not mean unreachable* — and the first
  where the still-open copy was the one a stranger can see. The structural
  answer taken here is the same one that closed H5 and M7 themselves: **one
  function, imported, instead of two copies that agree today.**

- **The board buried its own differentiator** — found and closed 2026-09-09, not
  scored, because it is an ordering defect rather than a false claim.
  `documents.recent` orders by `_creationTime`, so which document leads was an
  accident of seeding, and the accident put the Las Vegas handbook — which
  refuses nothing — on the first screen. The comment at the top of
  `src/App.tsx` had asserted refusal-first ordering since 09-05; it was true
  inside a card and false at the page level for four days, which is why nobody
  caught it reading either file alone. A visitor's first impression was
  answers-with-quotes, which every rival on the same stack also shows. Cards
  that refuse something now sort first, **from the findings rather than from a
  hand-picked id**, so seeding a seventh document cannot quietly put grounding
  back on the first screen.

- **M7 (an answer could be published under another finding's quote)** opened and
  closed 2026-09-09. `groupByLine` merged two findings citing one line, keeping
  both answers and the **first** quote. Observed on production: `T3b`'s *"you
  receive at least 30 days' email notice"* went out under `T3a`'s quote, which
  does not mention notice, while both rows in the `findings` table were correct.
  Keyed on line **and** quote now, so identical receipts still merge and a
  different slice of one line prints as its own receipt.
  **The comment above the function had already stated the assumption that made
  it safe** — two findings on one line carry the same quote, because the quote
  WAS the line — and `excerpt` falsified that on 09-04 while nothing came back
  to re-read it. **That is the finding to carry, not the fix.**
  **Why it survived four audits and a 7/7 gate:** the gate reads the `findings`
  table, and the defect was in the email. The test covering this grouping built
  both findings by spreading one fixture, so they shared a quote — it asserted
  an instance and could not fail on M7 in principle.

- **The receipt invariant closed both**, and it is the part worth keeping.
  `reply.test.ts` parses the rendered reply back into blocks and requires every
  answer to sit above **its own** quote and **its own** line number. M5, M7 and
  the 09-04 excerpt bug were three files and one class; a fourth instance in a
  fifth file fails this test without anyone having to predict where it would
  appear. **Observed failing against the old renderer first**: 4 fail / 93 pass,
  including `every answer is printed under its OWN receipt`.

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

**M8 → (measure H6 again) → M10 → M2 → M6 → (L3, L4, L5).** M5, H5, M7, H8, M9
and L6 are closed.

**M10 sits behind the H6 measurement and ahead of M2** because its first step is
free and nobody has taken it: read the actual Firecrawl per-minute limit off the
plan. Every sizing decision for the limiter depends on a number this project has
only ever seen quoted back to it inside an error message.

**M8 moved to the front on 2026-09-09 night and H6 is why.** It was parked
behind M2 that afternoon on the grounds that its first step is a measurement.
It is still a measurement, but it is now the measurement that decides whether
H6 is a class or a single parser artefact — the answer that out-ran its line did
so because reflow had orphaned the amount onto a line of its own. Fix the parser,
re-run the same document, and H6 either disappears or becomes real.

**The freeze still applies.** M8 bumps `PARSER_VERSION`, and a bump between the
enrolment and the edit makes `attach` re-baseline and swallow the change the
video exists to show. **Nothing in this fix order happens before the video is
shot.**

H5 and M7 went first and went together, because both published something false
and both were instances of one class. They were fixed as the class: the two
patches are four lines and **the test is the deliverable**.

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
