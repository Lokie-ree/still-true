# Hackathon log

- **Project:** still-true
- **Event:** Convex All Gas Hackathon
- **What it does:** Keeps an organization's public answers true. Each answer is pinned to the source page it came from and carries a verification date; when that page changes in a way that affects the answer, the answer is repaired from the new page and re-dated, and a named owner is emailed only when the new answer cannot be verified against the page. Questions arrive, and answers return, by email.
- **Live app:** https://impressive-marten-163.convex.site
- **Repo:** https://github.com/Lokie-ree/still-true (public)
- **Frontend:** Convex static hosting
- **Convex deployment:** impressive-marten-163 (production)
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, internal mutations, internal actions, realtime queries
- **Auth:** none
- **AI models:** none
- **Started:** 2026-08-29T15:29:17Z
- **Last updated:** 2026-09-01T18:45:30Z

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

### 2026-09-01 - working tree
Two defects closed, one absence found, and then the product's claim changed.

`answers:board` was returning the whole `sources` document to every caller, so `ownerEmail`
was served by a public query on a public deployment. `App.tsx` renders only the URL, which
hid the field on screen without removing it from the response. The query now projects the
source down to its URL (PR #8), deployed and verified against production: `source` comes
back carrying `url` and nothing else.

Production was seeded with four disposable answers across two invented sources — a fictional
"Northgate Unified School District," adult-facing and obviously synthetic, published as two
public gists so a watched page can be edited on demand. The board is no longer empty.

Then the absence. Editing a watched gist changed nothing, and the reason is that **nothing
invokes `spike:check`**: there is no cron, no scheduled function and no HTTP route anywhere
in the project, and the only reference to `internal.spike` is the action calling its own
mutation. A watched page has no path to the database. Both seeded sources still carry
`contentHash: ""` with `lastCheckedAt` equal to their creation timestamp, so no crawl has
ever run against production. This is missing work rather than a regression — the scheduled
re-crawl was Block 2 on the build schedule and was never written.

**The hero claim changed as a result.** The product was "flags answers stale when the source
page changes." That flips every answer on a source whenever any byte of the page moves, so a
nav tweak or a footer year marks a whole board stale, the alerts become noise, and the email
can only say "re-verify" — handing back the exact labor the product exists to remove. It is
now **the answer repairs itself**: a change is judged against the facts an answer actually
depends on, the answer is re-extracted from the new page, and a human is involved only when
that cannot be verified.

Three things follow, none of them built yet.

- Firecrawl's own `changeTracking` format supersedes the hand-rolled hashing. It holds the
  previous scrape per URL and reports `changeStatus`, plus — in `json` mode — field-level
  previous/current values against a declared schema, so a cosmetic edit outside that schema
  reports no change at all. `contentHash`, the SHA-256 helper and the empty-hash baseline
  branch all become deletions.
- Repairs are gated on grounding rather than confidence: the model must quote the verbatim
  sentence from the new page that supports its proposed answer, and that quote is checked
  against the crawled text before anything is published. A confidently wrong answer carrying
  a fresh verification date is worse than an honest stale one. Naive substring matching is
  brittle against markdown normalization, and that is an open question, not a solved one.
- OpenAI enters the product for the first time — extraction, question matching, and repair
  judgment. No model is wired yet, and the `AI models` field above still reads `none`
  because that is still true.

The 09-01 dry submission was **deliberately not filed**. The build is not demo-ready and the
footage would be discarded on the first real rebuild; multiple submissions are allowed, so
nothing is spent by deferring. A research day was called before any further building, on the
grounds that the project twice reached for custom code where the stack already provides the
capability: the hashing above, and a crawl/extract/repair pipeline over four flaky
third-party APIs written as loose internal actions while no Convex component is in use.

## 2026-09-02 — the probe ran, and the front door changed

The v1 probe did not execute. Twenty minutes on the first district produced zero rows: facts
live in PDFs and in outbound links to LDOE, not in comparable HTML on two pages. That is a
finding about the probe's design, not about the product, and it is not the null result that
would have justified falling back to the monitor. **v1 looked for a claim page and an
authority page inside one organization. K-12 does not store contradictions on that axis.** It
stores them on the fan-out: one authority, restated by dozens of downstream pages, each
maintained by a different person on a different day.

Rewritten and swept machine-assisted: ten pages, about twelve minutes, against
`R.S. 17:239` (Act 313, 2024) as the authority. `MATCH 2 · CONFLICT 2 · STALE 2 · SILENT 3 ·
DEAD 2`. Three schools in Jefferson Parish give three incompatible answers to where a phone
goes — Haynes says a school bag and calls a pocket illegal, Adams says off and not visible so
a pocket passes, Woods collects them in a box. Only Haynes tracks the statute; Woods lawfully
exceeds it; **Adams falls short of it, and "not visible" versus "on his person" is adjudicable
against quoted text.** The district's own online-policies page still cites a 2019-2021
handbook, and two `/Page/NNNN` URLs that live web search still returns are hard 404s.

One hypothesis died. LDOE's January 2025 migration from `louisianabelieves.com` to
`doe.louisiana.gov` is a clean path-preserving 301, deep links included. There is no link rot
to exploit and no link checker to build. LDOE's problem is retrieval, not drift — a different
product, deliberately not chosen.

**The grounding invention broke on PDFs and was repaired.** Two real handbooks through
Firecrawl `/v2/scrape` with `parsers:["pdf"]`: EBR at 324 KB and LPSS at 372 KB of markdown.
1,688 and 981 lines respectively continue mid-sentence, because a PDF hard-wraps at the visual
column — so `lines[n]` returns half a clause, the quote is unreadable, and the receipt fails
even though fabrication remains impossible. A five-line reflow pass that joins continuation
lines before numbering takes both to **zero**, and EBR line 606 becomes one complete citable
rule. Two different PDF producers, same result; on HTML the pass is a near no-op, so one code
path serves both. A second hazard surfaced that the structural guarantee cannot catch: LPSS's
first keyword match was a table-of-contents dot-leader line, which really is in the document.
That is a relevance failure, the class that survives by design, and `/\.{6,}\s*\d+$/` removes
56 of them. The stored citation is now the quote **and** the index, not the index alone —
Firecrawl's parser output can shift between scrapes, and `lines[n] !== storedQuote` is then not
a bug but the change signal, re-locating for free.

**The MVP is locked: a comparison matrix.** Ten districts, five questions parents actually
ask, fifty cells, each carrying the district's own words with the line it came from and the
date it was checked — or an explicit refusal naming how many lines were searched. The sweep
found only one hard legal conflict in ten pages, which is too thin to headline; it found
variation everywhere, which is plentiful. Reporting variation with receipts dissolves the
`AMBIG` kill criterion that was the largest risk on the audit path, because the tool never has
to rule, only to quote. Email a question in and get a cited answer back; subscribe to a cell
and get the diff when it moves. That gives AgentMail a native job instead of the bolted-on
alarm it was in the monitor framing.

Nothing is built yet. `Auth` still reads `none` and `AI models` still reads `none`, because
both are still true. Deadline confirmed as **September 22, 12:00 PM PT** — two days later than
the plan had assumed, and the submission targets the 21st so the last day is margin.
