# Readiness flags — open at the start of P5

Last audit **2026-09-08** (fourth pass). **M5 closed 2026-09-09**; three flags
opened the same day by the probe-v4 playtest, which is not an audit either —
it is the product being used; **H5 and M7 closed the same evening**, together,
by an invariant rather than by two patches — and **H6 opened the same evening**,
by the A5 check written to confirm that fix on production. **M10 opened 2026-09-11**.
**M11 and L7 opened and closed 2026-09-14 midday**, both found by subtracting two
timestamps nobody had subtracted; they move nothing.
**Fifth pass 2026-09-14 evening — ten flags opened, and it was a code audit that
found them.** That pass scored **22/100**, the lowest this file has ever
recorded. **H9, M15, L8 and L12 closed 2026-09-14 night**, the first four off that
list, and the score was **44/100**.
**Interview filing 2026-09-15 — nine rounds of a mock judge interview, closed
and filed in one sitting.** Two highs (H10, H11), four lows (L13–L16) and one
amended medium (M8, re-measured), then **L17 the same evening** on review of the
filing, and the score is **9/100**:
`100 − 15(H6) − 15(H10) − 15(H11) − 5(M2) − 5(M6) − 5(M8) − 5(M10) − 5(M12) − 5(M13) − 5(M14) − 1×11(L3,L4,L5,L9,L10,L11,L13,L14,L15,L16,L17)`.
Nothing was built on 09-15 and nothing broke; every one of these has been
shipping for days. The corpus on production that day: **16 url-backed documents,
6 public and 10 private forwards**, plus emailed attachments that are never
watched.
Passes have scored **58 → 67 → 82 → 72 → 92 → 72 → 82 → 87 → 62 → 82 → 67 → 62 → 62 → 22 → 44 → 10 → 9** (09-03, 09-05,
09-05 evening, 09-07 morning, 09-07 evening, 09-08 morning, 09-08 evening,
09-09 midday, 09-09 afternoon, 09-09 evening, 09-09 night, 09-11, 09-14 midday,
09-14 evening, 09-14 night, 09-15, 09-15 evening). The deltas are `+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`, then
`+15 H2 closed`, then `+5 M4 closed, −15 H3 opened`, then `+15 H3 closed, +5 M3
closed`, then `−15 H4 opened, −5 M5 opened`, then `+15 H4 closed, −5 M6 opened`,
then `+5 M5 closed`, then `−15 H5, −5 M7, −5 M8`, then `+15 H5 closed, +5 M7 closed`, then `−15 H6`, then `−5 M10` — 2026-09-11,
where H8, M9 and L6 all opened and closed inside one day and move nothing — and
then **0** on 09-14 midday, where M11 and L7 did the same, and then
`−15 H9, −5 M12, −5 M13, −5 M14, −5 M15, −1×5 (L8,L9,L10,L11,L12)` that evening,
and then `+15 H9 closed, +5 M15 closed, +1 L8 closed, +1 L12 closed` that
night (09-14 night), and then `−15 H10, −15 H11, −1×4 (L13,L14,L15,L16)` on
09-15, where the interview's findings were filed after it closed rather than
during it, and `−1 L17` that evening, when the review of the filing found an
item that had been left in session memory instead of in this file.

**The 09-15 flags came from a fourth way in: being interviewed.** Five of the
nine rounds asked Convex-shaped questions — where the transaction boundary
sits, what retries, what is atomic, what the cron overlaps, what the public
surface returns for a private row — and every answer was traced in the code
and, where it could be, read off production. H10 and H11 both fell out of the
first question. Neither needed a scrape, a forward or a deploy. What they needed
was somebody asking what happens when the network call in the middle fails.

**The 09-14 pair was found by arithmetic on data this deployment had already
stored**, which is a third way in, alongside the audits that find little and the
forwards that find a lot. Nobody had subtracted `repliedAt` from `receivedAt` in
eleven days of the board promising a number derived from exactly that. **Where a
claim can be asked of the data instead of the code, ask the data** — the same
lesson the 09-06 sweep taught about `lastCheckedAt`, arriving by a different
road.

**Amended 2026-09-14: the thesis of this file was wrong, and an audit is what
falsified it.** Twenty lines below, in the entry written on 09-09, this file
says: *"Both drops came from running the product, and neither came from
re-reading the code — which is the only generalisable finding this file
contains."* It said that after five consecutive passes where auditing found
little and forwarding mail found a lot, and it was an honest reading of five
data points.

The sixth pass found **ten flags, including a high, by reading code.** Not one
of them needed a scrape, a model call, a forward, or a deploy. **H9 is the one
that settles it**: a re-forward re-classifies a document and silently ends its
watch — which is H8, the flag this file used on 09-11 as its proof that *"nothing
that reads code was ever going to find this."* H8 was closed on the re-check path
and left open on the mail path, and the thing that noticed was a code audit.

**What was actually true, and is narrower.** The four discovery modes this file
accumulated — send mail, compare two renderings, compare a claim to its pipeline,
run it on real hardware — all find defects that live in the *relationship between
a run and its output*. A code audit cannot see those, and that part stands. What
does not stand is the inverse: **five audits finding little was a fact about
those audits, not a law about auditing.** The earlier passes were looking for the
class the mail was already finding. This one was pointed at the paths nobody
forwards down — the second forward of a URL already known, a re-check whose row
was deleted mid-flight, a gate check satisfied by something other than the thing
it names.

**The generalisable finding, restated:** a method finds the defects it is shaped
to find, and a run of passes that all find nothing is evidence the method has
been aimed at a corner that is already clean. Six of today's ten are on paths
that **no amount of forwarding documents would ever exercise**, because they need
a second arrival, a deletion, a forged header, or an empty part.

**22 is the honest number and it is not a regression.** Nothing broke on 09-14.
Every one of these ten has been shipping for days, four of them since P1, and
production answered mail correctly throughout — `npm run gate` reads 7/7 on the
same morning this was written. That gap is the finding: **the gate is green and
the score is 22**, and both are true, because the gate asks whether the promises
being made today are being kept and the score asks what is waiting to break one.

## What the score measures, and what it does not

Added 2026-09-14, because the number moved forty points in one afternoon and its
own author misread it. Every flag below stands exactly as written; this section
changes none of them. It says what the arithmetic over them is worth.

**The score counts open findings by severity and nothing else.**
`100 − 15/high − 5/medium − 1/low`. There is no term in it for how much has been
built, how much works, or how many people it has served correctly.

