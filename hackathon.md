# Hackathon log

- **Project:** still-true
- **Event:** Convex All Gas Hackathon
- **What it does:** Answers public questions by email with the source page and verification date behind each answer, flags answers stale when the source page changes, and routes unanswered questions to a named owner.
- **Live app:** https://impressive-marten-163.convex.site
- **Repo:** https://github.com/Lokie-ree/still-true (public)
- **Frontend:** Convex static hosting
- **Convex deployment:** impressive-marten-163 (production)
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, internal mutations, internal actions, realtime queries
- **Auth:** none
- **AI models:** none
- **Started:** 2026-08-29T15:29:17Z
- **Last updated:** 2026-08-31T18:50:24Z

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

### 2026-08-30 - bec710b
Changed `spike.check` from `action` to `internalAction`. As a public action any
caller who found the deployment could trigger crawls and spend Firecrawl credits;
it is invoked only by the CLI today and by a scheduled job later. Verified against
the running backend: an unauthenticated `/api/action` call for `spike:check` is
refused with "Could not find public function", while the public `answers:board`
query still serves. Added an internal `dropSource` mutation that deletes a source
and its answers, and used it to clear disposable seed rows (`convex/spike.ts`).

### 2026-08-30 - working tree
Created the GitHub repository as private and pushed the history: the bootstrap
commit on `main`, then the scaffold, schema, and spike branches as three ordered
single-concern pull requests, each self-merged with a merge commit. The repository
must be public at submission; that flip is a deliberate later step.

### 2026-08-31 - working tree
Claimed the anonymous deployment into a cloud project and deployed the board.
Production is `impressive-marten-163`. `npm run deploy` pushes the Convex functions,
builds the Vite client with the production `VITE_CONVEX_URL` baked into the bundle, and
uploads the static files through the `@convex-dev/static-hosting` component. The board is
live and a stranger can open it with no login.

The live URL is on `convex.site`, not `convex.app`. `convex.config.ts` mounts static
hosting on the HTTP router (`app.use(staticHosting, { httpPrefix: "/" })`) and pushes the
app's own endpoints under `/api`, so the site is served from the deployment's HTTP-actions
domain by construction. Verified from outside the project: the document, stylesheet and
bundle all return 200, the bundle carries the production `.convex.cloud` address, and the
board renders "No answers yet." rather than "Loading..." — a string only the
`answers.length === 0` branch can produce, so the reactive query resolved against
production instead of hanging on a bad connection.

Two things are not yet true in production, both found by checking rather than assuming.
The AgentMail key is set on the production deployment under the name `AGENTMAIL_API_KEY`,
while `spike.check` reads `requireEnv("AGENT_MAIL_API_KEY")` — the names disagree, so the
first alert send in production would throw. This is the deployment-variables-do-not-travel
hazard that `convex/env.ts` was written for, arriving as a renamed key rather than a
missing one; `FIRECRAWL_API_KEY` matches on both deployments. Separately, the production
database is empty: the deploy created the tables and their three indexes, but rows do not
travel between deployments, so the seed still exists only on the local deployment.

The repository was flipped to public the same day, after a re-run of the pre-flight secret
scan across all 17 commits on every ref came back clean: no `.env` file was ever added,
`.env.local` is gitignored and untracked, and no key material appears in any diff.
