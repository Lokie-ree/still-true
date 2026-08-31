# still-true

Public answers that tell you when they stopped being true.

Ask a question by email; get back an answer with the source page it came from and
the date that page was last verified. When the source page changes, the answer
flips stale on a live board and the owner is emailed. When there is no answer,
it refuses to guess and routes the question to a named owner instead.

Built for the Convex All Gas Hackathon (Aug–Sep 2026).

## Stack

- **Convex** — persistent state, live queries, crons
- **Firecrawl** — crawl and change detection on source pages
- **AgentMail** — the email front door
- **OpenAI** — question matching and answer extraction

## Status

In progress. The schema, the answer board, and the change-detection spike (crawl a
source page, notice it changed, mark its answers stale, email the owner) are working.
The email front door and question matching are not built yet.

Build log: [`hackathon.md`](hackathon.md).