**So it can only go down, and it goes down when somebody looks harder.** A
repository with no code scores 100. This one scored 92 on 09-07 with H4 and M5
already shipping and already broken — the flags existed, nobody had found them
yet. It scored 22 on the evening of 09-14 against code byte-identical to the code
that scored 62 that morning. **Nothing happened to the product in between except
six audit passes.** The score is a reading of inspection effort as much as of
quality, and on a file whose own thesis this week was that a method finds the
defects it is shaped to find, that should have been obvious from the start.

**A green gate and a low score are the expected shape, not a contradiction.**
They answer different questions. `npm run gate` asks whether the promises being
made to people *today* are being kept, against production, with credentials. The
score asks how much is known to be waiting. A project nobody has audited has a
high score and an unknown number of the same defects.

**What the number is actually good for**, and it is worth keeping for these three
things only:

1. **A delta that is auditable.** The formula is printed, so a change from 62 to
   22 can be checked line by line rather than believed.
2. **An order.** Severity is how the fix order at the bottom of this file gets
   sorted, and that ordering has been right more often than not.
3. **A record that closing is not the same as unreachable.** H4 reopened H2's
   cost bound; H9 reopened H8 through a second door. The arithmetic is what makes
   those visible as regressions in reasoning rather than as new discoveries.

**What it is not good for:** comparison with anything. No other project is scored
on this scale, so there is no denominator and no peer. **Quoting the bare integer
to somebody who has not read the entries beneath it tells them nothing true** —
which is the same defect as a quote without its line number, and this file should
not commit it about itself.

**M13 is the flag to read first, and it is not the worst one.** It says the
sweep check in `npm run gate` can be satisfied by somebody running a probe by
hand. That makes it the one flag on this list that is about the instrument rather
than the product, and this file has argued since 09-05 that a judgement call
standing in for a measurement is the root failure. A measurement that can be
satisfied by the wrong thing is that failure wearing the costume of its own fix.

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

### H10 — an upstream re-render mails every PDF subscriber a change that did not happen (high)

`convex/mail.ts:946` — the re-baseline gate keys on `PARSER_VERSION`, which is
**our** parser's version and nobody else's. `convex/change.ts:72` — `stillSays`
is an exact substring test. `convex/mail.ts:1005` — the notify loop runs inside
`attach`, per document. `convex/watch.ts:109` — `sweep` enqueues sixteen
independent work items and never looks at them again.

**The mechanism.** Firecrawl changes how it renders a PDF: a dash, a pipe, where
a table cell breaks. Every PDF's `contentHash` moves in the same sweep.
`parserVersion` matches, because the parser that changed is not ours, so the
re-baseline that H3 built does not fire. `diff` runs, `stillSays` misses on the
re-rendered clause, every answered finding reports `moved` or `gone`, and every
subscriber of every PDF is mailed that their lease changed. **Nothing in the
system separates a re-render from a deletion**: both arrive as "the quoted
clause is no longer in the text", and the notice is worded for the second.

**Two doors, and the breaker has to stand where both pass.** The daily sweep is
the obvious one. The other is the workpool's retry after a committed `attach`,
on a PDF whose parse is not deterministic (**M6**): `attach` commits hash H1,
the action is killed before it returns, the retry scrapes H2 ≠ H1, extract
runs again, `attach` diffs against H1, and the same false notices go out.
Both doors end in `attach`; the only place the whole corpus is in one scope is
`watchable`, before any scrape, which is too early to count anything.

**Not observed on production.** Nobody has been mailed. The evidence is
indirect and it is all this file's own: M6 measured four line counts from one
unchanged PDF in one afternoon, and the `parserVersion` gate exists because
**our** parser did exactly this three times (H3). Scored by the H4 test: every
PDF subscriber is hurt at once, by nobody's action, and the message they get
is the one message this product promises never to send falsely. Three of the
six public documents are PDFs; how many private forwards are is not counted.

**Direction, one line:** a sweep-level breaker that counts hash flips per sweep
and holds the notices when the count says "upstream", not "edited". This is the
one thing that gets built before submission; see the fix order.

**The n=1 hole, added 2026-09-15 evening, and it is this flag's, not M6's.**
The first draft of this entry handed "a single PDF flips and never crosses a
corpus threshold" to M6. That was wrong. M6 is scored as *not* a broken
guarantee — every churn it measured left the quotes intact and sent no mail.
The case where **one** PDF re-renders with a changed character *inside* a
quoted clause is this mechanism exactly, at n=1, and a breaker that counts
flips across the corpus does not see it. Three PDFs are on the public board.
**H10 does not close on a threshold alone.** Either the build covers n=1, or
H10 closes narrowly with this residual stated in the closed entry and the
README does not say otherwise.

What covers n=1 is not a count. It is the thing
`firecrawl-pdf-parse-nondeterministic` already concluded on 09-08: **hash the
source bytes.** For a url-backed PDF, fetch the file and SHA-256 it beside the
parse. Bytes unchanged and parse moved is a re-render, at any n, and is not a
change; bytes changed is an edit and diffs as today. One fetch per PDF per
sweep, no Firecrawl call, one field on the row. Whether it ships inside the
same build is decided on 09-16 against the two days it has; what is decided now
is that it is the second half of H10, not a different flag.

### H11 — a failed send silently ends the watch for that thread, and nothing repairs it (high)

`convex/mail.ts:164` — `send` is one POST with no retry, and `recordSend` runs
after it. `mail.ts:126` — `notify` returns when `repliedAt === null`.
`mail.ts:1005–1023` — the notify loop is inside the transaction that commits the
new `contentHash`. `mail.ts:750–762` — the early exit on a matching hash.

Three cases with one consequence:

1. **The reply POST fails.** `threads.error` is set, `repliedAt` stays null. The
   sender never gets an answer, and because `notify` skips every thread with
   `repliedAt: null`, never gets a change notice either. The `ponytail:` note at
   `mail.ts:160` says *"a failure here writes to `threads.error` and is visible,
   which is the property that actually matters."* Visible, and nothing reads
   it, and nothing acts on it.
2. **The reply POST succeeds and `recordSend` never runs** — the action dies
   between the fetch and the mutation. The person has the answer, with the
   WATCH paragraph in it, and is excluded from every notice forever, with no
   error on the row to say so.
