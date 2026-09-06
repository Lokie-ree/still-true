# still-true

**Forward it a document. Find out what it actually requires of you.**

Send a lease, a terms-of-service update, an insurance renewal — as an attachment
or a link — to an email address. You get back what that document requires of you
and by when, with **every claim quoted from the source and the line it came
from**. Where the document is silent, it says so and tells you how many lines it
searched. For documents that live at a URL it keeps watching, and tells you when
the specific thing you asked about changes.

Built for the Convex All Gas Hackathon (Aug–Sep 2026).

Live: **https://impressive-marten-163.convex.site**

## Why it can be trusted

The model never writes the answer text. It reads the document and returns **line
numbers**; the quote you see is pulled out of the source by index. So the system
cannot show you a sentence that is not in your document — the quote *is* the
document. That is a structural guarantee, not a prompt instruction.

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

## Status — 2026-09-06

**Live on production and answering real mail.**

- **P1–P3 — the inbox, the parser, the extractor and the cited reply:** shipped.
  Production answered a forwarded link in 15 seconds with six quoted findings and
  one refusal.
- **P4 — the watch:** shipped, and the schedule has now run without a hand on it.
  A sweep on development caught both clauses edited on a test fixture, quoted each
  before and after with its line, stamped nothing on the other 22 answered
  findings, and mailed the change into the thread that had asked about it —
  unprompted, 2m17s after the clauses moved. On production the 2026-09-06 sweep
  stamped all six documents between 11:17:09 and 11:19:16 UTC, the cron's
  scheduled minute: three read identically and stopped before the model ran,
  three had moved text and were re-extracted, and **no clause any finding had
  quoted was gone, so nobody was emailed.** That is both gates, on real
  documents, with nobody watching.
- **P5 — the CC reply:** not built. Closer than that sounds, and the gap is not
  the routing: `mail.received` already tells a CC from a forward by which header
  carries the inbox address, `threads.mode` stores it, and both the reply and the
  change notice pass `replyAll` through to AgentMail's `reply-all` endpoint. What
  is missing is the case that makes CC worth doing — on a real thread the
  document is attached to an earlier message, and `received` only reads the
  message that CC'd us. No test covers the CC path and it has never run against
  production.

The public board carries six documents, 37 answered findings and 10 refusals, as
of the `npm run gate` run on 2026-09-06. It said 35 and 12 the day before: two
refusals became answers on the unattended sweep, on documents whose text had
moved. Whether those clauses were added or the model simply read them this time
is not something this system can tell you — two deployments reading these same six
documents hours apart on 09-04 disagreed on 2 of 47 cells — and it does not claim
either. A clause that merely appears is never reported as a change, because
there is no previous quote to show you. The counts move on their own, which is
why the gate reads them from production instead of trusting this line.

- Build log and every decision, including the ones that were reversed: [`hackathon.md`](hackathon.md)
- **Known open issues, scored, with a fix order: [`docs/READINESS.md`](docs/READINESS.md)**
- Evidence, including two probes that fired no decision rule: [`docs/probe.md`](docs/probe.md), [`docs/probe-v3.md`](docs/probe-v3.md)
- An external pre-build assessment of a since-abandoned direction, and which of its recommendations were declined: [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md)

## Development

```sh
npm install
npm run dev        # convex dev + vite
npm run lint       # typecheck + eslint
npm test           # 66 tests, all pure: extraction, lines, change detection, reply wording
npm run gate       # lint + test, then five read-only checks against production
npm run deploy     # build, push functions, upload static files
```

Runnable by hand against a deployment:

```sh
npx convex run mail:probe '{"url":"https://example.com/terms"}'   # read one URL into the public corpus
npx convex run watch:sweep                                        # re-check every watched document now
```

`AGENTMAIL_API_KEY`, `FIRECRAWL_API_KEY`, `OPENAI_API_KEY` and `OPENAI_MODEL`
are Convex deployment environment variables, never files in this repository. Set
them with `npx convex env set <NAME> <value>`, and again with `--prod` —
deployment variables do not travel between deployments.
