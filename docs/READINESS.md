# Readiness flags — open at the start of P5

Last audit **2026-09-05** (second pass). Score **82/100**:
`100 − 5×3(M2,M3,M4) − 1×3(L3,L4,L5)`.
First pass 2026-09-03 scored 58; second pass scored 67. The deltas are
`+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5` then `+15 H2 closed`.

**No high flags remain open.**

**These are known and parked.** Randall has seen all of them and chose to
carry them into P5 rather than fix them first. Do not re-run the audit to
rediscover them, and do not fix one unasked — read the fix order at the
bottom and ask.

## Open

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

### M4 — no unsubscribe (medium)

`convex/reply.ts`, the `WATCH` constant.

Enrolment is automatic and by design; removal does not exist. One forwarded
link subscribes a stranger to mail from this address indefinitely, with no
opt-out token and no reply keyword.

**P5 raises this flag rather than adding to it.** A `cc` thread is replied to in
front of everyone on it — `mail.ts:89` and `mail.ts:119` both pass
`replyAll: thread.mode === "cc"` — and every thread against a document is mailed
when a clause moves (`mail.ts:764`). So one CC enrols a whole thread, none of
whom wrote to this address, in mail with no way out. The `WATCH` sentence at
`reply.ts:103` ends "You do not need to do anything," which is true today and
stops being defensible the moment there is something they could do.

Fix: a `STOP`-style keyword handled in `mail.received`, or a signed
unsubscribe link in the footer. The keyword has to be recognised ahead of the
ingest path rather than inside it: `received` only returns early for mail
carrying no document, so a bare "STOP" would otherwise be answered with
`noDocumentBody`.

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

**M4 → M3 → (M2, L3, L4, L5).**

H2 was first because it was the only one that cost money while nobody was
watching. It is closed.

**Reordered 2026-09-06: M4 moved ahead of M3.** M3 was first because until it
lands the next audit has silence instead of evidence, and that is still true —
it just is not the thing P5 makes worse. The CC reply turns M4 from a flag about
one stranger into a flag about everyone on a forwarded thread, all of whom get
replied to and none of whom wrote here. The inbox address is now on a public
submission page and a LinkedIn post, so the people with no way out are the
people being asked to judge it, and it is the one open flag that contradicts
what this project argues rather than how reliably it runs. M4 ships before P5.
M3 ships after, and before the next audit.