3. **A change notice POST fails.** `threads.error` is set. The change was
   committed with the new hash in the same transaction that scheduled the send,
   so the next sweep hashes identical, takes the early exit, and never revisits.
   That subscriber was promised exactly this notice and misses exactly it, while
   the other subscribers of the same document got theirs.

**Not observed.** 0 of the 29 threads on production carry a send error, read
2026-09-15. The trigger is ordinary rather than exotic: Firecrawl 429s arrive in
batches (M10), and on 09-04 a reply AgentMail never accepted was recorded as
sent — the `repliedAt` history in `schema.ts` is the record of a send failing
for real once already.

**Scored 15 by the same test as H4: the person did nothing.** The disclosed
guarantee is *"tells you when the specific thing you asked about changes"*, and
this is the path where the system loses the ability to keep it and does not
know that it has. The "listed, not scored" entry for `send`'s no-retry is
withdrawn into this flag: its stated mitigation was that the failure is visible,
and visibility with no repair is what this flag is.

**Direction, one line:** write the notice owed on the thread row before the send
is scheduled, and retry the send with an idempotency key. Not built before
submission.

### M12 — disclosure is derived from the absence of a thread id (medium)

`convex/mail.ts:901` — `isPublic: args.threadRowId === null`, on the insert
branch. `watch.recheck` passes `threadRowId: null` for **every** url-backed
document (`watch.ts:169`), private forwards included, because a re-check is
genuinely not an answer to anybody's message.

So a private document stays private across a re-check only because the `by_url`
lookup at `mail.ts:806` never misses. Let it miss once — the row deleted between
the workpool enqueueing the re-check and `attach` running, and the pool retries
at 0s, 60s and 120s — and the row is re-created **public**, carrying the title
that fell back to the sender's own subject line. That is H1's leak, arriving
through a door H1 did not use.

It also contradicts the rule written two fields above it in `schema.ts:69` —
*"the safe direction for a field that gates disclosure"*. Here the default is the
unsafe direction, and it is unsafe by omission rather than by decision.

**Nothing has been observed.** No public row on production came from a forward;
the gate's board check asserts that on every run. This is scored for the
consequence rather than for a sighting, and the fix is small enough that the
argument about likelihood does not need settling: make `isPublic` an explicit
argument of `attach` — `true` from `probe`, `false` from `ingest`, `false` from
`recheck`. Two lines, and the leak stops being contingent on a lookup.

### M13 — the gate's sweep receipt can be minted by hand, and by a stranger (medium)

`scripts/gate.mjs:161` takes `Math.max` over every public document's
`lastCheckedAt`; `convex/mail.ts:825` stamps that field on **every** re-read of
an existing row — which includes an inbound forward and a hand-run `mail:probe`,
not only the watch.

Two weaknesses that compound. `Math.max` means **one fresh document hides
thirteen stale ones**. And because a forward stamps the field, the cron can be
dead while `npm run gate` reports *"the watch has swept"* for the next 48 hours,
on the strength of somebody running a probe during a rehearsal.

The check's own comment concedes the smaller half — *"a green check still only
means the sweep ran"* — and not the larger one, that the sweep is not the only
thing that sets it.

**This is scored higher than its blast radius** because of what it is. Nothing
published is wrong; no answer is stale; no promise has failed. What is degraded
is the instrument this repository points at when it says a thing is true.
`CLAUDE.md` is explicit that a claim the gate could have checked and did not is
not a claim — a check that can be satisfied without the thing it names being
true is worse than the absence of the check, because the absence is visible.

**Fix, and both halves are cheap:** `Math.min` over the documents, so the check
means every watched document is fresh rather than at least one; and keep the
watch's stamp distinct from a read's, so only `checked`/`recheck` set
`lastCheckedAt` and the mail path does not.

### M14 — `From` is attacker-controlled, and three gates key on it (medium)

`convex/mail.ts:391` parses the sender; `stopFor` (`mail.ts:304`), the burst
limiter key (`mail.ts:393`) and the 25-document cap (`mail.ts:393`) all key on
the result. Svix verifies the **webhook**; nothing verifies the **sender**.
Confirmed absent: `dkim`, `spf`, `dmarc` and `authentication_results` appear
nowhere in `convex/`.

H4 made `fromEmail` a correctly parsed mailbox. It did not make it an
authenticated one, and H4's own reasoning already took header forgery seriously
— *"taking the first would let an attacker's STOP silence a victim"* — so this
is that same threat one level up, where the whole header is chosen rather than
one mailbox inside it.

Three abuses, none needing more than an SMTP client:

- `From: victim@x.com` with a body of `STOP` → `stopFor` silences every thread
  that victim has. Their watch is over and the confirmation goes to them.
- Twenty-five forwards as `victim@x.com` → their cap is exhausted, and their
  next real forward is answered with `limitBody`.
- One forward as `victim@x.com` of a URL the attacker chose → we mail that
  person findings they never asked for.

**First step is free and nobody has taken it:** read AgentMail's inbound message
object and see whether it carries a verification verdict. If it does, refusing to
honour a `STOP` from a message that failed is a two-line guard. If it does not,
that is a ceiling to write down here rather than leave implied.

**Scored 5, not 15**, and the line is deliberate: H4 was high because it broke
for people who had done nothing but own two mail clients. This one requires
somebody to decide to do it. That is a real difference in who gets hurt by
accident, and it is the difference this file has used before.

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

### M8 — reflow leaves a sentence broken when the continuation starts with a capital (medium)

**Amended 2026-09-15 with the measurement, and the numeral is not where the
breaks are.** Sixteen enrolled URLs on prod, scraped once through the mail
path's own Firecrawl request and run through the real `toLines` (artifacts in
`~/.claude/handoffs/still-true-m8-measurement/`; the scraped text was not kept,
because ten of the sixteen are private forwards).

| what was counted | corpus-wide |
|---|---|
| wrap after a digit, the case this flag was filed on | **45** (10 would be out-run by an answer) |
| wrap where the next line starts with a capital, which the continuation guard rejects | **476** |

The residual is the capital-continuation guard, not the trailing digit, by a
factor of ten. Livonia alone carries 79 of the 476; the Las Vegas handbook 33;
the IPW rulebook 60. Two facts that narrow the fix: **the H6 wrap was authored
into the fixture's HTML** — six of the seven live web ToS pages (AT&T, PayPal,
Facebook, Spotify, Verizon, Pandora, Forever 21) have zero wraps of either
kind, and the seventh, Grindr, is hard-wrapped at source with 283; so this is
a PDF defect with one web exception, not a web defect. And **wrapped table
cells do not occur in this corpus**: the SBC's 102 table rows have 0
continuation rows, so a fix does not have to protect tables from itself.

