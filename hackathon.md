# Hackathon log

- **Project:** still-true
- **Event:** Convex All Gas Hackathon
- **What it does:** Answers public questions by email with the source page and verification date behind each answer, flags answers stale when the source page changes, and routes unanswered questions to a named owner.
- **Live app:** not deployed
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, tables, indexes, queries, mutations, internal mutations, actions, realtime queries
- **Auth:** none
- **AI models:** none
- **Started:** 2026-08-29T15:29:17Z
- **Last updated:** 2026-08-30T22:32:23Z

## Log

### 2026-08-29 - working tree
Set up the project shell. No application code yet. Initialized an empty Git
repository on `main` with `README.md`, `.gitignore`, and `.gitattributes`, and
recorded the intended stack in the README: Convex for state and live queries,
Firecrawl for crawl and change detection, AgentMail for the email front door,
and OpenAI for question matching and extraction. None of these are installed or
wired yet.

Installed agent tooling only: the Convex agent skills from `get-convex/agent-skills`
(`.agents/skills/`, surfaced to Claude Code through junctions in `.claude/skills/`)
and the Convex hackathon skill (`.claude/skills/convex-hackathon-skill/`).
Configured the Convex MCP server in `.mcp.json`; it is pending approval and not
yet connected. Frontend host chosen as Convex static hosting per the builder's
decision; nothing is deployed.

### 2026-08-29 - cae7385
Scaffolded the Convex + React/Vite app and replaced the template schema with the
domain tables: `sources` (watched page, owner, content hash), `answers` (pinned
to a source, with a verified date and a fresh/stale status), and `questions`
(inbound, with a null answer meaning it was routed rather than guessed). Added a
`by_url` index on sources and `by_source` / `by_status` on answers. Wrote the
board query and a `publish` seed mutation, and a minimal React board that reads
it through `useQuery` (`convex/schema.ts`, `convex/answers.ts`, `src/App.tsx`).

### 2026-08-30 - 086b9b0
Built the Block 0 spike and ran it end to end against a live public page.
`spike.check` is an action that scrapes a URL through the Firecrawl v2 API,
SHA-256 hashes the returned markdown, and hands the hash to an internal mutation
that compares it against the stored `contentHash`. On a difference the mutation
flips every answer on that source to `stale` and returns the owner address, and
the action sends the alert through the AgentMail API (`convex/spike.ts`).

Verified against a public GitHub gist: baseline crawl stored the hash and sent
nothing; a repeat crawl of the unchanged page produced an identical hash; editing
one line of the page produced a new hash, flipped two answers to `stale`, and
delivered an email whose send is confirmed in the AgentMail inbox. Two findings
worth recording. Firecrawl v2 serves cached scrapes by default, so `maxAge: 0`
is required or every re-crawl looks unchanged. And detection latency is bounded
by the source's own CDN cache, not by crawl frequency — the gist's raw-content
URL still served stale bytes after forty fetches, while its HTML page reflected
the edit immediately.

No secrets are stored in the repository. The Firecrawl and AgentMail keys are set
as Convex deployment environment variables, and the app is not deployed.
