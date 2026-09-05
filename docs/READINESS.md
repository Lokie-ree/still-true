# Readiness flags — open at the start of P5

Last audit **2026-09-05** (second pass). Score **67/100**:
`100 − 15(H2) − 5×3(M2,M3,M4) − 1×3(L3,L4,L5)`.
First pass 2026-09-03 scored 58; the delta is
`+15 H1 closed, +5 M1 closed, −5 M3, −5 M4, −1 L5`.

**These are known and parked.** Randall has seen all of them and chose to
carry them into P5 rather than fix them first. Do not re-run the audit to
rediscover them, and do not fix one unasked — read the fix order at the
bottom and ask.

## Open

### H2 — unbounded, recurring spend on a publicly-listed inbox (high)

`convex/mail.ts` `received` → `ingest`, plus `convex/crons.ts`.

Every inbound message carrying an attachment or a body URL buys one Firecrawl
scrape (200 PDF pages, 120s) and two OpenAI calls on up to 600k chars. There is
no rate limit and no per-sender cap, and the address is a `mailto:` on the
public board. P4 made it worse: a url-backed document mailed in is re-scraped
**every day forever**. 500 mailed URLs is 500 scrapes + 1,000 model calls
today, then 500 scrapes/day thereafter.

Svix proves the webhook came *from* AgentMail. It bounds nobody who *mails*
AgentMail.

Fix: `@convex-dev/rate-limiter` keyed on `fromEmail`, plus a cap on watched
documents per sender.

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

Fix: a `STOP`-style keyword handled in `mail.received`, or a signed
unsubscribe link in the footer.

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
- The `occRetried` warning on `agentmail/callbackPool` (2 calls,
  `occ_retry_count: 0`) — inside the component's sandboxed tables, not our
  code, not actionable.

## Coverage — what the audit could not see

Log evidence is thin and has been since 09-03. Prod log reads are refused by
the read-only MCP selector; dev retained zero entries. "No failures observed"
is absence of evidence, not evidence of absence.

## Fix order

**H2 → M3 → M4 → (M2, L3, L4, L5).**

H2 first because it is the only one that costs money while nobody is watching.
M3 second because until it lands, the next audit has silence instead of
evidence.