The fix is still not one character, for the reason below, and it is now
bigger than filed: a candidate that joins 476 places has to leave *"07.
Payments Are ⏎ Non-Refundable."* as two lines and join *"described in ⏎
Section 1"* as one, and both start with a capital. Score unchanged; the flag
now says what was measured. **As filed 2026-09-09:**

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

`convex/mail.ts:878`. `attach` skips the `by_url` lookup when `url === null`,
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
- **L4** `convex/mail.ts:347` — an unrecognized payload is dropped with
  `console.error` and no record, which is invisible in a deployment that
  retains no failure logs.
- **L5** `convex/mail.ts:1009` — `attach` notifies at most `.take(100)` threads.
  Subscriber 101 is silently never told the clause moved, which is the one
  thing the watch exists to do. Unlike the other bounded reads, this one
  carries no `ponytail:` note naming its ceiling.

- **L9** `convex/schema.ts:172` — `findings.by_documentId_and_questionKey` is
  declared and never queried. The only reads are `by_documentId`
  (`documents.ts:61`, `mail.ts:806`, `mail.ts:1046`), which the compound index
  also covers, so one of the two is dead whichever way it is resolved. `attach`
  deletes and re-inserts the whole finding set on every re-read and pays index
  maintenance on both.
- **L10** `convex/crons.ts:19` — `crons.daily(…)` where
  `convex/_generated/ai/guidelines.md` says to use `crons.interval` or
  `crons.cron` and *not* the `hourly`/`daily`/`weekly` helpers.
  `crons.cron("17 11 * * *", …)` is the same line and the same 11:17.
- **L11** `convex/mail.ts:862` — `text: v.array(v.string())` carries the whole
  document as a mutation argument, and a Convex array is capped at **8,192
  elements**. `MAX_PROMPT_CHARS` is 600,000, so a document averaging under ~73
  characters a line — which markdown from a PDF usually is, being mostly short
  lines and blanks — passes extraction and then dies at `attach`'s validator.
  The sender is told the document *"came back too short to be the real thing, or
  could not be parsed"*, which is false about what happened. Today's corpus tops
  out at 2,007 lines, so this is a ceiling to name, not a fire.

- **L13** `convex/mail.ts:452–461` — the 25-document cap counts threads whose
  `documentId` is already set, and `attach` sets it after the scrape and two
  model calls. Messages admitted inside that window count zero against each
  other, so a sender holding 24 documents who mails five distinct URLs in one
  burst reaches 29. The limiter bounds the overshoot to one burst — capacity 5,
  then ten an hour — so the real ceiling is **25 plus a burst**, and the comment
  at `mail.ts:280` said *"at most 25 scrapes a day"* until this PR. The check
  is keyed on the wrong event: count admitted threads, not completed ones.
- **L14** `convex/documents.ts:23` — `recent` is `take(50)` on the public index.
  The 51st public document drops off the board silently, and the board's
  last-sweep stamp, reduced over those rows in `App.tsx`, then reports the
  newest of fifty rather than the corpus. Six public today; the ceiling is
  **50 public documents**.
- **L15** `convex/watch.ts:83` — `watchable` is `db.query("documents").take(200)`
  with no index, over public, private and attachment rows alike. At **200 total
  rows** the enrolled documents past the page stop being swept, with no
  `watchError`, no gate failure and no signal of any kind. Moved here from
  "listed, not scored" on 2026-09-15: the `ponytail:` note names the upgrade
  but not that the failure is silent, and the sweep is the promise. Prod holds
  16 url-backed rows plus attachments.
- **L16** `convex/mail.ts:905–1003` — a stranger forwarding a URL that is
  already on the public board reaches the existing row, re-runs extract, and
  replaces every published finding with their own model run, bumping
  `fetchedAt`. The hash matches so no notice goes out, and `title` and
  `isPublic` are untouched, so nothing leaks. The answers can still differ —
  2 of 47 cells on 09-04 with the documents standing still — so one email
  re-rolls a public receipt. An influence channel, not a leak.
- **L17** `convex/extract.ts:408` — the grounding guarantee the README calls
  structural is one call: `excerpt(lines[lineNo - 1], claim.support_quote)`.
  Nothing downstream re-checks it. `attach` (`mail.ts:868`) receives the full
  `text` and every finding and never asserts that `quote` is a substring of
  `text[lineNo - 1]` before inserting. And **nothing runs the tests between a
  push and a deploy**: no `.github/workflows`, no `.husky`, no `hooksPath`, no
  `prepare` script. `npm run gate` is a habit, not a gate. A one-line edit to
  `excerpt` that broke the guarantee would reach production if the person
  deploying skipped the habit once. Filed 2026-09-15 evening; raised in round
  one of the interview and left in memory rather than here until it was pointed
  out that memory is not the artifact a judge reads. Direction: the substring
  assertion in `attach` is one line and makes the guarantee two lines instead of
  one; a workflow that runs `npm run lint && npm test` on push is the other.

**Noted 2026-09-15, not scored:** `sweep` enqueues each document in its own
transaction (`watch.ts:109`), so a `sweep` killed after document *k* leaves the
rest un-enqueued until tomorrow's cron, with nothing recorded. Nothing retries
`sweep`. The cron runs again in 24 hours, which is the promised cadence, so this
is a one-day gap at worst and it is named here rather than scored.


## Candidate — evidence too thin to score

### C3 — the reply sometimes lands in spam, and which time is not predictable

**Measured 2026-09-14 night, three Gmail accounts, same sender and
near-identical replies. Two inbox, one spam.**

| account | history with this address | result |
|---|---|---|
| the author's own | dozens of read and replied-to exchanges | `INBOX`, `IMPORTANT`, zero spam in 7 days |
| a second account | none | **spam** |
| a third account | none | `INBOX` |

**The first reading of this was wrong and the third account falsified it inside
the hour.** With two accounts in hand the obvious mechanism was *a reader with no
history with the sender gets filtered*, and it fit both points exactly. It is not
what is happening: the third account had no history either and was delivered.

