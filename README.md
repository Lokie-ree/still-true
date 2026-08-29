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

Setup only. No application code yet.
