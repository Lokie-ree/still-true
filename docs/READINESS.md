# Readiness flags — open at the start of P5

Last audit **2026-09-07** (third pass). Score **72/100**:
`100 − 15(H3) − 5×2(M2,M3) − 1×3(L3,L4,L5)`.
Passes have scored **58 → 67 → 82 → 72** (09-03, 09-05, 09-05 evening, 09-07).
The deltas are `+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`, then
`+15 H2 closed`, then `+5 M4 closed, −15 H3 opened`.

**The score went DOWN and that is the point.** Nothing regressed; a flag that
was always there got found. H3 is the first high flag since H2 closed, and it
surfaced from feeding production two real links rather than from re-reading the
code — which is why two audits scored 82 with it sitting open the whole time.

**M2, M3 and the lows are known and parked.** Randall has seen those and chose
to carry them into P5 rather than fix them first. Do not re-run the audit to
rediscover them, and do not fix one unasked — read the fix order at the bottom
and ask. **H3 is NOT parked**: it is new as of 2026-09-07 and its fix is the
next PR.

## Open

### H3 — a link-shaped page produces confident FALSE refusals (high)

`convex/lines.ts`, `stripMarkup`; measured 2026-09-07.

`stripMarkup` deletes every href. On a page whose body lives behind its links,
the href WAS the answer, and what the extractor is handed is a document with the
content removed — which it then honestly reports as silent.

**Proven case, not a theory.** Pandora `T2b "How do you cancel?"` → `not_stated`,
while line 144 reads *"You may cancel your account and terminate this Agreement
at any time and for any reason by following the instructions outlined in this
Listener Support Help Article"* — and the deleted href was
`help.pandora.com/s/article/Cancel-Deactivate-or-Delete-your-Account-…`.
Scored **high** because the refusal is the one claim this project stakes
everything on, and the inbox is now on a public submission page and a LinkedIn
post. Downgrade it if you disagree; do not leave it unscored.

A second, harsher shape has no cheap fix: `facebook.com/privacy/policy` is a
summary shell whose sections are headings with the body one link away, and it
answered 2 of 8 while printing "Searched all 1,182 lines" six times. Keeping the
hrefs does not put Meta's text on the page — nothing cheap does — but it stops
the parser throwing away the only pointer to where the text is.

**Do NOT reach for a shell detector.** Three were predeclared and measured on 24
documents on 2026-09-07 and all three false-positive on real documents:
`%chars in lines ≥120 < 60` catches the DOL COBRA model notice (12) and HUD-5380
(28); a `"learn more"` rate catches Microsoft's genuine privacy statement (7.01)
and MISSES `meta.com/legal` and `apple.com/legal` (0 each); refusal rate puts
Meta's 75% inside the range of the CMS Summary of Benefits (63%). The
false-positive budget is zero — refusing to read somebody's real lease is worse
than any refusal this flag describes.

Fix: keep the href when the link label cannot stand alone (`this`, `here`,
`article`, `page`, `help`). **It cannot ship alone.** Replaying all 54 published
prod findings through the real `change.stillSays` under the modified parser
reports **6 as `gone`** (spotify T2b, sbc U4/U2/U1a, paypal T3b/T2b) — change
notices about documents that never moved. Control under the current parser: 0 of
54. So the parser change carries a full corpus re-read in the same deploy, ahead
of the next 11:17 UTC sweep.

### M3 — a failed `watch.recheck` is silent to everyone (medium)

`convex/watch.ts:96`.

The M1 class, reopened on the watch path. A re-check throws, the workpool
retries three times, and then nothing is written anywhere: no thread exists so
there is no `threads.error`, and nothing lands on `documents`. The only
surviving signal is a `lastCheckedAt` that quietly stops advancing — while
`reply.ts`'s WATCH paragraph goes on promising a daily re-read.

The code comment argues that a failed function in the logs is enough. It is
not: prod log reads are refused by the read-only MCP selector and dev retains
zero failure entries, so in practice nobody sees it.

Fix: a `watchError` field on the document row, the way `ingest` records one on
the thread.

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

Log evidence is thin and has been since 09-03. Prod log reads are refused by
the read-only MCP selector; dev retained zero entries. "No failures observed"
is absence of evidence, not evidence of absence.

**One thing the rows said that the logs could not (2026-09-06).** The board carries
`lastCheckedAt`, `fetchedAt` and `verifiedAt`, and all three are readable without
credentials. On the 09-06 sweep they show six documents stamped inside two
minutes at the cron's scheduled 11:17 UTC, three of them re-extracted and three
stopped before the model — which is the early exit, the schedule and both change
gates, observed from outside with no log access at all. Where a claim can be
asked of the data instead of the logs, ask the data.

## Fix order

**H3 → M3 → (M2, L3, L4, L5).**

H2 was first because it was the only one that cost money while nobody was
watching. It is closed. M4 was next because P5 turned it from a flag about one
stranger into a flag about everyone on a forwarded thread; it is closed too, and
it shipped before the parser work deliberately — the H3 fix is the deploy most
likely to send mail nobody asked for, and M4 is what gives anyone wrongly mailed
a way out.

**H3 is first now.** It is the only open flag that makes the product's own
central claim wrong rather than making it run less reliably, and it is wrong in
the direction nobody can see: a refusal carries no citation to open, so a false
one is indistinguishable from a true one by reading the reply. Its fix must
carry the corpus re-read described above.

M3 ships after, and before the next audit. Until it lands the audit after this
one has silence instead of evidence.