**What survives is weaker and more useful.** Delivery to someone who has not
written here before is **not predictable**. That is worse than a rule, not
better: a rule tells you which readers to warn, and this tells you there is no
such group. It is also the reason the mitigation below is stated unconditionally
rather than aimed at first-time readers, which is how it was written an hour ago.

**Deliberately NOT expressed as a rate.** One in two cold accounts is not a
frequency, and putting "about half" on the board would be M11 exactly — a
two-sample result promoted to a standing claim — committed in the paragraph that
exists because of M11. The honest form of a two-sample split is *it happens*, and
nothing more.

**Authentication is not the cause and can be ruled out from the headers**, read
off the delivered message rather than assumed:

```
dkim=pass   header.i=@agentmail.to
dkim=pass   header.i=@amazonses.com
spf=pass    mail.agentmail.to designates 24.110.104.197
dmarc=pass  (p=REJECT sp=REJECT) header.from=agentmail.to
```

In-Reply-To and References are set correctly, so Gmail sees a genuine reply to a
thread the recipient started. That is as clean as a sender gets.

**What is left is reputation and shape, and all three signals are the vendor's.**
Every reply leaves over Amazon SES's shared pool
(`i104-197.smtp-out.amazonses.com`), carries `List-Unsubscribe` and
`List-Unsubscribe-Post: One-Click`, and ends with AgentMail's branded footer —
which is a UTM-tagged campaign link (`utm_medium=email&utm_campaign=branded-footer`)
in every single message. Shared IP, bulk headers, a campaign-tagged link, and a
recipient with no history is the standard filtered profile. None of the three is
ours to remove.

**Why this stays a Candidate, and why that is now a closer call than it was.**
It did not reproduce, so the version of this flag that would have been a high —
*every new reader is filtered* — is dead. What is left cannot be scored the
normal way: the failure is real and was seen once, but it is intermittent, and
this file's rule is that a plausible finding is listed and does not move the
score. It stays off the number.

**It is a closer call because intermittent is not rare.** Seventeen judges is not
one sample. A defect that fires unpredictably still fires, and the thing that
makes this un-scoreable is also what makes it un-plannable — there is no
configuration to check and no reader to warn specifically.

**What would actually settle it** is more samples than one evening affords, and
across providers rather than three accounts at one provider — every data point
here is Gmail, so nothing at all is known about Outlook, Yahoo or a corporate
gateway. That is a real coverage gap and it is named in *Coverage* rather than
pretended away here.

**The half that is ours shipped anyway, and the falsification made it MORE
clearly right rather than less.** Until tonight nothing on the board, in the
README, in the listing or in the video description told a reader to look in spam.
The product promised a reply in under a minute and said nothing about the folder.
If the rule had held, that line could have been aimed at new readers only; since
it did not hold, it has to be told to everyone, which is what now ships.

It reduces the blast radius and **does not close this finding** — a reader who
never sees the mail and never reads the board is helped by neither.

**Not fixable by a custom domain in the time left, and worth writing down so the
next session does not try.** A new domain starts at zero reputation and needs
warm-up; five days before a deadline it is likelier to do worse than
`agentmail.to`, which at least has DMARC at `p=REJECT` and a functioning SES
pool behind it.

**One thing found while reading the headers, unrelated and unscored:** the
`List-Unsubscribe` one-click endpoint is AgentMail's, not ours. A reader who
uses it is unsubscribed at the vendor and `threads.stopped` never learns, so the
watch believes it is still enrolled. M4's STOP reply is the only path this
system can see.


**An HTML-only message's STOP is not an unsubscribe, and its link is not a
document.** `convex/mail.ts:374` (link extraction) and `mail.ts:427` (the STOP
test) both read `readString(message, "text")` and fall back to `""`. Nothing in
`mail.ts` reads an `html` part — grepped, and `html` appears only on the
outbound side. If AgentMail ever delivers a message whose text part is absent or
empty, `documentUrl("")` returns null and a real forwarded link is answered with
*"I did not find a document in that message"* — and, worse, `isStop("")` is
false, so somebody replying **STOP** is told to forward a file and goes on
receiving change notices.

That would be **M4's promise failing for a class of mail client rather than for
an edge case**, which is H4's argument exactly, and it would be scored high if
it were confirmed. It is not confirmed, and the missing half is the only half
that matters: **nobody has checked whether AgentMail ever delivers a text-less
message to this inbox.** Twenty-six threads are stored on production.

**Confirm before acting, and it is free:** read the stored inbound payloads and
count how many have an empty or absent `text`. If the answer is zero the flag is
a ceiling to name; if it is more than zero it is an open high. Until that number
exists, this is a guess about a vendor's behaviour, and this file does not score
those.

**`npm run lint` failed twice on `convex/http.ts:26`, and then would not do it
again.** On 2026-09-14 the lint step failed with *"Unused eslint-disable
directive (no problems were reported from
`@typescript-eslint/no-unnecessary-type-assertion`)"* — twice, both times
immediately after a branch operation, on two different branches whose `http.ts`
is byte-identical. It then passed three consecutive runs, and passed again after
touching the convex sources to force a rebuild. **It could not be reproduced on
demand.**

The plausible mechanism is `tsc -b` incremental state changing what the
type-aware rule sees, which flips whether that `eslint-disable` is "unused" — but
that is a hypothesis, and it is written here as one.

**Why it is worth a candidate entry rather than a shrug:** `npm run lint` is the
first third of `npm run gate`, and the gate is what this repository points at
when it says a thing is true. A spurious red is an afternoon. The same
non-determinism producing a spurious **green** is the failure `CLAUDE.md` was
written against. **Confirm before acting:** run `npm run gate` immediately after
each branch switch for a week and record the result, or pin the eslint run to a
clean `tsc` by ordering them explicitly. Do not "fix" the disable comment — it is
load-bearing when the rule fires, and deleting it would trade an intermittent red
for an intermittent one in the other direction.

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

- **M15 (four comments described the Firecrawl design this project rejected)**
  closed 2026-09-14, in the H9 PR as the flag asked. All four rewritten: the
  docstring above the only Firecrawl call now says what the request actually
  asks for (`["markdown"]`, and deliberately not `changeTracking`) and carries
  the 09-05 sweep as the reason; `notify` and `attach` now name our own stored
  hash as the gate; and `change.ts` no longer tells the next session to start
  from a git-diff **the scrape does not request** — it now names the consumable
  signal as the thing not to reach for, and storing the previous text as the
  thing to reach for instead.

  **The false one was the one aimed at a future reader.** Three were stale
  descriptions of a decision reversed elsewhere — the second-renderer defect,
  logged a fourth time. The fourth was a suggestion for where to pick this up,
  and it was wrong about a request body forty lines away.

