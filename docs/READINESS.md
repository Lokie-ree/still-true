# Readiness flags — open at the start of P5

Last audit **2026-09-08** (fourth pass). Score **72/100**:
`100 − 15(H4) − 5(M2) − 5(M5) − 1×3(L3,L4,L5)`.
Passes have scored **58 → 67 → 82 → 72 → 92 → 72** (09-03, 09-05, 09-05 evening,
09-07 morning, 09-07 evening, 09-08). The deltas are
`+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`, then `+15 H2 closed`, then
`+5 M4 closed, −15 H3 opened`, then `+15 H3 closed, +5 M3 closed`, then
`−15 H4 opened, −5 M5 opened`.

**The 72s are the honest numbers to keep in the history, and there are two of
them now.** Neither is a regression. On 09-07 a flag that had been there the
whole time got found by feeding production two real links; on 09-08 two more
were found by forwarding one document and reading the reply against its source.
Four audits scored 82 or 92 with H4 open. **Both drops came from running the
product, and neither came from re-reading the code** — which is the only
generalisable finding this file contains.

**H4 is open and it is high.** It defeats H2's cost bound and silently narrows
M4's unsubscribe, both of which are on the closed list below. Closed does not
mean unreachable. **M2, M5 and the lows are known and parked** — do not re-run
the audit to rediscover them, and do not fix one unasked: read the fix order at
the bottom and ask.

## Open

### H4 — both spend gates and the unsubscribe key on a string the sender controls (high)

`convex/mail.ts:367`. `fromEmail` is the raw `From` header, display name
included. Observed on production 2026-09-08: the thread row for the round trip
stores `"Randall LaPoint, Jr." <rplapointjr@gmail.com>`, not the address.

Three things key on that exact string:

- `limiter.limit(ctx, "ingest", { key: fromEmail })` — the burst gate,
  `mail.ts:411`
- the 25-document standing cap's `by_fromEmail` read, `mail.ts:421`
- `stopFor`'s "every other thread from your address", `mail.ts:294`

**Cost:** editing a display name mints a fresh burst bucket and a fresh
25-document allowance. H2 — the flag about unbounded recurring spend on a
publicly listed inbox — is defeated by changing a preference.

**Unsubscribe, and this is the worse half because it needs no attacker:** M4
promises "this thread, and every other one I have with you." The same person
mailing from a phone and a laptop is two strings. They reply STOP, are told how
many documents it covers, and keep receiving change notices on the threads whose
header differs. M4 was closed *because* P5 enrolled people who never wrote in.

Fix: normalise to the bare address at the single point where `fromEmail` is
read, so all three gates and the stored rows agree. Existing rows carry the
un-normalised string, so the STOP scope needs to match on the normalised form
rather than assume a backfill.

### M5 — `excerpt` can trim away the part of the line that licenses the answer (medium)

`convex/extract.ts`, `excerpt`. Not a fabrication and not a contract violation:
the answer is supported by the line it cites. The *published quote* is a slice of
that line, and on a table row the slice can exclude the cell that makes the
answer checkable.

Observed on production 2026-09-08 on the Summary of Benefits, which Firecrawl
parses as a markdown table:

```
The overall deductible is $500 for an individual or $1,000 for a family.
  "$500 / individual or $1,000 / family"
  line 5
```

*Deductible* is on line 5, in the question cell of the same row. The reader
cannot see it. Same on line 11, where the "Yes." that licenses "You must obtain a
referral" is trimmed off. Three of that document's four answers are supported by
their line and under-supported by their receipt.

This is the direct cost of the 09-04 fix that stopped receipts running 588
characters, so it is a trade rather than a defect to simply undo. A candidate
that keeps both: when the cited line is a table row, publish the row's first cell
alongside the matched cell.

### M2 — attachment documents never dedupe (medium)

`convex/mail.ts:575`. `attach` skips the `by_url` lookup when `url === null`,
which is every forwarded attachment.

Confirmed live: dev holds two identical Livonia rows (`j5728ejqz…`,
`j57fyw7wd…`), 418 lines each, created 16 minutes apart.

Fix: dedupe attachments on `contentHash`, which is already computed.

### Low

- **L3** `convex/documents.ts:28` — `recent` orders by `_creationTime`, but a
  re-read patches `fetchedAt`. A freshly re-checked document never resurfaces
  on the board. Needs a `by_fetchedAt` index if freshness is the intent.
- **L4** `convex/mail.ts:222` — an unrecognized payload is dropped with
  `console.error` and no record, which is invisible in a deployment that
  retains no failure logs.
- **L5** `convex/mail.ts:689` — `attach` notifies at most `.take(100)` threads.
  Subscriber 101 is silently never told the clause moved, which is the one
  thing the watch exists to do. Unlike the other bounded reads, this one
  carries no `ponytail:` note naming its ceiling.

## Candidate — evidence too thin to score

**Line count moved on a static PDF with no parser change.** The CMS Summary of
Benefits read 173 lines on 09-05 under parser v1, 171 on the board after H3
bumped it to v2, and **174** on 09-08 — same parser version, 6.5 hours after that
morning's cron sweep, on a sample PDF with no reason to change. Either the file
moved or Firecrawl's parse of it is not deterministic. If it is the second, this
document re-extracts every night for nothing, and the hash-churn candidate below
is not about dynamic pages at all.

Confirm before acting: two `mail:probe` runs ten minutes apart against that URL,
comparing `contentHash` and `lineCount`. Same shape as the PayPal test below and
worth running in the same sitting.

**Hash churn on dynamic pages.** `lines.ts` `fingerprint` hashes the stripped
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

**One thing the rows said that the logs could not (2026-09-06).** The board carries
`lastCheckedAt`, `fetchedAt` and `verifiedAt`, and all three are readable without
credentials. On the 09-06 sweep they show six documents stamped inside two
minutes at the cron's scheduled 11:17 UTC, three of them re-extracted and three
stopped before the model — which is the early exit, the schedule and both change
gates, observed from outside with no log access at all. Where a claim can be
asked of the data instead of the logs, ask the data.

## Fix order

**H4 → M5 → M2 → (L3, L4, L5).**

H4 first, and not because it is scored highest. It is the only open flag that
makes a promise this project already sent to a real inbox untrue — the STOP
sentence went out in the 09-08 reply and is quoted verbatim in
[`transcript-sbc.md`](transcript-sbc.md). Its cost half can wait; its
unsubscribe half cannot, because the people it fails are the ones who asked to
be left alone.

M5 next, because the transcript is meant to be the first thing on the landing
page and M5 is the reason a hostile reader would disbelieve it.

Everything above M2 that is not H4 or M5 is closed. H2 was first because it was the only one that
cost money while nobody was watching; M4 next, because P5 turned it from a flag
about one stranger into a flag about everyone on a forwarded thread; H3 after
M4 deliberately, because it is the deploy most likely to send mail nobody asked
for and M4 is the way out for anyone wrongly mailed; M3 last of the four,
because until it landed the next audit had silence where evidence should be.

M2 is what is left, and it is cheap: dedupe attachment documents on the
`contentHash` that is already computed.
