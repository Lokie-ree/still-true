# still-true

**Forward it a document. Find out what it actually requires of you.**

Send a lease, a terms-of-service update, an insurance renewal — as an attachment
or a link — to an email address. You get back what that document requires of you
and by when, with **every claim quoted from the source and the line it came
from**. Where the document is silent, it says so and tells you how many lines it
searched. For documents that live at a URL it keeps watching, and tells you when
the specific thing you asked about changes. CC it on a thread instead and the
same cited reply lands in the thread.

Built for the Convex All Gas Hackathon (Aug–Sep 2026).

## Why it can be trusted

The model never writes the answer text. It reads the document and returns **line
numbers**; the quote you see is pulled out of the source by index. So the system
cannot show you a sentence that is not in your document — the quote *is* the
document. That is a structural guarantee, not a prompt instruction.

It can still cite a true line that does not answer the question. That is why
every citation is visible and one click from its source.

Two things it deliberately does not do: it never interprets, advises, or judges a
document, and it is not legal advice. It quotes and it counts.

## Stack

- **Convex** — state, indexes, scheduled re-checks, realtime queries, static hosting
- **AgentMail** — the inbox: signed inbound webhooks with attachments, replies and change notices
- **Firecrawl** — PDF parsing, link fetching, and `changeTracking` for the watch
- **OpenAI** — constrained extraction returning line indices and an explicit refusal verdict

## Status

Day 6 of 20. **P0 is shipped and deployed:** the schema, the read API, and a
production deployment carrying no public writes. The ingest path, extraction,
the reply, and the watch are not built yet.

The live URL currently serves an empty board, which is correct — it previously
showed seed rows for a product that no longer exists.

- Build log and every decision, including the ones that were reversed: [`hackathon.md`](hackathon.md)
- Evidence, including two probes that fired no decision rule: [`docs/probe.md`](docs/probe.md), [`docs/probe-v3.md`](docs/probe-v3.md)
- An external pre-build assessment, and which of its recommendations were declined: [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md)

## Development

```sh
npm install
npm run dev        # convex dev + vite
npm run lint       # typecheck + eslint
npm run deploy     # build, push functions, upload static files
```

Firecrawl and AgentMail keys are Convex deployment environment variables, never
files in this repository. Set them with `npx convex env set <NAME> <value>`, and
again with `--prod` — deployment variables do not travel between deployments.