- **H9 (a re-forward re-classified the document and silently ended its watch)**
  opened and closed 2026-09-14, twelve hours apart. The fix is the one the flag
  named: `readAndPublish` now resolves `url → kind` through the same `by_url`
  lookup `attach` dedupes on, and pins the checklist whenever a row is found —
  so the pin is a statement about **whether this document has been read before**
  rather than about which caller we arrived as. `priorKindForUrl` returns the
  kind and deliberately not the hash: the early exit returns before `attach`, so
  taking it on the mail path would have left the second sender with no reply and
  their thread with no `documentId`. That trap was written into the flag before
  the fix was written, and it is the reason this took one pass instead of two.

  **H8 and H9 are one defect with two doors, and the general form is worth
  keeping**: H8 pinned on `recheckOf !== null`, which is *how we got here*, when
  the property that mattered was *does this row already exist*. A guard keyed on
  the caller is defeated by a second caller. The board consequence closed with
  it — a stranger can no longer flip a board card's `kind` and replace its
  published findings by forwarding a URL already on the board.

  **It also unblocks the listing.** Naming a document a judge can forward was
  blocked on exactly this, including for a document *not* on the board, because
  the second judge to forward the same suggested URL would hit it on the row the
  first one created.

- **L8 (`limitBody` did not escape its interpolated text)** closed 2026-09-14,
  and **the flag undercounted it.** L8 said *"every sibling does: `failureBody`,
  `noDocumentBody`, `stoppedBody`"* — `noDocumentBody` did not. Two builders were
  unescaped, not one, and the finding's own evidence list is what hid the second.
  Both now escape. Still not live, still a trap closed rather than a bug fixed:
  every string in both is built from constants, `plural()` and `humanDelay()`.
  **No test.** A test for a trap nothing can currently spring asserts that a
  constant is a constant; the guard is that both bodies now match every sibling.

- **L12 (`convex-helpers` declared and imported nowhere)** closed 2026-09-14.
  `npm uninstall convex-helpers`, one line out of `package.json`, no import to
  change because there was none. Not replaced with a use for it, for the reason
  the flag gave.

### M15, as it was written

#### M15 — four comments still describe the Firecrawl design this project rejected, and one of them is false (medium)

`convex/mail.ts:499-503`, `mail.ts:114`, `mail.ts:850`, `convex/change.ts:145`.

`README.md:57` tells the world that Firecrawl's own `changeTracking` **is not
used**, because the signal is consumable and reading it spends it — the single
best sponsor finding this repository contains. The code still explains itself the
other way round:

- **`mail.ts:499-503`** — the docstring **directly above the only Firecrawl call
  in the codebase**: *"What Firecrawl says about this URL since the last time OUR
  team scraped it… **This is the watch's whole gate: it is computed by Firecrawl
  from the two texts**."* The watch's gate is a SHA-256 over our own parsed lines
  (`lines.ts`, `fingerprint`), stored on our own row. Firecrawl computes nothing
  for us; the scrape requests `formats: ["markdown"]` and nothing else.
- **`mail.ts:114`** — *"a change is only ever computed when Firecrawl reports the
  source text moved."* It is computed when **our** hash moves.
- **`mail.ts:850`** — *"Only when Firecrawl says the text moved."* Same.
- **`change.ts:145`** — *"the added lines out of Firecrawl's git-diff, **which the
  scrape already requests** and nothing yet reads."* The scrape does not request
  it. This one is not merely stale, it is **false about the request body sitting
  forty lines away**, and it is written as a suggestion for where a future
  session should start — so it is a false claim aimed at whoever picks this up.

**This is H7's class, in the code rather than on the page**, and it is the fourth
discovery mode doing its job: *compare a claim about the pipeline to the
pipeline*. It is also the second-renderer defect this project has now logged four
times — a decision was reversed in one place and left standing in three others.

**Scored 5 rather than 1 because of who reads it.** One of seventeen judges works
at Firecrawl. He opens one file — the one containing the Firecrawl call — and the
docstring above it contradicts the headline Firecrawl claim in the README. The
strongest sponsor finding in the repository is undercut by the comment nearest to
the thing it is about.

**Not scored 15**, because nothing a user receives is wrong and no behaviour
changes. The gate is correct; only its explanation is.

Fix: rewrite four comments to describe the hash gate, and keep the rejected
design as history where it belongs rather than as present tense. Belongs in the
H9 PR — three of the four are in `mail.ts` and H9 is already editing it.

### H9, as it was written (the flag this closed)

#### H9 — a re-forward re-classifies the document, and that silently ends the watch (high)

`convex/mail.ts:709` (`priorKind` is set only inside `if (args.recheckOf !== null)`),
`convex/mail.ts:788` (`classify` runs whenever `priorKind` is null), and
`convex/mail.ts:788` (`patch(… kind: args.kind …)` on the existing row), reached
with `recheckOf: null` from `ingest` (`mail.ts:597`) and `probe` (`mail.ts:788`).

**This is H8, through a door H8 did not close.** H8 pinned the checklist on the
*re-check* path, and it is worth being exact about what that fix says: *"A
re-check answers the checklist this document was FIRST answered against."* It
does. But `attach` dedupes on `by_url` **by design** — `mail.ts:829` says so in
as many words, *"two people forwarding the same terms page are asking about one
document; they share the row, and therefore the watch"* — so **`ingest` reaches
rows that already exist**, and it arrives with `recheckOf: null`. The pin is
keyed on *how we got here*, not on *whether this document has been read before*.

The trigger is not hypothetical, and H8 already measured it: on production the
video fixture classified **`other` at 11:18 UTC and `lease` at 15:29**, one word
of it changed and nothing else. So:

1. A forwards `https://x/terms` → `kind: "tos"`, findings `T1a…T5`, and the
   reply promises to re-read the page daily and mail them if any of those
   clauses stops saying what it says today.
2. Days later, anyone forwards the same link. `recheckOf` is null → `classify()`
   runs → `"other"` → extraction against the UNIVERSAL checklist.
3. `attach` finds the row, patches `kind`, and computes `diff(before, after)` —
   which skips **every** finding, because `change.ts:75` treats a question the
   previous reading never asked as a first answer rather than a change, and
   across a checklist boundary every key is new at once.
4. The `T` findings are deleted and replaced by `U` findings. `priorByKey`
   matches nothing, so `changedAt` and `previousQuote` history is wiped with them.
5. The cron then pins `other` forever — H8's fix working correctly, on a
   baseline that is wrong.

A is never told their arbitration clause moved. No error, no `watchError`, no
notice. **H8's closing paragraph is the description of this flag** and can be
read unchanged.

**It also reaches the public board.** A stranger can flip a board card's `kind`
and replace its published findings by forwarding a URL that is already on the
board. That is not a disclosure — nothing private is shown — but it is
unauthenticated mutation of the public surface by anyone who can send mail, on a
deployment whose gate check exists to assert the write surface is closed.

**Fix: pin on existence, not on `recheckOf`.** Resolve `url → kind` before
`classify` and use it whenever a row is found. **The trap to avoid** is also
taking the `contentHash` early exit on the mail path: it returns before `attach`,
so the sender would get no reply and the thread would never get its
`documentId`. Pin the checklist only.

**Scored 15, the same as H8**, because it is the same defect with the same
consequence and the same silence. Not scored higher for being a second instance:
the score measures what is open, not how embarrassing it is.

### L8 and L12, as they were written

- **L8** `convex/reply.ts:308` — `limitBody` is the only reply builder that does
  not `escape()` its interpolated text. Every sibling does: `failureBody`
  (`reply.ts:308`), `noDocumentBody` (`reply.ts:308`), `stoppedBody`
  (`reply.ts:308`), and both `replyBody` and `changeBody` escape every field.
  Not live — the string is built from constants plus `plural()` and
  `humanDelay()`. It is a **trap, not a bug**: the day somebody adds the sender
  or the document title to that body, it is HTML injection into an email, from
  an address M14 says is attacker-controlled. One word.
- **L12** `package.json:9` — `convex-helpers` is a declared dependency and is
  imported nowhere. Confirmed by grep across `convex/`, `src/` and `scripts/`:
  zero hits. **Do not "fix" it by finding a use for it** — `getManyFrom` would
  replace `withIndex` calls that are already correct and already commented.
  Delete the line. It is scored at all because `package.json` is a twenty-second
  read, five of seventeen judges work at Convex, and a shipped-but-unused
  first-party package reads as cargo-culting on a repository whose entire
  argument is that an unverified claim does not count.

- **M11 (the board generalised a best case into a typical case)** opened and
  closed 2026-09-14, found by subtracting two fields that had been sitting in
  production since P1. `src/App.tsx` told every visitor *"The reply lands in
  about fifteen seconds."* `threads` carries `receivedAt` and `repliedAt`;
  across the **20 real answers production has sent**, the median is **20.4s**,
  the range **11.6s to 42.6s**, and **5 of 20** came in at or under fifteen.

  **The sentence was not invented.** It is the 09-06 event the README reports in
  the past tense, where it is still true. What the board did was promote one
  measurement to a standing claim about the typical case — the same move that
  produced H7 and the three README count drifts, and the reason `npm run gate`
  exists at all. A claim pinned to a date survives; the same claim with the date
  removed becomes false the first time the world moves.

  Fixed by stating a **bound** instead of a central tendency: "under a minute",
  true of 20 of 20, and deliberately not derived live on the page — a rolling
  p90 on the board would be a public number moving with no cause a reader can
  see, which is **M6**'s complaint about `lineCount`.

  **The measurement's own finding, which is worth more than the fix.** Latency
  does not track document length. The fastest of the twenty is the **1,182-line**
  PayPal agreement at 11.6s; a **46-line** page took 30.0s; one **418-line**
  lease spanned **14.8s to 42.6s in a single evening**. So there is no "your PDF
  was long" story available, and an upper bound is the only honest shape for
  this claim. The variance is in the model call, not in the parse.

- **L7 (`repliedAt` was re-stamped by change notices)** opened and closed
  2026-09-14, found by the M11 measurement rather than by reading the code.
  `mail.recordSend` patched `repliedAt: Date.now()` on every accepted send, and
  `notify` reaches it too — deliberately, since a change notice must be able to
  follow an answer weeks later.

  Nothing misbehaved: both guards that read the field (`reply`, `notify`) only
  test it against null. What drifted was its **meaning**, from "when we answered"
  to "when we last mailed this thread", silently. It surfaced as a thread that
  had apparently taken **68.5 hours** to answer — which is the video's own
  thread, answered 09-09 and re-stamped at 11:18 UTC on 09-12 when the cron found
  the edit. **The demo's best receipt, presenting as a defect.**

  Fixed with `repliedAt: thread.repliedAt ?? Date.now()`. No second field: "when
  we last mailed this thread" has no reader, and a column added to be complete
  rather than to be used is the thing this file keeps telling the next session
  not to build.

  **Scored 1, not 5.** Nothing published was wrong and no promise failed. But it
  made the one question this project's landing page answers — how long does a
  reply take — unanswerable from its own data, on a repository whose premise is
  that a claim without a current receipt is not worth reading.

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
- ~~`watch.watchable`'s `take(200)` and `mail.send`'s no-retry, both with a
  `ponytail:` note naming the upgrade.~~ **Withdrawn 2026-09-15.** The
  `take(200)` is **L15**: its failure is silent, which the note did not say.
  The no-retry is inside **H11**: its stated mitigation was that the failure is
  visible on the row, and nothing reads the row.
- The document cap's `take(200)` over one sender's threads in `mail.received`.
  An address past 200 threads could undercount its own distinct documents; the
  limiter above it caps arrivals at ten an hour, so it cannot get there quickly,
  and the upgrade named in the comment is a count kept on the sender rather than
  derived.
- The `occRetried` warning on `agentmail/callbackPool` (2 calls,
  `occ_retry_count: 0`) — inside the component's sandboxed tables, not our
  code, not actionable.

## Coverage — what the audit could not see

**Deliverability is measured at one provider only (2026-09-14).** Every data
point behind C3 is Gmail — three accounts, one evening, two inbox and one spam.
**Nothing is known about Outlook, Yahoo, iCloud or any corporate gateway**, and
Microsoft in particular is stricter than Gmail with shared relay pools, so the
one provider that was tested is not the conservative case. A judge reading mail
at work is outside every measurement this file contains.

This is a gap, not a flag: it cannot be closed by reading code, and closing it
needs addresses at other providers rather than another pass over `mail.ts`.

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
- **A citation's verdict is decided by the rarest backticked token within four
  lines of it (2026-09-15).** When one sentence names two loci in one file, that
  token can belong to the other clause, and the verdict is then wrong about a
  citation that is right. Four of the seven DRIFTED citations on the 09-15 run
  were this: `change.ts:72`, `mail.ts:164`, `mail.ts:1005` and `mail.ts:868`
  were each read with `sed -n` and left alone. The `watch.ts` pointer in H10 was
  a real error, and after it was corrected to L109 it is flagged for the same
  reason the other four are — so the run ends at five DRIFTED citations, all
  five of them right. **A DRIFTED citation is an instruction to open the file,
  not a defect on its own.**

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

**Rewritten 2026-09-15, after the interview. Five days remain, the video is
submitted, and one thing gets built.**

**H10's breaker → then nothing else before submission.** Everything below it is
the order for after 09-22, carried forward unchanged:
**M13 → M12 → the three free reads → H11 → M8 → (measure H6 again) → M10 → M2 →
M6 → (L3, L4, L9, L10, L11, L13, L14, L15, L16).**
M5, H5, M7, H8, M9, L6, M11, L7, H9, M15, L8 and L12 are closed.

**Why H10 and not H11, when both are 15.** H11's fix is understood — a notice
owed on the row, a retried send with an idempotency key — and it is not small,
because a retry on `send` is only safe once the send is idempotent toward
AgentMail, which it is not today. H10's breaker is one new mutation and one
delay, and its design question was settled on 09-15 (see the entry dated that
day in `hackathon.md`): change notices scheduled with a delay, their ids written
on the thread row, cancelled by a settle step when the sweep's flip count says
"upstream". That keeps the sends inside the transaction Q1 of the interview
verified they live in. **The prevention-shaped alternative — moving the sends
out of `attach` into a second phase — was considered and declined**: it
re-architects the strongest invariant in the system with five days left, and
this file has already recorded twice what a change to a load-bearing path costs
the week it ships.

**H11's direction has a side effect worth naming:** the ids H10's breaker writes
on the thread row are the "notice owed" record H11 asks for. The breaker does
not close H11, but it lays the field H11's fix reads.

**The schedule, with the slack where it belongs (2026-09-15 evening; corrected
the same night).** Build 09-16 and 09-17. **Deploy by the evening of 09-17**,
because the receipt is the 11:17 UTC cron and a "morning" deploy on the 18th
only counts if it lands before 11:17 UTC, which is before 07:00 anywhere in the
US. Nothing is run by hand after the deploy. The 09-18 cron is the first
receipt and 09-19 the second. Docs, the H10 closed entry with its residual
named, and the score re-derived on 09-19. **Submit 09-20 (Sunday). The 21st is
the day that is not needed.** If the build slips, the deploy waits for the
evening of 09-18, the receipts are 09-19 and 09-20, and the submission goes
out the evening of 09-20; any later than that and the breaker does not ship.
The fallback is decided now rather than on the day: if the first receipt shows
the breaker misbehaving, that day is the fix and the next cron the retest; if
the second receipt fails too, the breaker is reverted, H10 stays open with a
dated note saying what was tried, and the submission goes out without it.
**Nothing else is built before 09-22.** Everything else this week is
documentation of what is true.

**Before the rewrite, as it stood 09-14 night:** M13 → M12 → the three free
reads → M8 → (measure H6 again) → M10 → M2 → M6 → (L3, L4, L9, L10, L11).

**The freeze is lifted, and that is the single largest change to this file
today.** The clause that stood here said *"nothing in this fix order happens
before the video is shot."* **The video was shot on 2026-09-13** — 2:42, and the
11:17 UTC cron found the fixture edit on the morning of 09-12, which is the
receipt beat C is built on. The reason for the freeze was specific and it has
expired: M8 bumps `PARSER_VERSION`, and a bump between the enrolment and the edit
would have made `attach` re-baseline and swallow the change the video exists to
show. There is no longer a change waiting to be shown.

**One consequence to carry rather than discover:** if any beat is ever
**re-shot**, it must be re-shot *before* M8 ships, not after. A re-render of the
narration is free; a re-baselined corpus is not.

**H9 went first, and it was not because it was the newest high.** It is because it
is H8 arriving through a second door, and this file has already paid once for
believing a closed flag was unreachable — H4 defeated H2's cost bound and
narrowed M4 after both were closed. The fix is small (pin `kind` on the row's
existence rather than on `recheckOf`), it bumps no parser version, it sends no
mail, and it is the only high on this list whose fix is understood well enough
to write today.

**M13 goes first now, because it is the instrument.** Every other line in this file
is a claim about the product; M13 is a claim about the thing that checks the
claims. Both halves are cheap — `Math.min` instead of `Math.max`, and stop
stamping `lastCheckedAt` from the mail path — and until they ship, the sweep
check can be satisfied by somebody running a probe by hand. Fixing a defect
while the detector for it is unreliable is how the next one goes unnoticed.

**L12 and L8 went in the H9 PR** rather than into a queue, and it was the right
call for an unexpected reason: L8 said *"one word"* and it was two, because the
flag's own evidence list named `noDocumentBody` as a sibling that escapes when it
did not. A finding small enough to postpone is also small enough to be wrong
about its own size.

**The three free reads come before anything that costs money**, and none has
been taken (the third was listed separately under M10 and is folded in here):
1. **Does AgentMail's inbound object carry an SPF/DKIM verdict?** M14's whole
   fix depends on the answer and reading it costs one payload.
2. **Has AgentMail ever delivered a text-less message to this inbox?** Twenty-six
   threads are stored. If the count is zero, the HTML-only candidate is a ceiling
   to name; if it is not zero, it is an open high and it jumps this queue.

3. **Read the actual Firecrawl per-minute limit off the plan.** Unclaimed since
   09-11. Every sizing decision for M10's limiter depends on a number this
   project has only ever seen quoted back to it inside an error message.

**M8 keeps its place ahead of the H6 re-measurement**, for the reason recorded on
09-09 night and unchanged: the answer that out-ran its line did so because reflow
had orphaned the amount onto a line of its own. Fix the parser, re-run the same
document, and H6 either disappears or becomes real. It has simply stopped being
first, because H9 and M13 are now ahead of it and neither existed on 09-11.

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
