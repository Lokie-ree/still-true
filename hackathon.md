# Hackathon log

- **Project:** still-true
- **Event:** Convex All Gas Hackathon
- **What it does:** Forward it a document — a lease, a terms-of-service update, an insurance renewal — and it replies with what that document requires of you. Every claim is quoted from the source with the line it came from, and it says plainly where the document is silent. For documents that live at a URL it keeps watching, and tells you when the specific thing you asked about changes.
- **Live app:** https://impressive-marten-163.convex.site
- **Built as of 2026-09-06:** the inbox, the parser, the extractor and its grounding
  guarantee, and the cited reply — **live on production**, which answered a forwarded link
  in 15 s with six quoted findings and one refusal. The public board carries six documents;
  the findings count is one `npm run gate` reads from production rather than from this
  line. **The watch is built and proven on development**:
  a sweep over four documents caught both clauses that were edited on a test fixture, each
  quoted before and after with its line, and stamped nothing on the other 22 answered
  findings — and **mailed the change to a real inbox**, unprompted, into the thread that
  had asked about the document, 2 minutes 17 seconds after the clauses moved. **It is live
  on production**, where the first sweep re-read all six board documents and stamped
  nothing, and on 2026-09-06 the cron fired unattended. **The CC reply (P5) is not
  built** — the CC/forward routing exists; reading the document out of the thread
  history does not.
- **Repo:** https://github.com/Lokie-ree/still-true (public)
- **Frontend:** Convex static hosting
- **Convex deployments:** impressive-marten-163 (production), charming-kookabura-768 (development)
- **Components:** @convex-dev/static-hosting, @agentmail/convex, @convex-dev/workpool
- **Convex features:** schema with a discriminated-union table, indexes, public queries carrying explicit return validators, realtime queries, an HTTP action, the scheduler, cron jobs, and internal mutations, queries and actions. Every write is internal — the only thing that reaches them from outside is the component's signature-verified webhook.
- **Auth:** none
- **AI models:** gpt-5.6-terra (OpenAI Responses API, strict JSON schema). gpt-5.6-sol held as the tiebreaker if a gate ever fails; gpt-5.6-luna, the plan's original pick, has never run.
- **Started:** 2026-08-29T15:29:17Z
- **Last updated:** 2026-09-06

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

## 2026-09-02 (later) — the assessment, and what it cost

Consulted an external agent for a pre-build assessment. It found four method errors in the
morning's probe and two real defects in the code. Verified every one before acting on it, and
all six hold. Recording what they cost, because the cost is the point of keeping this log.

**The `② GO` was wrong.** Two rows were coded `SILENT` because their HTML carried no rule —
without following the link each one carries to the district's controlling **2026-2028
Procedures & Policies** handbook. That is precisely how probe v1 failed nine hours earlier. I
repeated the mistake in the fix for it. Scraped the handbook: 363 KB, 3,505 lines after reflow.
Line 618 reads *"Each school will establish and communicate consequences for violating its
electronic device policy"* — the district **delegates** consequences, so the Haynes-warning
vs. Adams-referral finding was never a finding. Line 608 states the possession rule with no
such delegation clause. Also struck: the Adams `STALE` label (the `2024-2025` reference sits in
the grading section, verified by direct fetch), the `CONFLICT` code (never predeclared,
introduced after seeing results, and `VARIANT` then vanished from the summary line that STOP
rule ① depends on), and the "90 seconds vs. 20 minutes" claim (the 20 minutes produced zero
rows under a different protocol — not equivalent tasks). Recoded one primary code per row:
`MATCH 4 · VARIANT 2 (22%) · STALE 1 · DEAD 2`. **No decision rule fires.** Writing that down
instead of reaching for a rule that flatters the build.

**The finding is omission, not contradiction.** The taxonomy asked whether restatements
contradict the authority; repaired, mostly they don't — one adjudicable case in nine, and it is
now text-against-text (the handbook says *properly stowed away*, Adams says *not visible*, a
pocket passes both the school's test and neither of the district's). What the taxonomy could
not see is that the handbook publishes material facts the school pages **do not carry at all**:
an IEP/504/IHP exemption at lines 622-623, and testing confiscation that invalidates the
assessment at line 616. Neither appears on Haynes, Adams, or Ehret. Haynes does not even link
the handbook. A parent whose child runs a glucose monitor on their phone cannot learn from
their school's page that the ban does not apply to them. Nobody is wrong; the parent is still
uninformed. Pre-registered the coverage threshold **before** extending the sample, so it cannot
be tuned the way the `GO` was.

**The axis was wrong, and that is the real re-scope.** The probe design says *one authority,
many restatements* — then the MVP scoped to ten districts, which compares ten different
authorities and abandons the axis the finding lives on. Rows are now **schools under one
handbook**: Jefferson Parish, 8 schools, 3 questions, 27 cells against a document already
parsed clean. The P1 discovery tail that was the plan's largest risk disappears, because the
corpus is already in hand. Auth comes out — not an eligibility requirement, and `publish` has
to become internal regardless.

**Two code defects confirmed by grep.** `answers.publish` is a public unauthenticated mutation:
anyone who finds it can write arbitrary answers, URLs, and owner emails into production. And
`spike.ts` still reads `AGENT_MAIL_API_KEY` while the deployment holds `AGENTMAIL_API_KEY`.
Both die in P0 with the schema, but the first one is live right now.

**Where the assessment was wrong: the two-day validation gate.** It proposed spending days 7
and 8 on research, including interviewing five parents inside 24 hours during the school year,
behind a gate — *"proceed only if users recognize an actionable problem"* — that cannot fail
cleanly. A gate that cannot fail gets fudged. That is the AIDA failure mode with a rubric
stapled to it. The evidence repair that actually mattered took twenty minutes. It also
conflates *unvalidated* with *wrong*: most of its seven unsupported claims are product
decisions, not empirical propositions. And its own **Recommended MVP** section describes the
locked build at smaller scope — parent-facing, one district, receipted cells, explicit refusal,
same sponsor boundaries — while its executive summary says not to build it. Took the scope cut
and the corrections. Declined the gate.

Still `none` for `Auth` and `AI models`. Still true.

## 2026-09-02 (evening) — the domain changed, the engine did not

Builder was not sold on the school build and asked for something not tied to school business.
That is the fourth direction question in one day, and unlike the first three it came from a
feeling rather than from evidence. So it was converted into evidence before it was acted on.

**Probe v3 was predeclared and committed before a single document was fetched** — taxonomy,
two expectation lists, and all three thresholds fixed in `c970533`. That is the direct fix for
the morning's `② GO`, which was called on codes invented after seeing results.

**Run 1 was discarded whole.** Netflix returned 360 chars and Planet Fitness 389 — JS-rendered,
so Firecrawl got nothing, and coding those `ABSENT` would have repeated the morning's error
exactly. Two of three "leases" were **articles about leases**, not leases. Added a
`< 6,000 chars → EXCLUDED` guard and re-ran.

**Run 2 fired no rule either.** 15 coded cells, all terms-of-service, all three lease fetches
failed including HUD's model lease at 15 chars: `PRESENT 53% · BURIED 20% · ABSENT 27%`.
Omission needed 30%, retrieval needed 40% buried, stop needed 70% shallow.

**And the reason is the finding.** The tally is untrustworthy in both directions — `ABSENT` is
contaminated by regex misses (Apple obviously says it can change terms) and by
not-applicable cells (PayPal is not a subscription); `BURIED` by first-match noise (PayPal's
data hit at 100% depth matched "personal data provided to you by PayPal", not a sharing
clause). And `AMBIG` — *stated, but not in terms a person could act on* — **cannot be assigned
by any regex at all**, which is the distinction the whole product turns on. Keyword sweeps
worked on the handbook because policy sentences are short and self-contained; legalese is
diffuse and cross-referenced. **The extractor is the instrument, so no further sweep has
information value.** That ends the probing phase on evidence rather than on impatience.

**What needed no probe**, measured at 238 wpm: AT&T's consumer service agreement is **51,654
words, 3 h 37 m of reading**. PayPal is 26,403 words. People click *I agree* on these. And in
both of the two largest documents the **arbitration opt-out sits at the 89th percentile** —
PayPal line 1005 of 1135, Spotify line 293 of 328 — the most time-limited right in the
document, typically a 30-day window, parked at the bottom.

**AgentMail attachments confirmed:** a message carries an `attachments` array with
`attachment_id`, `GET` returns the raw file, PDFs supported. The forward-a-lease path is real.

**Why this direction and not the school one.** The corpus problem disappears — no handbook
discovery, no seed URLs, no curation, no hand-fixing. Users bring their own documents, and
that was the largest remaining risk in the school plan. Everything else survives intact:
line-index grounding, the reflow and TOC filter, Firecrawl `changeTracking`, the Convex cron
and reactive UI, and AgentMail now carrying two real jobs instead of one bolted-on alarm. The
name fits better than before — *is this still true?*

**The hedge that makes this safe to commit on day 6.** The engine is domain-agnostic and the
corpus is config. If extraction on legalese proves unreliable, the identical code points at
the Jefferson Parish handbook, where the omissions are already found and quoted. The downside
is bounded by work already done, so no further validation day is warranted.

One caution carried into the build: *"summarize my contract"* is crowded. Three things
separate this and the demo must show all three — fabrication is **structurally impossible**
rather than merely unlikely, it reports **what the document does not say**, and it **keeps
watching** after you have stopped caring.

Still `none` for `Auth` and `AI models`. Still true, for a few more hours.

## 2026-09-02 (deploy) — the local deployment, and a hole that was open for four days

P0 was reported as closing the public-write hole. It had not. `npx convex dev` had been
pushing to a **local** deployment — `CONVEX_DEPLOYMENT=local:local-randall_p_lapoint_jr-still_true`,
`VITE_CONVEX_URL=http://127.0.0.1:3210` — so the new schema existed only on this machine.
`npx convex function-spec --prod` showed production still serving `answers.js:publish` as a
**public mutation**, exactly as it had since 08-29. Four days, on a public deployment, with
`ownerEmail` writable by anyone who found the name. The 08-31 entry already contained the tell
— *"the seed still exists only on the local deployment"* — and nobody read it as a warning.

Every `convex env set` run without `--prod` had also been landing on that local instance. The
production `AGENTMAIL_API_KEY` rename was real because it used `--prod`; the dev-side ones were
not.

Switched to a real cloud dev deployment, `charming-kookabura-768`, with both API keys carried
across, and deployed P0 to production. Confirmed from outside the project rather than from the
CLI's own success message:

- Production's public surface is now exactly two queries, `documents:recent` and
  `documents:findingsFor`. No mutations, no actions, no `spike`.
- `answers:publish` returns the same generic error as `nope:nothing`, a name that never
  existed — the control that distinguishes *removed* from *erroring*.
- `documents:recent` answers `{"status":"success","value":[]}`.
- The live bundle carries `impressive-marten-163.convex.cloud`. The second URL in it,
  `happy-otter-123`, is Convex's own example string inside `node_modules/convex`.

Two things found and deliberately not fixed in this pass. The live page still carries the
scaffold title **"Vite + React + TS"**, which a judge sees in the tab; it goes in the P6
reconcile. And the production board is now empty, which is correct — the fictional Northgate
rows described a product that no longer exists.

The lesson is narrower than "verify deploys." It is that a success message from the tool you
just ran is not evidence about the system you meant to change. `convex dev` reported success
every time; it was succeeding against the wrong machine.

## 2026-09-02 (cleanup) — making the repository describe the product it is

The repository still advertised the abandoned monitor. `README.md` opened with
*"answers that tell you when they stopped being true"* and claimed the change-detection
spike was working — a file that no longer exists, describing a product that was replaced
twice. Rewritten around the forwarded document, including the two things this tool
deliberately does not do: it never interprets or advises, and it is not legal advice.

Other stale context removed. The live page carried the scaffold title **"Vite + React + TS"**,
which is what a judge would have seen in the browser tab. `convex/README.md` was 90 lines of
untouched Convex template. `src/index.css` declared two near-identical media queries whose
only real content was the scaffold's default font stack; collapsed to one rule with a
dark-mode override, on a platform stack, because the interface is designed in P3 and choosing
a webfont now would be guessing.

The evidence files moved to `docs/` — `probe.md`, `probe-v3.md`, `ASSESSMENT.md` — so the root
holds the README, the log, and configuration. **They were kept rather than deleted for two
reasons:** the Jefferson Parish handbook is the written STOP fallback if extraction on legalese
fails in P2, so `docs/probe.md` is a live dependency and not history; and a log claiming two
probes fired no decision rule is worth less without the probes.

Verified rather than assumed: production holds only `documents`, `findings` and `threads`. The
old `sources`, `answers` and `questions` tables are gone, and the fictional Northgate rows with
them. Header fields corrected — the log claimed mutations and internal actions among the
project's Convex features, and there are none; every write in the new design is internal and
none are written yet.

Still outside this repository and still to be removed by hand: the two public GitHub gists that
stood in for watched pages during the 08-30 spike.

## 2026-09-03 (P1) — the front door, and a component instead of a hand-rolled webhook

Shipped in PR #13. A forwarded document becomes a `documents` row with a real line count: a
lease PDF forwarded from a phone parsed to **324 lines**, and a forwarded link produced a
second row at 412.

**The hand-rolled webhook was replaced by `@agentmail/convex` before it ever shipped.** The
first version verified the Svix signature by hand in an `httpAction`. The component owns
signature verification, `event_id` dedupe, and a workpool that dispatches the callback — all
in its own sandboxed tables — which leaves exactly one route of ours at `/api/agentmail` and
one line of handler. This is the standing lesson from the 09-01 research day, applied before
the custom code had a chance to accumulate: search for the vendor's component before writing
the integration.

A second dedupe guard sits on `messageId` in our own `threads` table. The component drops a
redelivered `event_id`; `messageId` is what actually must not happen twice, because one
message must produce one document and — from P3 — one reply, even if the same mail arrives
as a fresh event.

**A forwarded PDF never touches this system.** AgentMail hands out a short-lived signed URL
for an attachment, and Firecrawl is pointed at that. So the answer to *"people will forward
private documents"* is an architectural fact rather than a paragraph in the terms: the
database holds a line count and, later, a quote. It never holds the lease.

Three findings worth the log. Real AgentMail messages carry a **scalar `from`**
(`"Name <addr>"`), not the `from_` array the docs example shows — checked against a live
message rather than the docs. `@agentmail/convex` 0.1.0 declares types that disagree with
what it sends at runtime in two places, and both casts are marked `ponytail:` in the source
with the condition for deleting them. And the Convex log view surfaces only console output
and failures, so **a silent successful function leaves no line at all** — an empty log is not
evidence that nothing ran, which cost a wrong call before the tables were read directly.

## 2026-09-03 (P2) — the extractor ran, and the gate held

**`AI models` no longer reads `none`.** It has read `none` in every entry of this log since
2026-08-29, each time with a note that it was still true. It is not true any more.

PR #14. The instrument that probe v3 concluded was the only one left — *"no further sweep has
information value"* — now exists, and the STOP gate written into the plan on day 6 has been
run against it. **It passed. The Jefferson Parish fallback is not needed.**

**Three documents, 23 cells, every citation opened by hand.** PayPal's user agreement (1,227
lines, 7 answered), AT&T's consumer service agreement (2,059 lines, 8 answered), and the
Livonia Housing Authority public housing dwelling lease (421 lines, 6 answered). **21 of 21
answered findings are carried by their own quote. Zero unsupported findings published.** The
arbitration opt-out was located with a correct quote on both consumer agreements — PayPal
cites the *Opt-Out Procedure* row itself at line 1077 of 1227. The classifier was right 3 of 3.

**The lease corpus ran for the first time**, after all three lease fetches failed in probe v3.
Livonia refuses `L1`: 421 lines and the lease never says when the deposit comes back. It
defers to *"State of Michigan statute at the termination of this lease"* without naming a
number. Verified by hand against the source PDF — seven occurrences of *deposit*, none
carrying a deadline, and *refund* appears zero times. That is the product in one cell, on a
real lease from a real housing authority.

**The corpus grew by one list, predeclared.** A document that is neither a lease nor a terms
page — an HOA notice, an insurance renewal, a handbook — now gets a `universal` checklist of
five facts true of anything that puts an obligation on you. Firing the lease questions at an
insurance renewal publishes *"searched 2,140 lines; this document does not state the deposit
return window"* — a true sentence and a category error. The refusal is the half nobody else
ships, and it only carries weight when the question belonged to the document. Written before
the extractor ran once.

**The bug that changed the contract, and it is the same bug this project keeps finding.** The
first version took `support_lines` as a list, *"most direct first"*, and published
`lines[support_lines[0]]` as the receipt. On PayPal it answered the arbitration question
across several lines and shipped an answer asserting the 30-day opt-out under a quote that
said only that arbitration is binding. The quote was verbatim and real. It did not support
the sentence above it. Keeping `[0]` and discarding the rest made the loss silent — a
**relevance failure**, the class the 09-02 entry already named as surviving by design.

The contract is now **one `support_line` as a single integer**, and the answer may not assert
anything the cited line does not say. The schema cannot express the answer that broke. `0` is
the model's refusal value: out of range, so it refuses through the same rule as any other bad
index. On the re-run, T3 stopped claiming *"at least 21 days"* under a line that never said it.

Compound questions were then split across all three checklists — `lease 5→7`, `tos 5→8`,
`universal 5→8`. A question asking two things at once is unanswerable under a one-line
contract unless a document happens to print both halves on the same line, which made the
refusal rate a function of **formatting rather than content** — the very measurement the gate
exists to take. Split by the engine contract, not by any document's score, and before the
remaining gate documents ran. That ordering is the whole discipline; the reason is recorded in
`convex/questions.ts` rather than here, so it sits next to the thing it governs.

**Terra, not the flagship.** Gating on a model you will not ship measures nothing about what
you ship, so the gate ran on `gpt-5.6-terra` and `gpt-5.6-sol` is held as the tiebreaker: if a
gate ever fails, Sol on the same documents separates *the corpus failed* from *the model was
too weak*. The plan named Luna, which is the economy tier; it has never run. The model is an
environment variable, never code.

**Two corrections to claims this log has been making.** AT&T does **not** bury its arbitration
clause — it runs lines 127–208 of 2,059, inside the first tenth. The 89th-percentile finding
belongs to PayPal and Spotify only, and on a fresh scrape PayPal measures 87.8% rather than
88.5%. AT&T's story is length; PayPal's is depth. The 09-02 entry stated the percentile claim
correctly about "the two largest documents" in that sample, but the social-proof line built on
it merged AT&T's word count with PayPal's burial into one sentence, and that sentence is
falsifiable in one click. They are kept apart from here on.

**What the gate does not clear, recorded because it will not improve on its own.** Roughly 4
of 21 cells cite a true, supported, but *narrow* clause instead of the governing one — AT&T's
cancellation answer lands on OneConnect auto-billing, its data-sharing answer on
business-entity billing. The one-line contract trades relevance for support; that is the right
trade for a receipt-first product and it is a permanent cost, not a bug awaiting a fix. And
**refusals cannot be verified by the gate at all** — there is no citation to open. Every
*answer* is proven; no *refusal* is, and the refusal is the differentiator. Livonia `L1` was
checked by hand, and that does not scale.

**`Auth` still reads `none`**, and that remains deliberate — every write is internal. But
`documents.recent` and `documents.findingsFor` are unauthenticated public reads that return
every document in the deployment, and people forward leases with their name on them. That is
a decision for P6, made deliberately, not discovered in a demo.

The mail path has not run since this work changed `mail.attach`'s signature; all three gate
documents went through `mail:probe`, which runs a document by URL with no email involved.
P3 opens by forwarding one real email.

## 2026-09-04 (P3) — the reply, and a component that could not send

P3 opened by forwarding one real email, as the P2 entry said it would. It ended with a
cited reply in a Gmail inbox, and with the discovery that the first one never left the
building.

**A forwarded lease, end to end, 18.8 seconds.** The Livonia Housing Authority lease as a
219 KB attachment from Gmail to the AgentMail address, back as a reply carrying six answers
and one refusal. The threshold was predeclared in the plan at 45 seconds — under it the demo
runs live, over it the demo forwards early and cuts back — so **the demo runs live**. Every
finding matched the `mail:probe` run against the same document by URL, which is the control:
the attachment path through AgentMail's signed URL and the direct-scrape path produce the
same document.

The refusal landed in a real inbox, which is the thing this project exists to do:
*"How many days after move-out must the deposit be returned? Searched all 418 lines. This
document does not state it."* And no `watch` offer appeared, correctly — an attachment has
no URL, so there is nothing for P4 to re-fetch, and offering it would be a promise the
system cannot keep.

### The first forward looked green and sent nothing

`repliedAt` was stamped, `error` was null, the document and its findings were published, and
the sender's inbox stayed empty. **`@agentmail/convex` 0.1.0 cannot send on Convex 1.44.**
Its `agentmailFetch` reads `process.env.AGENTMAIL_API_KEY` inside the component sandbox, and
Convex 1.44 populates a component's environment only from what the parent binds through
`app.use(child, { env })`. The component declares no env vars, so there is nothing to bind
and the key is invisible to it.

Proven rather than argued, on one deployment in one second:

- `19:31:51` — `attachmentUrl()`, our code, `requireEnv("AGENTMAIL_API_KEY")`: fetched the
  PDF, 418 lines parsed.
- `19:31:51` — `agentmailFetch()`, the component, `process.env` with the same name:
  *"AGENTMAIL_API_KEY is not set on this Convex deployment."*

0.1.0 is the latest published version, `convex env set` has no component flag, and vendoring
the component to add one line to its config would mean owning roughly 400 lines of someone
else's code for the rest of the build. So the component keeps the half we could not do
better ourselves — Svix verification, `event_id` dedupe, the dispatch workpool, all working
and all untouched — and outbound became one HTTP POST of ours, reusing the component's own
exported `toSendPayload` so the wire format cannot drift from it. **Inbound was never
affected**, because the webhook secret is read by the client, on our side.

This is the 09-01 lesson with the sign reversed. Reaching for the component was right, and
it is still right for three of the four things it does; declining the fourth on evidence is
the same discipline as adopting the other three.

**`repliedAt` now means SENT.** It meant *enqueued* for exactly one day, and on that day it
recorded a reply for a message AgentMail never accepted. It is written by the send action
after the API returns, never by the mutation that queued it, and the proof is a gap: it used
to equal the document's creation timestamp to the millisecond because both were one
transaction, and it is now 580 ms later because that is a round trip.

### Three replies, and the one that says nothing went in first

`convex/reply.ts` builds text and HTML from pure functions, so the wording is checked by
`npm test` rather than by forwarding a document and squinting at Gmail. Three outcomes get a
reply: the published findings; a failed ingest; and mail carrying no document at all.

The failure path is **M1 from the readiness audit, brought forward from P6**. Every throw in
`readAndPublish` used to be silent to everyone — the thread row sat at `repliedAt: null`
forever, scheduled actions do not retry, and the sender waited on a reply that was never
coming. The sender now gets a plain apology naming nothing about the document, because we
did not read it; the reason goes on the row, where it cannot leak a signed URL into
somebody's inbox.

**The plan's mockup contained a claim the system cannot generate.** Its refusal read *"it
defers to Michigan statute without naming one"* — a clause written by hand for the artifact.
A `not_stated` finding stores a question key and a line count and nothing else, so
publishing that would be this product asserting something it did not read, which is the one
thing it exists not to do. The generated refusal claims only what the system did: searched N
lines, did not find it. A test guards the class rather than the sentence.

### H1 closed, and not the way the plan said

The plan's one-line fix for the public read surface was to filter both queries to
`url !== null`. The development database falsified it before it was written: a row titled
**`Fwd: please read this before I sign`** with a non-null url, because a mailed *link*
carries no attachment and the title falls back to the sender's subject line. The filter
would have kept the sender's own words on an unauthenticated board.

So the question the board is actually asking — did a person email this in, or did we seed it
— is stored rather than inferred. `mail:probe` sets `isPublic`, inbound mail does not, and it
is set once at insert so a stranger forwarding a URL already on the board cannot pull it off,
and a seeded document cannot go private mid-demo. `findingsFor` takes the same gate, because
`documentId` is client-supplied and a finding carries a verbatim quote. Verified from outside
the project: `documents.recent` returned five rows before and none after, and the real
forwarded lease landed with `isPublic: false`.

`Auth` still reads `none`, and that is still deliberate.

### The receipt became the clause, and the first attempt failed silently

The stored quote was a whole line, and reflow correctly joins a hard-wrapped PDF paragraph
into one — so the Livonia late-fee receipt ran **588 characters with the fee buried 300 in**,
behind a paragraph about third-party payments. Complete, and unreadable. The P2 gate could
not see this: it asked whether a quote *supports* its answer, never whether a person could
read it.

**First attempt: ask the model for character offsets.** Clean in principle, and on a real
gate run the whole line came back for every finding. Offsets require counting characters and
a model sees tokens. A contract that silently never fires is worse than no contract.

**Second: the model proposes the clause as text, and the document decides.** `excerpt`
publishes the proposal only if it is found verbatim inside the cited line, and publishes the
slice taken out of the line rather than the string the model sent — `lineAt`'s rule one level
down. An invented clause is not in the line and cannot be found in it, so fabrication stays
structurally impossible; a paraphrase, however true, is refused for the same reason. The
proposal is snapped outward to unit boundaries, so a bare *"$25.00"* publishes its whole
sentence and no arbitrary minimum length has to be invented.

That run shortened everything except the two findings on the one line carrying
`5<sup>th</sup>` and `<u>$25.00</u>` — a model copying a clause verbatim silently drops the
converter's markup, so the search failed on exactly the line whose receipt was worst.
Stripping moved from render time into `toLines`, before numbering, so the prompt, the
citation, the stored quote, the receipt and P4's re-check all read one substrate. It also
unblocked a reflow it had been suppressing, since a line ending `</u>` fails the
ends-mid-clause test.

Three more classes of converter noise followed, all found by reading real output rather than
fixtures: markdown links (keep the text, drop the href — AT&T's cancellation answer *is*
`att.com/howtocancel`), bare URLs (by then, an anchor with no readable text to keep — every
Summary of Benefits quote carried two mid-clause), HTML entities (`&#x27;` for an
apostrophe), and table pipes. The last one produced the deepest fix: a markdown row carries
no full stops between its cells, so snapping outward by sentence alone walked back across
every cell to the start of the row. **A cell boundary is as real a break as a full stop**,
and `unitStarts` now counts one. The safety property is unchanged and asserted directly —
`excerpt` only ever snaps outward from the model's proposal, so no boundary rule can cut away
the text that carries the answer.

Measured on real documents rather than fixtures:

```
Livonia L3a/L3b  588 -> 100      L4a  472 -> 121      L5  678 -> 234
SBC     U1a/U1b  ~250 -> 147     U2  ~290 -> 70       U4  ~700 -> 101
```

The Livonia late-fee receipt now reads exactly what the plan's mockup promised — *"Any
monthly rent payments made after the 5th day of each month will be subject to a $25.00 late
fee."* — generated rather than hand-written. **All 21 gate citations were reopened by hand
after the change and all 21 still hold.** AT&T's `T2b` relevance drift fixed itself along the
way: it cited OneConnect auto-billing and now cites *"See att.com/howtocancel for details on
how to cancel."*

### The universal checklist ran for the first time, and the refusals held

Every finding in the database carried an `L` or a `T` key. Both `notice` and `other` route to
`universal`, so the catch-all for whatever a stranger forwards had **never run once**.
Taxonomy, corpus categories and all three decision rules were fixed in `052978d`, a commit
that precedes the first fetch, because the retracted `② GO` in `docs/probe.md` was called on
codes invented after seeing results.

Three documents that are neither leases nor terms pages — a condo rulebook (693 lines), a
completed Summary of Benefits and Coverage (173), and a city employee handbook (606). All
three fetched first try and all three classified `other`, so none needed the declared
classifier exclusion.

`GOOD 9 · NARROW 6 · WRONG 0 · REFUSED-OK 7 · REFUSED-FALSE 0 · N/A 2`

**Rule ① did not fire.** Zero unsupported answers, so the grounding invariant holds on the
diffuse questions too — now **36 of 36** answered findings carried by their own quote across
six documents.

**Rule ② did not fire, and this is the result worth keeping.** Seven refusals, zero false,
each verified by searching the source PDF by hand rather than by trusting the extractor. This
is the first time refusals were checked **as a class** — the P2 gate could not, because there
is no citation to open, and it is the half of the product nothing else ships. The one most
likely to be false was not: a condo rulebook that never grants its own Board the power to
change its rules, with `revise`, `reserves the right`, `may adopt` and `changed` absent from
all 693 lines and every `amend` pointing at the externally recorded Declaration.

**Rule ③ fired: 40% narrow against a 33% threshold**, roughly twice the 19% on lease and ToS.
Predicted in the predeclaration and for the stated reason — *"What does this require you to
do?"* has no single sentence in a document that requires eleven things, so the model cites one
true requirement out of many. On the condo rulebook it picked the leasing-notification clause
out of a book covering pets, parking, noise, trash and architectural approval. Supported,
checkable, and not what a reader most needed.

`convex/questions.ts` forbids tuning a list to its own result, so this cannot be fixed by
editing the questions, and ③ is a downgrade rather than a stop precisely so the finding gets
published instead of optimised away. **The catch-all ships with its narrow-citation rate
stated**, here and in the submission.

### What P3 did not do

**None of this is on production.** `function-spec --prod` lists six functions — the P0 read
surface plus P1 and P2 — and no `mail:send`, so **production physically cannot reply**. The
board is empty, the AgentMail webhook still points at development, and every measurement
above was taken against `charming-kookabura-768`. That is the safe order and it is also the
open item: P3's exit test names the *production* address, and it is not met until a stranger's
forward is answered there.

The web receipt page is **deliberately deferred**. Designing the interface before the features
it displays are finished means designing it twice, so it moves to a later stage with the
landing page it shares a codebase with.

Two known defects left standing, both already in the readiness audit and neither worth fixing
before the watch exists. Attachment documents never dedupe, because `by_url` is skipped when
`url` is null — the same lease forwarded twice costs two Firecrawl parses and four model
calls. And `documents.recent` orders by `_creationTime` while a re-forward patches
`fetchedAt`, so a re-read document never resurfaces.

One thing to carry into P4. Stripping the markup unblocked reflow joins, and **line counts
moved**: Livonia 421 to 418, AT&T 2,059 to 2,007. Every line number recorded before today is
stale. That is exactly the hazard P4 was already designed against — *a reflow shift makes
every finding change at once* — arriving early and confirming that the re-locate has to
search for the stored quote before it trusts a stored index.

## 2026-09-04 (production) — the deploy, and what a stranger's mail client does to a link

Production runs P0-P3. `still-true@agentmail.to` is answered by
`impressive-marten-163`, and the first forward it took failed.

**The deploy itself was uneventful**, which is the least interesting part of the day.
PR #17 merged to `main`, `npx convex deploy` added one index and no schema surprises,
and the static bundle went up. Verified from outside the project rather than from the
CLI's success message: the public surface is still exactly two queries, `documents.recent`
and `documents.findingsFor`, and the ten functions behind them are internal. `mail:send`
now exists on production, which is the difference between a deployment that ingests and
one that can reply.

**The webhook could not be repointed, only replaced.** One AgentMail inbox, one webhook,
and `PATCH /v0/webhooks/{id}` returns 200 while changing nothing — the URL is not an
updatable field, which the docs confirm by omission and the webhook list confirmed by
still reading `charming-kookabura-768` afterwards. That is the 09-02 lesson again: the
success of the call you made is not evidence about the state you meant to change. So the
dev-pointed webhook was deleted and a `still-true-prod` one created against production,
with its new signing secret set on prod.

Development got its own front door in the same pass — `still-true-dev@agentmail.to`, its
own webhook at `charming-kookabura-768`, its own secret. Not tidiness: two webhooks on one
inbox deliver every forward twice, and two deployments that can both reply would send a
stranger two answers to one question. P5 needs a real inbound path to exercise the CC door,
and it now has one that cannot collide with the demo address.

**The board was seeded with the six gate documents** through `mail:probe --prod`, which
sets `isPublic`. Six documents, 34 answered findings, 13 refusals, and every answered
finding carried by its own quote — the grounding invariant re-checked on a second
deployment against fresh scrapes.

Two cells moved. Development answered 36 of the same 47; production answered 34, with AT&T
answering 7 where development answered 8 and one universal document answering one fewer.
Fresh scrapes and a model that is not deterministic. **Nothing moved in the dangerous
direction** — no cell went from a refusal to an unsupported answer, and no answer arrived
without a quote. PayPal also re-measured at 1,225 lines against development's 1,227, which
is the same reflow drift P4 already has to survive.

### The first inbound mail failed in four seconds

A forwarded link, sent from Gmail, came back as the apology rather than the answers. The
log named the reason without ambiguity:

```
A(mail:ingest) Uncaught Error: Firecrawl returned 498 chars for
https://www.google.com/url?q=https://www.spotify.com/us/legal/end-user-agreement/&source=gmail&ust=… — too short
```

**Gmail rewrites every link in a sent body to its own redirect wrapper.** What arrived in
the text part was Google's address, not the document's. Firecrawl scraped the redirect page,
got 498 characters, and the short-document guard written after probe v3 run 1 refused it —
correctly, on the wrong URL. The guard did its job; the address was wrong one step earlier.

The failure path behaved exactly as P3 built it, and this is the first time it ran for a
real stranger's message rather than a test: an apology naming nothing about a document we
never read, the reason on the row where it cannot leak, and a reply in the sender's inbox
four seconds after they sent it. M1 from the readiness audit is why that mail was not
silence.

The fix is `convex/link.ts` (PR #18): read the link out of the body, then unwrap it on the
hosts known to wrap and no others. A page may legitimately carry `?url=`, and
`google.com/search?q=` is not a wrapped document, so the inner value has to look like an
address before it is trusted. Outlook's safelinks is the same mechanism under a different
parameter and costs one map entry. Six tests, the first of which is the message that
actually failed.

### And then production answered

Same document, same mail client, after the deploy. **15 seconds**, 414 lines, six answers
each carrying its own quote and line number, and one refusal — *"Is your data shared with
third parties? Searched all 414 lines. This document does not state it."* Spotify's opt-out
came back at line 323 with the sentence that carries it. **P3's exit test named the
production address, and it is now met.**

The provenance gate held where it matters: the forwarded document did not appear on the
public board. `documents.recent` returned the same six seeded documents before and after.

### What is live and still not true

- **The reply offers a watch that does not exist.** Any document with a URL gets *"Reply
  `watch` and I'll tell you if any of this changes"*, and P4 is unbuilt, so a reply saying
  `watch` today gets the no-document apology. Deliberate when it was written and now
  pointed at real senders; it is either P4's deadline or a one-line suppression.
- `documents.recent` and `documents.findingsFor` are still unauthenticated public reads.
  The provenance gate keeps forwarded documents out of them; `Auth` still reads `none`.
- The two defects P3 left standing are now standing on production: attachment documents
  never dedupe, and a re-read document never resurfaces on the board.

## 2026-09-05 — P4, the watch, and two ways to be wrong about a change

The sentence in the project description — *"for documents that live at a URL it keeps
watching, and tells you when the specific thing you asked about changes"* — is backed by
code as of today. Getting there meant being wrong twice, both times in a way only a live
run could show.

**First, the offer was withdrawn.** Production spent a day telling every sender of a
url-backed document to reply `watch`, and answering that reply with the no-document
apology. One line, `watchable: false`, PR #20. It is back now, and reworded: the watch
takes no opt-in. *"I'll re-read this page daily and email you if any of the clauses above
stops saying what it says today. You don't need to do anything."* A person who forwards a
lease is asking what it requires of them; that it stopped requiring it is the same
question answered later, and making them reply a magic word to hear the answer is a
second thing to get wrong for no gain. The `threads` table is the subscription list,
which is what its schema comment has said since P1.

### The design decision, made from the 09-04 measurement

The obvious watch re-reads a document and diffs the answers. This project already had the
evidence that it cannot work: on 09-04 the same six documents read on two deployments
hours apart answered 36 of 47 cells on development and 34 on production, with nothing
about the documents changing. A watch that diffs answers mails people that their lease
moved because the model reworded a sentence.

So the question *did it change?* is never asked of the model. The model is only ever asked
*what does it say now?*, and only once something else has already said yes.

### Wrong the first time: the vendor's signal is consumable

The first design asked Firecrawl. `formats: ["markdown", {type: "changeTracking"}]`
returns `changeStatus: same | changed | new | removed`, computed from two texts rather
than two opinions, and the docs promised a free bonus: *"requests with changeTracking
bypass the index cache. The maxAge parameter is ignored."* That closed the 08-30 readiness
finding about `scrape()` serving two-day-old cached copies, at no cost.

It survived about ten minutes of real use. Two clauses on the fixture were edited — a
$50.00 late charge to $90.00, a sixty-day termination notice to ninety — the sweep ran,
and nothing was stamped. Calling Firecrawl by hand settled it:

```
markdown chars: 9846
has $90.00 : true
has $50.00 : false
changeStatus: "same"
previousScrapeAt: "2026-09-05T16:00:48.513Z"
```

The markdown was current. The verdict was `same`. And `previousScrapeAt` pointed at **our
own re-check ninety seconds earlier**.

`changeStatus` compares a scrape against the previous scrape of the same URL by the same
team, so **reading it spends it**. The sweep fetched, Firecrawl advanced its baseline to
the new text, something after the fetch failed, and from that moment every read compared
the new text against the new text. The change was gone permanently — and the workpool
retry, added specifically to make the watch reliable, is what destroyed the evidence.
Attempt two scrapes again and is told nothing moved.

A change signal that a retry annihilates cannot be the foundation of a watch.

So `documents.contentHash`: SHA-256 of the lines, on our row, compared inside the same
transaction that replaces the findings. A retry recomputes the same value and reaches the
same verdict. `changeTracking` is gone from the scrape and `maxAge: 0` closes the cache
finding on its own, which is what that flag should have been doing since 08-30.

### Wrong the second time: the page moving is not the clause moving

Even a correct "the document changed" does not say **which** finding changed, and the
fixture demonstrated the gap before the code was finished. Re-read after an edit that
touched only a disclosure paragraph, question U2 went from quoting *"a late charge of
Fifty and 00/100 Dollars ($50.00)"* at line 24 to `not_stated` — with that sentence still
sitting in the document, untouched. On a page that had genuinely changed elsewhere, that
drift would have mailed somebody that their late-fee clause was deleted while they could
open the page and read it.

So a second gate, deterministic and free: **a clause is reported as changed only once the
clause it used to quote is no longer in the document.** A string search over the text just
read. It kills both directions of the same failure — the model dropping a clause it found
last time, and the model citing a different true clause instead.

The `appeared` verdict was deleted rather than kept and quietly wrong. There is no old
quote to search for, so the gate cannot run on it, and "the document now answers a
question it did not answer before" is as likely to be this run finding what the last run
missed as a genuinely new term. Telling somebody a clause was added to their lease when it
was there all along is the same lie as telling them one was removed. Restoring it needs
the previous text, which this system deliberately does not store, or the added lines out
of a git-diff — the comment in `change.ts` says so.

### What ran, and what it reported

`watch:sweep` on development, against a fixture whose deposit-return window had moved from
thirty days to sixty and whose entry notice had moved from twenty-four hours to four:

```
Northfield residential lease (watch fixture)   94 lines | answered 7 | changed 2
City of Las Vegas Employee Handbook           606 lines | answered 8 | changed 0
Summary of Benefits and Coverage              173 lines | answered 4 | changed 0
Independence Place West Condominium Handbook  693 lines | answered 3 | changed 0

4 documents · 22 answered · 2 stamped changed · 0 answered without a quote
```

Both changes carried both receipts — the clause as it read, the clause as it reads, each
with its line. **Zero false positives.** The three documents seeded before `contentHash`
existed had no stored hash, so they were re-read in full and correctly reported nothing:
the "no previous reading counts as unchanged" direction working as the migration path it
was written to be. An unchanged page takes the early exit in twelve seconds with no model
call at all — `lastCheckedAt` advances, `fetchedAt` does not.

### The components, checked before the cron was written

- **`@convex-dev/workpool` 0.4.11 — adopted.** A sweep fans one cron tick into a Firecrawl
  scrape and two model calls per document, and `ctx.scheduler` gives a thrown action no
  retry at all. M1 exists for that reason, but M1's apology only covers documents somebody
  emailed about; a re-check has no thread and no sender, so **its failures were invisible
  by construction**. The re-check meets the component's own bar for retry: `attach`
  replaces a document's finding set outright, so running it twice publishes what running
  it once would. `maxParallelism: 2` is about Firecrawl and OpenAI, not about Convex.
- **`@convex-dev/crons` — rejected.** It exists for schedules registered at *runtime*.
  This is one line that never changes; built-in `cronJobs()` is the answer and the
  component would have been complexity bought for the look of it.
- **`@convex-dev/action-retrier` — rejected**, strictly subsumed by workpool.
- **`@convex-dev/workflow` — rejected for now.** It earns its journaling on many-step
  chains; this is one action, and workpool covers the retry need at less conceptual
  weight.
- **`@convex-dev/rate-limiter` 0.3.2 — a real gap, not yet closed.**
  `still-true@agentmail.to` is a public address with **no limit on anything**. Anyone can
  forward five hundred documents and drain the Firecrawl and OpenAI budget. Its own PR.
- **`aggregate`, `migrations`, `action-cache`, `resend`, `sharded-counter` — no job
  here.** `previousQuote` and `contentHash` are optional so nothing needs backfilling, the
  board is six rows so counting is free, and mail goes out through AgentMail by design.

Two things rode along with `npm install`: convex 1.44.0 to 1.45.0, inside the declared
`^1.44.0` range, and an eslint rule about top-of-hour crons, taken — the sweep runs at
11:17 UTC.

### Two mistakes of mine, recorded rather than smoothed over

**A production deploy nobody asked for.** `npx @convex-dev/static-hosting deploy
--skip-convex` was run expecting the development deployment. That subcommand always
targets production; `upload` is the one that defaults to dev and takes `--prod`. Prod's
backend was untouched — still ten functions, no `watch` — but its static bundle became the
branch build and `/watch-test/lease.html` went live there. Verified immediately after: the
board still returns its six documents, every `lastCheckedAt` null, so the new UI renders
nothing it does not have. No harm, and no consent asked for either. The rule was to
identify the target before running the command, and the CLI's default was not checked.

**The classifier is not stable on this fixture.** It read the document as `other` twice
and as `lease` twice, across four readings of near-identical text. The change detection
was unaffected — `diff` skips a question the previous reading never asked, which is
exactly the case a reclassification produces — but a document that answers L1 and L2 one
day and U1a and U2 the next is a real instability, and it is not measured anywhere.

### The exit test, met

A message was sent to `still-true-dev@agentmail.to` carrying the fixture link. Gmail
rewrote it to its redirect wrapper again — the second live confirmation of `link.ts` — and
the cited reply came back in **18 seconds**: six answers each under its own quote, one
refusal, and the new promise, *"I'll re-read this page daily and email you if any of the
clauses above stops saying what it says today. You don't need to do anything."*

Then two clauses moved: the deposit-return window from sixty days to one hundred and
twenty, and the late charge from $90.00 to $250.00. `watch:sweep`, and **2 minutes 17
seconds later a change notice arrived in the same thread, unprompted**:

```
Northfield residential lease (watch fixture) changed. 2 things I had quoted
for you no longer read the same way.

How many days after move-out must the deposit be returned?

  WAS: "Within sixty (60) days after the termination of this Lease…"
  line 33 · The landlord must return the deposit within 60 days…
  NOW: "Within one hundred twenty (120) days after the termination…"
  line 33 · The deposit must be returned within 120 days…

What is the late fee amount?

  WAS: "shall pay a late charge of Ninety and 00/100 Dollars ($90.00)…"
  line 21 · The late fee is $90.
  NOW: "shall pay a late charge of Two Hundred Fifty and 00/100 Dollars ($250.00)…"
  line 21 · The late fee is $250.00.

I compared the text of the page against the copy I read last time. This is
not a judgment that something got worse — it is that these words are not the
words that were there before.
```

`notify()` ran, and the guard it exists for held: the notice landed in the thread that had
already been answered, which is exactly the row `reply()` refuses to touch.

**It shipped one bug, in the first change notice this system ever sent** — *"2 things I had
quoted for you no longer **reads** the same way."* The subject is plural and the verb was
not. Fixed, with a test that pins both forms. A pure function tested against the vocabulary
it must not use, and the thing that got through was subject-verb agreement.

### Still not true
- Production runs P0–P3 and none of this. The `watch` over-promise is fixed on `main` and
  **not yet deployed**, so production is still offering it today.
- The rate limit is still absent, and the public reads are still unauthenticated.


## 2026-09-05 (later) — the page a judge would click

The landing page had been live for a day and nobody had opened it. Opening it
found four things, three of which were bugs rather than taste.

**It never said where to send the mail.** A landing page for an email-first
product with no address anywhere on it. That is not polish; it is a missing
function, and it dead-ended the call to action of every post this project has
drafted.

**It printed database keys.** A reader was shown `U5b` and told nothing at all.
The reply has always printed the question — `questionFor` lived in `reply.ts`
— so the fix was to move that function to `questions.ts`, where the wording
already lives, and read it from both places.

**It printed the same quote twice.** `U5a` and `U5b` both cite line 30 of the
Las Vegas handbook, so that sentence rendered back to back. This is exactly the
defect P3 fixed for the email with `groupByLine` — *"printing its 600-character
quote twice in a row reads as a bug"* — and the board never got the fix. Two
questions, two answers, one receipt now.

**The refusal rendered as a key list, below the fold.** `L1, T2A not stated` is
a stack trace, not a differentiator. Each card now leads with what the document
never says, in the question's own words and in the same sentence the reply
sends. The board is deliberately ordered the opposite way from the email: a
person who forwarded a lease wants the answers first, and a stranger who
arrived at the board has not asked anything yet.

Deployed to production. The board now reads **6 public documents · 5,124 lines
read**, and the frame that makes the case for the whole project is a completed
Summary of Benefits and Coverage — a real health plan, 173 lines:

```
WHAT IT NEVER SAYS

How do you end it?
  Searched all 173 lines. This document does not state it.
What notice must you give to end it?
  Searched all 173 lines. This document does not state it.
Can the other party change these terms?
  Searched all 173 lines. This document does not state it.
What notice do you get before a change takes effect?
  Searched all 173 lines. This document does not state it.
```

Four questions a person would actually ask of their own health coverage, and
the document answers none of them. That is the product in one screenshot, and
it existed on the board for a day rendered as `U3a, U3b, U5a, U5b not stated`.

**The lesson, again, and this time about our own artifact.** Every claim on
this page is checked against the deployment rather than the branch. Nobody had
applied that rule to the page itself — it was deployed, verified as HTTP 200
with the right `<title>`, and never once looked at. *A claim about what a
visitor sees is a claim about a rendering, and only looking at it settles that.*

One thing found and not fixed: `agentmail/callbackPool:complete` took 8 OCC
write conflicts on the component's own `runStatus` table during the day's mail
activity. All retried, none failed permanently, and it is inside the
component's workpool rather than our code. Recorded, not chased.

## 2026-09-05 (audit) — the second readiness pass, and flags carried into P5

The first launch-readiness pass, on 09-03, scored **58/100** and every finding
was deliberately parked. This one re-ran it against the code and both
deployments and scored **67/100**:

```
 58  prior
+15  H1 closed  (isPublic provenance gate)
 +5  M1 closed  (ingest catches → apology + threads.error)
 −5  M3 new     watch re-check failure is silent
 −5  M4 new     no unsubscribe (previously noted, now scored)
 −1  L5 new     attach notifies at most 100 threads
───
 67
```

**Two findings the deployments settled that reading the code could not.**
Development holds two identical Livonia attachment rows — 418 lines each,
sixteen minutes apart — which is M2 (attachments never dedupe, because `attach`
skips the `by_url` lookup when `url === null`) confirmed rather than argued.
And production's `contentHash` for all five shared board documents is byte-
identical to development's, which is the first direct evidence that the
fingerprint the whole watch rests on is deterministic across deployments.

**H1 is closed on production, checked rather than assumed.** All five board
rows carry `isPublic: true`, `findingsFor` gates the client-supplied id, and the
production `functionSpec` still matches source: fifteen functions, two public,
both read-only queries. The habit from the day before — *a claim about what a
visitor sees is a claim about a rendering* — applied here as reading the actual
prod query rather than trusting the branch.

**The new one that matters is M3, and it is M1 again.** A `watch.recheck` that
throws retries three times in the workpool and then writes nothing anywhere:
there is no thread, so there is no `threads.error`, and nothing lands on the
document. The only signal left is a `lastCheckedAt` that quietly stops
advancing, while the reply goes on promising a daily re-read. The code comment
argues a failed function in the logs is enough. It is not, and this pass proved
why: production log reads are refused by the read-only selector and development
retained zero entries, so "no failures observed" is absence of evidence. The
same shape that was fixed for the sender in P3 is open again for the watcher.

**Everything is parked, on purpose.** P5 is the CC reply, not the punch list.
The flags now live in [`docs/READINESS.md`](docs/READINESS.md) with severities,
loci, a fix order (H2 → M3 → M4 → the rest), the closed findings marked so they
are not re-flagged, and the deliberate simplifications marked so they are not
"fixed" unasked. `README.md`, `CLAUDE.md` and `AGENTS.md` point at it.

### Still not true

Nobody can leave the watch. A re-check that fails tells no one. Both are
written down and neither is fixed.

*(The third sentence here read "the inbox has no rate limit and the daily cron
re-scrapes every url-backed document forever." That stopped being true later the
same day — see below.)*

## 2026-09-05, later — H2 closed: the inbox now has a bound

**Two gates, not one, and the reason is the reason P4 made this urgent.** A
token bucket keyed on `fromEmail` was the obvious fix and it is only half of
one. A limiter bounds a *rate*; the charge P4 introduced is a *standing* one,
because a url-backed document is re-scraped every day for as long as it exists.
A sender adding one URL a week never trips a limiter and still walks the daily
bill up without limit. So the burst gate (10/hour, burst 5) is joined by a cap
of 25 distinct documents per address, counted off `threads.by_fromEmail`.

**The refusal is answered, not dropped.** Both gates run after the thread row
is inserted and before the scheduler: the message is recorded, the sender is
told, and no vendor call happens. The reply is its own body rather than the
existing `failureBody`, and that distinction is the point — `failureBody` says
*I could not read your document*, which here would be false. We could have and
chose not to. Telling somebody a decision was a malfunction is the same species
of claim this project exists not to make.

**`@convex-dev/rate-limiter` rather than a counter column**, checked against the
installed package's own types rather than remembered: `limit()` is transactional
with the mutation that gates on it, so a burst of simultaneous webhooks cannot
each read the same stale count and all pass. A hand-rolled counter gets that
wrong exactly when it matters.

**What is verified and what is not.** `tsc -b` clean, 66/66 tests, and the two
new tests pin the thing worth pinning: that the cap refusal and the rate refusal
stay distinguishable from each other and from a failure, and that a retry delay
never rounds down to "now" and walks the sender back into the limit. The live
refusal has not been exercised against a real inbox. Saying so here is cheaper
than discovering it in an audit.

## 2026-09-05, night — it went public, and the first post advertised GitHub

**The vibeapps submission is filed:** <https://vibeapps.dev/s/still-true>. Then
the LinkedIn post went out, and the long version was too long — the short
variant is what actually ran. Both are true; only one gets read.

**The post's card showed a repository avatar.** On a post whose entire argument
is a screenshot of the board. The reflex was to blame the post, and the post was
innocent: `grep -ci "og:|twitter:" index.html` returned **0**. With nothing here
to scrape, LinkedIn built its card from the one link in the message that did
carry metadata, which was GitHub. A page with no Open Graph tags does not get a
plain card — it *loses* the card to whatever else you linked.

That is the same shape as the rest of this log's mistakes: the visible symptom
was in the artifact, the cause was a missing declaration one layer down, and
nothing anywhere reported an error. LinkedIn also rewrites every bare URL to
`lnkd.in`, so two unlabelled links render as two identical opaque shortlinks —
unavoidable, but a label in front of each fixes what the reader sees.

**The image is a screenshot taken tonight, not a crop from the folder.** Same
habit as everywhere else here: the artifact is a current reading rather than a
remembered one. The card now shows the name, the pitch, the forward-to address
and *6 public documents · 5,124 lines read*.

**Verified live rather than assumed:** ten og/twitter tags served from
production, `og.jpg` returns `HTTP 200 image/jpeg 60,438 bytes`, and the
document the scraper fetches went from 519 to 2,591 bytes. `npm run gate` 5/5
after the deploy.

## 2026-09-05, later still — `npm run gate`

**The exit criteria were prose, and prose is what got retracted twice.** P0 was
reported deployed when it was not; a webhook was reported silent while its logs
sat sixteen minutes old. Neither was carelessness — both were a judgement call
standing in for a measurement. So five claims this repository makes about itself
are now a script that exits non-zero: prod exposes only read-only queries, the
site serves the app document, the board returns nothing private, every published
answer carries a non-empty quote and a real line number, and the watch has swept
inside 48 hours.

**Read-only and free**, so it can run on a loop: no mutation, no scrape, no model
call, no admin key — the two public queries answer over the HTTP API exactly as
they would to a stranger, which is the point. The sweep threshold is 48h rather
than 24h and the reason is written down beside it: the cron fires daily, so a
run landing 23 hours after the last sweep would fail a 24-hour threshold with
nothing wrong. Two cycles missed is a signal; one boundary crossing is a clock.

**A gate that has never failed is not evidence.** It was run against production
with the thresholds deliberately violated, and returned exit 1 naming both
broken checks — so the green run above means something. First real run: 5/5.

**And it immediately earned itself.** The README said the board carries 34
answered findings and 13 refusals. Production says 35 and 12: a refusal became an
answer when a re-read found the clause, which is the watch doing exactly its job,
and the README had gone quietly stale about it. Nobody would have noticed by
reading. That is the entire argument for the script, made by the script, eleven
minutes after it existed.

## 2026-09-06 — the pitch was advertising a feature that was never built

**The first paragraph of the README claimed the CC reply.** Fifty lines later the
Status section said `P5 — the CC reply: not built.` Both sentences had been in the
file since the repository was made public, and the same claim sat in the
`What it does` line of this log, four lines above a line reading **The CC reply
(P5) is not built.** Nobody had to dig for the contradiction; it was the first
paragraph a judge reads and the header of the build log.

**This is the exact failure the project exists to argue against.** The whole
premise is that a claim should stop being served the moment it stops being true —
and the front door was serving one that was never true, on a repository whose
grounding guarantee makes fabrication structurally unrepresentable one file over.
A guarantee in `extract.ts` does not extend to the prose around it. Only reading
the prose does.

**Cut, not deferred.** The sentence is gone from both places rather than softened
to "coming soon". P5 may well ship this week, at which point it goes back in with
a production run behind it — but a sentence that is false today does not get to
stay because it might be true on Friday. That reasoning is how the README spent
three days claiming the watch was not built.

**A second stale line went with it.** The log header still said 34 answered
findings and 13 refusals — the count `npm run gate` caught drifting the day it was
written, because a refusal became an answer when a re-read found the clause. The
number is not restated here. The header now points at the gate, which reads it
from production, for the same reason the README already does.

**Not touched: `docs/probe-v3.md`.** It carries the same sentence and it stays,
because that file is predeclared and was committed before the sweep ran. It
records what the product was intended to be on 2026-09-02, and rewriting a
predeclaration to match the outcome is the failure it was written to prevent.

## 2026-09-06 — the cron fired on its own, and the board moved without telling anyone

**The schedule works, and the evidence is rows rather than logs.** All six
documents carry a `lastCheckedAt` between 11:17:09 and 11:19:16 UTC — the cron's
scheduled minute, with nobody running `watch:sweep`. Prod log reads are still
refused by the read-only selector, so this is the first time the schedule has
been proven from outside: three timestamps on a public query, no credentials.

**Three documents had moved and nobody was emailed, which is the design.**
`verifiedAt` says the Summary of Benefits, the Independence Place handbook and
the PayPal user agreement were re-extracted; the Las Vegas handbook, the Livonia
lease and the AT&T agreement stopped before the model with an unchanged hash.
So three pages moved their text overnight and **not one clause any finding had
quoted was gone** — the second gate held, and the first unattended sweep sent
zero change notices. A watch that mails nothing on a day when three of six
documents changed is the whole argument for hashing the text instead of diffing
two model runs.

**The counts moved anyway: 35 answered / 12 refusals became 37 / 10.** Two
refusals became answers on the re-extracted documents. Whether those clauses
were added or the model simply found them this time is not determinable from
here — 2 of 47 cells is exactly the disagreement two deployments produced over
these same documents on 09-04 — and the system claims neither. A clause that
merely appears is never reported as a change, because there is no previous quote
to put beside it. This is the second time in two days the board's own numbers
outran the sentence in the README, and the second time the gate is what caught
it.

**P5 turned out to be mostly routed already.** `mail.received` tells a CC from a
forward by which header carries the inbox address (`mail.ts:289`), `threads.mode`
stores it, and both `reply` and `notify` pass `replyAll` to AgentMail's
`reply-all` endpoint. What is missing is the case that makes CC worth having:
on a real thread the document is attached to an earlier message, and `received`
only reads the message that CC'd us — the `thread` argument it already accepts
is ignored. No test covers the path.

**So the fix order changed: M4 before M3.** Replying to a CC replies to everyone
on the thread, and the threads table is the subscription list, so P5 multiplies
an inbox that has no way out. M3 still lands before the next audit; it is just
not the flag P5 makes worse.

## 2026-09-07 — three shell-page detectors died, and the watch got a door out

**Two more links went into production on 09-06 and one of them broke the
differentiator.** `facebook.com/privacy/policy` came back 1,182 lines and
answered 2 of 8 — the other six read *"Searched all 1,182 lines. This document
does not state it."* Every word of that is true and the whole of it is
misleading: Meta's page is a summary shell. Line 415 is
`Delete your information or account`, 416 is blank, 417 moves on. The body of
every section lives one link deeper, and `stripMarkup` deletes hrefs.

**Three detectors were predeclared, measured on 24 documents, and all three are
dead.** The false-positive budget was predeclared at zero — refusing to read
somebody's real lease is the worst thing this can do — so a moved threshold was
never a rescue.

| detector | separated the shells? | what else it caught |
| --- | --- | --- |
| `%chars in lines ≥120 < 60` | yes, 9–50 | DOL COBRA model notice **12**, HUD-5380 **28** |
| `"learn more" rate > 1%` | **no** — `meta.com/legal` and `apple.com/legal` score **0** | Microsoft's real privacy statement **7.01** |
| refusal rate | Meta 75% | CMS Summary of Benefits **63%**, Verizon 50% |

The second one is the one to remember. It was going to be added *for safety*, as
the partner that widened a thin margin, and it fires hardest on a genuine
Microsoft policy while scoring zero on the two purest link-lists in the sample.
It was measuring a Meta house style, not a property of shells.

**What survives needs no detector.** Pandora line 144 says you may cancel "by
following the instructions outlined in this Listener Support Help Article" — and
the href that named the article was deleted before the model ever saw the line.
`T2b` came back `not_stated`. That is a false refusal with a proven cause.
`lines.ts` argues hrefs are redundant because AT&T's `att.com/howtocancel` says
it twice; true there, backwards when the link text is `this Help Article`.

**Measured before proposing it: keeping hrefs breaks 6 of 54 published findings.**
Replaying every prod finding through the real `change.stillSays` under a modified
parser reports spotify T2b, sbc U4/U2/U1a and paypal T3b/T2b as `gone` — six
emails saying a clause was deleted about documents that never moved. Control run
with the current parser: 0 of 54. So the parser change ships **with a corpus
re-read in the same deploy**, before the next 11:17 sweep. That is the 09-04
"a reflow shifts every line at once" hazard, arriving a third time.

**Not a bug, and worth writing down:** `verizon.com/support/website-use-legal/`
contains zero occurrences of "arbitrat" in 555 lines. Those four refusals are
correct. That was the website terms, not the wireless customer agreement — the
09-03 AT&T landing-page trap, sender-side this time.

### M4 closed — the watch has a way out

**STOP, or UNSUBSCRIBE, as the first non-empty line of a reply.** Two scopes,
because the person who wants out is not always the person the row is keyed on:
it stops the thread it arrived on — a cc'd reader was enrolled by somebody
else's forward — and every thread from its sender. Nothing carries to a future
thread, which is correct: a new thread exists only because they mailed a new
document in, and that reply names STOP again.

Checked **ahead of** the no-document branch, or a bare STOP is answered "I did
not find a document in that message"; and ahead of both spend gates, because
refusing an unsubscribe on the grounds that the sender has been mailing too much
is backwards. A STOP costs no scrape and no model call.

**Exit test, on development, observed rather than reasoned about.** A STOP from
the sender stopped 6 threads and the generated body said *"about 5 documents"* —
distinct documents, deduped, read out of the scheduler's own arguments. An
`unsubscribe` from a **cc'd stranger** on a thread started by somebody else
stopped both of that thread's rows and said *"1 document"*. Then the watch
fixture's late fee was moved $250 → $400, the sweep detected it and stamped
`L3a` changed at 16:37:44 — **and scheduled no mail at all.** The same thread,
the same fixture and the same detection produced a change notice on 09-05; the
only difference is `stopped: true`. The fan-out was entered and the skip fired.

The WATCH paragraph no longer ends "You don't need to do anything." That
sentence was the whole of M4.

### H3 closed — the address survives when the label does not say it

**One rule, no keyword list: keep the href unless the label already contains
it**, compared on alphanumerics. That is the AT&T argument generalised —
`[att.com/howtocancel](https://www.att.com/howtocancel)` is the same string
twice — rather than a fourth guess about which labels sound uninformative. The
bare-url pass moved to the front behind a `(?<!\]\()` lookbehind, or it would
have deleted the addresses the link pass had just decided to keep.

**The receipt this produced is the argument for the whole change.** Spotify's
`T2b` was already an *answered* finding, and it read:

> "You may cancel your Paid Subscription at any time by logging into your
> Spotify account and following the prompts on the Account page or by clicking
> **here** and following the instructions."

A cancellation instruction with the "here" deleted. It now carries
`support.spotify.com/article/cancel-premium/`. PayPal's `T2b` gained the Help
Center address the same way. Neither was a refusal — they were answers that
could not be acted on, which is a quieter failure than a refusal and was not on
any flag list.

**`documents.parserVersion` is the part worth stealing.** `contentHash` answers
"did the document move?" and cannot tell that from "did the parser move" — so a
parser change makes every stored quote stop matching at once. Replaying all 54
published prod findings through the real `change.stillSays` under the new parser
reported **6 as `gone`**. So `attach` re-baselines instead of diffing when a
row's version is not current, and `checked` stamps the version on the early exit
so a document this change did not touch (every PDF in the corpus) cannot keep a
stale version and swallow a genuine change months later.

**Verified on development: a sweep that re-extracted five documents under a
different parser produced 0 new `changedAt` stamps across 76 findings**, and
stamped all 8 watchable rows to version 2 — three of them through the early exit
without a model call, because their lines hashed identically. The three
attachment-backed rows stay at version 1, correctly: no url, never re-checked,
never diffed.

The hazard this retires had arrived three times (the 09-04 markup strip, the
09-04 reflow, and this). There is now no deploy ordering to get right, which
matters more than the parser fix did: the ordering was the part a person had to
remember at the exact moment they were least likely to.

### M3 closed — a failed re-check now says so where somebody reads it

`recheck` catches, records `documents.watchError`, and **rethrows**. The
rethrow is the point: the workpool still retries with backoff and the old
findings still stay untouched until a complete new reading replaces them, so
the visibility is not bought by swallowing the failure. The file used to argue
that a failed function in the logs was enough — `ingest` catches because a
person is waiting on a reply, a re-check has nobody waiting. That was true about
who is waiting and wrong about who can see, because prod log reads are refused
by the read-only MCP selector and dev retains zero failure entries.

**The field is deliberately off the public surface.** `documents.recent` answers
the open internet with whole rows, which is a habit worth naming — every field
added to `documents` is published by default, and the one time that went
unnoticed is why `isPublic` exists. `watchError` is a vendor's error body, so
`documents.ts` omits it from the validator and drops it from the rows.

**Which leaves the question of who ever reads it, and the answer is the gate.**
A sixth check reads the table with the runner's own credentials, so it covers
**private** documents too — 10 rows on production, not the 6 on the board. A
stranger's forwarded link failing every night is precisely the case the board
cannot show and the likeliest to be quietly broken.

**Verified on development in both directions, which is the half that is easy to
skip.** The fixture was replaced with a 142-byte stub; the sweep recorded
`Firecrawl returned 58 chars … too short to be the document` and left
`lastCheckedAt` frozen at 16:55 — the exact symptom the flag described, now with
a reason attached. The real fixture was restored and the next sweep cleared the
field and advanced the stamp to 17:11. While a PUBLIC document was carrying an
error, `documents:recent` returned 11 keys and `watchError` was not one of them.

Readiness is **92/100**. M2 is the only medium left and it is cheap: dedupe
attachment documents on the `contentHash` that is already computed.

### P5 — the CC reply was mostly already built, and its stated gap cannot exist

**What was actually missing was one line, and it was not a feature.** Being cc'd
on a thread already worked: `received` tells a cc from a forward by which header
carries the inbox address, `documentUrl` already scanned the whole body — so a
link sitting behind a `>` in the quoted original was always found — and `reply`
already passed `replyAll` through. Verified on development with a cc'd message
whose only link was in the quoted text: read, answered with the cited findings,
sent `reply-all`.

**The gap the README named cannot be built.** It said the case that makes cc
worth doing is "the document is attached to an earlier message". A message sent
before this address was cc'd was never delivered to this inbox, so AgentMail
does not have it and no endpoint can produce it. Its `GET /threads/{id}` does
return a `messages[]` with per-message `attachments`, so the mechanism looks
available right up until you ask what is in it — and retention makes the point
twice over: AgentMail holds **1** thread for the development inbox while our own
`threads` table references **12**. A feature built on that would have been a
lookback that finds nothing, forever, and reported as shipped.

**The real defect was the opposite of a missing feature.** `reply` passed
`replyAll: thread.mode === "cc"` for every body it sent, so *every apology went
to the whole thread*. "I did not find a document in that message", replied to a
landlord, a tenant and a broker, is a stranger interrupting a negotiation to
announce its own failure — and after M4 the people who never wrote here would
have had to say STOP to mail they never asked for.

So `reply` now takes an audience and **defaults to the sender**. The answer opts
into the thread explicitly, because being read in front of everyone arguing
about the document is the whole point; the change notice keeps the thread too,
and the asymmetry is deliberate — a notice only ever follows an answer those
people already received. Apologies, rate-limit replies, the M1 dead letter and
the M4 unsubscribe confirmation all go to whoever wrote.

Measured on development, same cc'd thread shape both times: the cited answer
sent `replyAll: true`, the no-document reply sent `replyAll: false`.

**P5 closes the last unbuilt sentence in the project description.** It also
retires a sentence that had been on the roadmap for days describing work that
was never possible, which is the more useful half.

## 2026-09-08 — the first round trip anybody can read, and two flags it found

Two audit passes had produced good findings and zero receipts. This is the
receipt: one document forwarded from a real address to the live inbox, the reply
captured verbatim, and the guarantee checked the way a hostile reader would check
it. Predeclared in [`docs/round-trip.md`](docs/round-trip.md) and **committed at
`f8f995a` before the mail was sent** — no finding on the target document had been
read when it was written. Transcript in
[`docs/transcript-sbc.md`](docs/transcript-sbc.md).

**23 seconds**, Gmail send to reply received; 21.0 s of it server side. Four
answered, four refused, on the CMS Summary of Benefits.

### What held

- **All three published quotes appear verbatim in the source PDF.** Fetched
  independently, converted with `pdftotext`, searched. T1 holds.
- **All four refusals are honest.** Sixteen search terms for termination,
  cancellation, amendment and notice. The document's only near-hit tells you
  where to go *after* coverage ends. Nothing was refused that the document
  states.
- **The Gmail link wrapper was unwrapped.** The body that arrived carried
  `google.com/url?q=…&source=gmail` — the exact rewrite that killed production's
  first inbound mail on 09-04. First time `link.ts`'s fix has met a real Gmail
  send since it landed.
- **Both change gates fired, on production, unattended.** The parse moved
  (171 → 174 lines), so the hash moved, so it re-extracted — and every clause any
  finding had quoted was still there, so `changedAt` stayed null on all four and
  **nobody was emailed**. One thread exists on that document and it is mine, so
  P10 is confirmed rather than assumed.
- `groupByLine` printed the shared line 11 receipt once under two answers.
- `npm run gate` 6/6 before and after.

### P7 was wrong, and being wrong about it is the finding

I predicted the `answer` field — model prose, guarded only by the prompt — would
out-run its quote. It did not. Every answer is supported by the line it cites.

What actually happens is narrower and worse for a reader. Firecrawl parses this
SBC as a **markdown table** (`contextBefore` on the `$500` finding is
`"--- | --- | ---"`), so a cited line is a whole row and `excerpt` publishes the
one cell carrying the clause. The receipt therefore reads:

```
The overall deductible is $500 for an individual or $1,000 for a family.
  "$500 / individual or $1,000 / family"
  line 5
```

The word *deductible* is on the cited line — in the question cell of the same
row — and `excerpt` trimmed it off. Same on line 11, where the row is
`Do you need a referral to see a specialist? | Yes. | This plan will pay…` and
only the third cell is published, cutting out the "Yes." that licenses *"You
must obtain a referral."*

Nothing is fabricated and no answer out-runs its line. But `excerpt`, added on
09-04 so a 588-character receipt would be readable, **can remove the part of the
line that makes the answer checkable**. Three of four answers here are supported
by their line and under-supported by their published quote. Logged as **M5**.

### H4 — the spend gates and the unsubscribe are keyed on a string the sender controls

The thread row stores `fromEmail` as `"Randall LaPoint, Jr." <rplapointjr@gmail.com>`
— the raw `From` header, display name included. `mail.ts:367` takes it as-is, and
three things key on that exact string: the rate limiter (`limit(ctx, "ingest",
{ key: fromEmail })`), the 25-document cap's `by_fromEmail` read, and `stopFor`'s
"every other thread from your address".

So changing a display name in Gmail's settings mints a fresh burst bucket and a
fresh 25-document allowance. That is H2 — *the* flag about unbounded recurring
spend on a publicly listed inbox — defeated by editing a preference.

**The unsubscribe half is worse, because it fails by accident rather than by
attack.** M4 promises "this thread, and every other one I have with you." That
scope is a string match, and the same person mailing from their phone and their
laptop is two strings. A reader replies STOP, is told the number of documents it
covers, and keeps getting change notices on the threads whose header differs.
M4 was closed *because* P5 enrolled people who never wrote in; this is the same
hole one layer down. Logged as **H4**, high, and not fixed today.

### Candidate: the line count moved on a static PDF with no parser change

09-05 recorded 173 lines under parser v1. The board read 171 after H3 bumped it
to v2. This run read **174**, same parser version, 6.5 hours after the cron's
sweep, on a CMS sample PDF that has no reason to change. Either that file moved
or Firecrawl's parse of it is not deterministic — and if it is the second, this
document re-extracts every night for nothing, which is the PayPal hash-churn
candidate reappearing on a *static* document, where it is a much stronger signal.
Two probes ten minutes apart settle it. Not scored on one data point.

### Where the predeclaration and the result diverged

| Predicted | Actual |
|---|---|
| P1 4 answered / 4 refused | **Held.** Recalled from 09-05, so nearly free |
| P2 refusals are U3a U3b U5a U5b | **Held**, and each verified honest against the source |
| P3 U2 answered, most likely cell | **Held** |
| P4 U1a/U1b/U4 are the fragile cells | **Untested** — no divergence for them to explain |
| P5 round trip 30–90 s | **Beat it. 23 s** |
| P6 line count 171 | **Wrong. 174**, and the board agrees now because this read patched it |
| P7 answer out-runs its quote | **Wrong, and productively.** The line licenses every answer; the *excerpt* does not. M5 |
| P8 quotes verbatim in source | **Held, 3 of 3** |
| P9 WATCH + STOP present | **Held** |
| P10 no change notice to a third party | **Held**, confirmed against the threads table |
| P11 a stranger can check the sentence, not the index | **Held**, and it is a landing-page finding |

Seven held, two wrong, one free, one untested. **A predeclaration that mostly
came true is still a receipt** — and the two it got wrong are the only two
findings in this entry worth anything.

### What would keep this transcript off the landing page

1. **The reply opens `I read Fwd: SBC for the plan we're looking at — 174 lines.`**
   The title is the sender's subject, not the document's name; the board shows
   "Summary of Benefits and Coverage" for the same row. Fine in an inbox, weak as
   the first line above the fold.
2. **M5.** The strongest-looking receipt on the page would be the deductible one,
   and it is the one a hostile reader can most easily call made up.
3. **P11.** The line number is the most authoritative thing in the reply and the
   only part nobody outside this project can verify. The page has to say so
   rather than let it imply more than it proves.

None of the three is fixed here. `crons.cron`, the README's "the model never
writes the answer text", and the `url === null` gate check are also untouched —
this branch is the receipt, and the fixes are a different concern.

## 2026-09-08 (later) — H4 closed: a sender is a mailbox, not a display name

Found by sending a document, not by reading the code. That is the second time
this week and it is the part worth keeping.

**The flag.** `threads.fromEmail` stored the raw `From` header. The round trip
earlier today put `"Randall LaPoint, Jr." <rplapointjr@gmail.com>` in the table,
and three things key on that string: the burst limiter, the 25-document standing
cap, and `stopFor`'s promise that a STOP covers "every other thread from your
address". So a sender's identity was a string the sender formats — editing a
display name minted fresh quota, which defeats H2 by changing a preference, and
one person's two mail clients were two people whose STOP half worked.

### Asked first whether anything upstream already knew

`@agentmail/convex` 0.1.0's own `inboundMessages` schema declares `from: string`,
and the event carries `message` as `v.any()` — AgentMail's JSON passed straight
through. There is no structured sender address anywhere to prefer over parsing
the header, so the header is ours. Worth checking before writing a parser rather
than after.

### A grammar, not a shape

The cheap rule is "take what is inside the last angle brackets". It survives the
quoted comma in our own production row, and then loses to this:

```
Name <a@x.com> (note <b@evil.com>)
```

A valid header from `a@x.com` that the cheap rule reads as `b@evil.com`. A header
is a grammar, and the thing keying an unsubscribe should not be decided by which
bracket came last. `email-addresses` implements RFC 5322, has no dependencies and
is one file of plain JavaScript, so the V8 bundle barely notices it.

Two places it refuses instead of guessing, both because of what this key gates:

- **A header naming two mailboxes returns null.** `From: victim@x, attacker@y` is
  a header an attacker can write, and taking the first would charge the victim's
  quota and let the attacker's STOP silence the victim's threads.
- **A group parses successfully with no address.** `undisclosed-recipients:;`
  comes back as one node whose `address` is `undefined`, so the type is checked
  rather than the truthiness.

Unparseable headers fall back to the raw string, because dropping real mail on a
grammar edge case is worse than one unidentifiable sender keeping its own bucket
— and the gate check below makes that fallback loud instead of silent.

### The `+tag` decision, made rather than defaulted

`user+lease@gmail.com` and `user@gmail.com` reach one Gmail mailbox and are **not**
merged. The reason is that one key gates two things whose failure modes point
opposite ways. For the spend gates merging is strictly better — same person. For
STOP it is a risk taken with a stranger's mail: RFC 5321 §2.3.11 makes the local
part opaque to everyone but the destination host, plenty of hosts treat `+` as an
ordinary character, and stripping it can silence someone who never wrote here.

`schema.ts` had already settled which way that asymmetry resolves, for this exact
flag: *"the safe direction here is the one that keeps answering, since the flag
suppresses mail rather than authorising it."* Stripping suppresses more. So it is
not stripped, the residual cost is stated in `sender.ts` rather than waved at, and
the upgrade path is a per-provider fact lookup — not a fourth heuristic after the
three that died on 09-07.

### The check was observed red before it was observed green

A seventh gate check asserts that every stored `fromEmail` is a bare address. It
deliberately does **not** re-run `senderAddress`: asking the parser whether the
parser was right proves nothing, so it asserts the shape independently — one `@`,
no brackets, no whitespace, no comma, already lowercased.

Run against production before the backfill it failed, naming all six rows:

```
FAIL  every sender identity is a bare address
      6 of 6 threads carry a sender that is not a bare address:
        "\"Randall LaPoint, Jr.\" <rplapointjr@gmail.com>"
```

That is the half people skip. A check that has only ever been seen passing is
indistinguishable from a check that cannot fail.

### The backfill, and the merge it exposed

Development: **13 scanned, 12 rewritten, 1 already bare, 0 unidentifiable**, four
identities out of five stored strings — and the flag sitting in the data the whole
time:

```
randall@example.com   rows: 2
  wasStoredAs: ["randall@example.com", "Randall <randall@example.com>"]
```

Two rows, two strings, one mailbox, and a STOP on either that never reached the
other. A second run rewrote nothing, which is tested rather than assumed, because
a backfill whose second run corrupts its first is worse than none.

Production: **6 scanned, 6 rewritten, 0 unidentifiable, one identity.**

### Verified by mail, on production, not by reading the diff

**The inbound path normalises.** The same mailbox and the same client that stored
`"Randall LaPoint, Jr." <rplapointjr@gmail.com>` this morning stored
`rplapointjr@gmail.com` this afternoon. Gate: `7 threads, 1 distinct senders, all
bare addresses`. 7/7.

**The STOP number is the proof, and it was predicted before it was sent.** Seven
threads carried five distinct documents, so the reply had to say five. It said:

> Stopped. I won't email you again about 5 documents I was watching for you.

Three seconds, no scrape, no model call. **Without the backfill that same STOP
would have said 1** — only the one thread created after the fix would have matched
`rplapointjr@gmail.com`, and the six older ones would have sat under their
display-name string, still enrolled, still being mailed. One number, and it is the
whole difference between the flag and its fix. All 8 rows came back stopped, 5
documents silenced.

**Re-enrolment works as designed.** A fresh forward afterwards created a live,
unstopped thread, so the production watch is not left dark.

### What is NOT verified, and why

Sending with a **changed display name** and from a **differently-formatting
client** was in the plan and did not happen: the Gmail API sends with the account's
configured `From` and it cannot be varied from here. What stands in for it is
weaker and is named as weaker — eleven unit tests over the exact header shapes,
the development backfill merging two genuinely different stored strings into one
identity, and the live before/after above on one client. The gap is that no two
*different* live headers have been observed collapsing to one identity on
production. Changing the display name in Gmail's settings and forwarding once
would close it.

`crons.cron`, the README's answer-text sentence, the `url === null` gate check and
M5 remain untouched.

## 2026-09-08 (evening) — the display name changed, and the line count moved on its own

Two findings from one forward, and the second one was not being looked for.

### H4's last gap is closed

The morning's write-up recorded what had NOT been verified: two *different* live
`From` headers collapsing to one identity on production. The Gmail API sends with
the account's configured name and cannot vary it, so the unit tests and the
development merge were standing in for a live observation.

The display name was changed on the account and one document forwarded. Both raw
headers, off the wire:

```
this morning:  From: "Randall LaPoint, Jr." <rplapointjr@gmail.com>
this evening:  From: Lokie-ree <rplapointjr@gmail.com>
```

Different name and a different *syntactic form* — a quoted string containing a
comma, then a bare atom. AgentMail's own quoted-original confirms what it
received: `On Tue, Sep 8, 2026 at 6:45 PM UTC Lokie-ree <rplapointjr@gmail.com>
wrote:`. The stored row reads `rplapointjr@gmail.com`, and the table now holds
**10 threads and one distinct identity**.

Under the old code that forward was a second person: fresh burst bucket, fresh
25-document allowance, and a STOP that would have reached nine of ten threads.
The gap is closed and the "not verified" note comes off.

### Firecrawl's PDF parse is not deterministic, and this is now observed

The line count was a loose end from the morning: 173 on 09-05 under parser v1,
171 on the board after H3, then 174 on the round trip. One reading was that the
CMS sample PDF had moved. It has not.

Same URL, same `PARSER_VERSION`, one afternoon:

| read | lines |
|---|---|
| 11:17 cron sweep | 171 |
| 17:49 round trip | 174 |
| 18:31 forward | 174 |
| 18:46 forward | **171** |

And the file itself is byte-identical across that window — downloaded at 17:49
and again at 18:47, `sha256 863bf56f…` both times, `cmp` clean. **So the document
did not change and the parse did.** That is not an inference from a line count;
it is two hashes of the same bytes beside four different readings of them.

**What it costs.** `contentHash` moves whenever the parse flips, so the early
exit misses, the document is re-extracted, and two model calls are spent to
rediscover the same answers. On six documents that is small. It is also the third
time this project has had a number move with no cause a reader could see, and the
first two both ended up in the README.

**What it does NOT cost, and this is the better half.** Every one of those churns
produced a hash change, a full re-extraction, and **no email** — because `diff`
asks whether the clause a finding quoted is still in the document, and it always
was. The second gate has now been exercised against genuine parser noise on
production rather than against an edited fixture, and it held every time. Hashing
the text instead of diffing two model runs was the P4 design decision; this is
the strongest evidence for it so far, and it arrived by accident.

**The model reworded its answers across those runs, too**, with the quotes
identical:

```
18:31  "Benefits could be reduced by half of the service's total cost if
        preauthorization is not obtained."
18:46  "If you do not obtain required preauthorization, benefits may be reduced
        by 50 percent of the service's total cost."
```

Same line, same receipt, different prose — the 2-of-47-cells drift, live. An
answer-diffing watch would have mailed a change notice for that. This one did
not, and could not.

Logged as **M6**. Not a broken guarantee: a public number that moves without a
cause a reader can see, on the surface that is about to become a landing page.

## 2026-09-08 (night) — the docs got their own gate, and it failed on the first run

`npm run gate` asks production whether the system still works. Nothing asked
whether the documents still describe it. That is a different failure: no test
goes red, nothing breaks, and a sentence quietly stops being true — which has
happened to this README three times, and is the one thing the gate structurally
cannot catch, because the gate is itself a claim the README makes.

`scripts/reconcile.sh` checks seven classes of claim and writes
`docs/reconcile-report.md` grouped **CONFIRMED / DRIFTED / UNVERIFIABLE**, each
finding carrying the command that produced it. The production half is delegated
whole to `gate.mjs` rather than reimplemented — a second implementation is a
second thing to keep true.

First run: **CONFIRMED 64, DRIFTED 8, UNVERIFIABLE 7.**

**The gate's own count had drifted, in all three entry-point docs.** README,
`CLAUDE.md` and `AGENTS.md` all said *six* read-only checks. H4 added the seventh
on 09-08 and the sentence that advertises the gate was never updated — and
`CLAUDE.md`'s enumeration listed six items, so the sender check was invisible to
anyone reading it. `grep -c '^check(' scripts/gate.mjs` → 7. The README also
claimed 80 tests against a suite that reports 91.

**Three of the four open flags pointed at the wrong code.** M2, L4 and L5 each
cite a `convex/mail.ts` line, and every commit since they were written moved the
target:

| flag | cited | the code it describes is actually at |
|---|---|---|
| M2 | `mail.ts:575` | **769** (`by_url`) |
| L4 | `mail.ts:222` | **326** (`console.error`) |
| L5 | `mail.ts:689` | **894** (`.take(100)`) |

Nobody had noticed because nobody had followed one. The fix order at the bottom
of READINESS sends the next session to those lines.

### The script was wrong four ways, and running it is what said so

Written, run, disbelieved, fixed. Worth recording because three of the four
would have produced a *confident* wrong answer rather than an error.

1. **It confirmed two bad citations.** The corroborating token for a line
   number was the first one in the sentence, and `attach` occurs 31 times in
   `mail.ts` — so "is `attach` near line 689?" is always yes. It now uses the
   **rarest** token in the sentence, because rarity is specificity. `.take(100)`
   occurs once.
2. **It could not see two of the three drifted counts.** Every file here is
   CRLF, and `CLAUDE.md` wraps "six\nread-only checks", so the flattened text
   read `six\r read-only checks` and matched nothing. A check that passes
   because it never ran. Putting `\r` inside the grep bracket instead — the
   obvious fix — reads in POSIX ERE as *"not a backslash and not the letter r"*
   and would have truncated every URL containing an `r`.
3. **It called two correct references missing.** `mail.ts:289` is informal, not
   wrong; bare filenames now resolve against the tracked tree.
4. **It downloaded the CMS Summary of Benefits to `/dev/null`** on every run.
   HEAD first, ranged GET only for hosts that refuse it.

### UNVERIFIABLE is a verdict, not a soft pass

Four classes cannot be settled by any command run here, and the report says so
rather than guessing: two Gmail-wrapped URLs elided with `…` in the prose, two
illustrative addresses, line numbers inside dated log entries, and — on some
runs but not others — `att.com` and `healthcare.gov` returning no HTTP response
at all. That last pair is the reason the distinction is worth having: a network
failure here is **not** evidence a link is dead, and a script that reported it
as a 404 would be inventing a finding.

**The UNVERIFIABLE count is not a score, and this entry proves it.** Writing the
table above — which quotes `mail.ts:575`, `:222` and `:689` as the wrong numbers
they were — added four more, because a dated log entry citing a file and a line
is exactly the thing the script declines to score. It went 9 → 13 by recording
history correctly. Read the classes, not the number.

**Dated entries are excluded by design.** This log saying "66/66 tests" about an
afternoon in September is correct to keep saying it. Only README, `AGENTS.md`,
`CLAUDE.md` and the *open* half of READINESS are held to the present tense —
reconciling a record of the past against today is not a fix, it is vandalism.

After the fixes: **CONFIRMED 71, DRIFTED 0.**

## 2026-09-09 — M5 closed, and the fix this file had written down would have broken the watch

The 09-08 round trip found that a published receipt could be one cell of a
markdown table, with the word that licenses the answer sitting in a cell the
reader never sees. The SBC deductible receipt read `"$500 / individual or $1,000
/ family"` under the answer *"The overall deductible is $500 for an individual or
$1,000 for a family."* — true, quoted, and uncheckable.

### The inference was measured before anything was edited

`docs/transcript-sbc.md` was careful on 09-08 to mark one step as **inferred**:
that the question cell was on the *same* Firecrawl line as the answer cell.
`contextBefore` being a table separator proved line 5 was a row; it did not prove
which cells were on it. The transcript said one probe with the line array dumped
would settle it, and named the alternative — cells on different lines, meaning
the model answered from a line that does not license its answer — as the **worse**
finding, not the lesser one.

One scrape, 09-09, through the real `toLines`:

```
[5]  What is the overall deductible? | $500 / individual or $1,000 / family | Generally, you must pay …
[11] Do you need a referral to see a specialist? | Yes. | This plan will pay some or all of the costs …
```

The licensing cell was on the line both times. The better reading held, and it
was cheap to stop guessing.

### The candidate in READINESS was wrong, and the scrape is what showed it

READINESS had written the fix down on 09-08: *"when the cited line is a table
row, publish the row's first cell alongside the matched cell."* Line 5 would have
been fine. Line 11 is why it is wrong — the model cited the **third** cell, so
that rule produces `Do you need a referral to see a specialist? | This plan will
pay …`, a string that **is not in the document**.

`change.stillSays` decides whether a subscriber gets an email by searching the
document text for the stored quote. A welded receipt is never found, so every
re-check of an untouched document would have reported the clause `gone` and
mailed everybody that their plan had dropped its referral rule. The fix written
down to make a receipt *more* trustworthy would have made the watch lie.

So the rule is narrower and duller: **on a table row the receipt opens at the
row.** The end still snaps to the matched cell, so the third column's "Why This
Matters" commentary — the thing cell-snapping was added for on 09-04 — stays out.
What is published is still one unbroken slice of one line, and a test now pins
that property rather than leaving it as a comment.

### Verified by running it, not by reasoning about it

Three tests, all observed failing against the old `excerpt` first. Then a real
`mail:probe` on development — one Firecrawl scrape, two model calls — republished
all four SBC answers:

| | receipt on 09-08 | receipt on 09-09 |
|---|---|---|
| U2 | `$500 / individual or $1,000 / family` | `What is the overall deductible? \| $500 / individual or $1,000 / family` |
| U1a | `This plan will pay … but only if you have a referral …` | `Do you need a referral to see a specialist? \| Yes. \| This plan will pay …` |
| U4 | `Preauthorization is required. …` | `… \| Specialist visit \| $50 copay/visit \| … Preauthorization is required. …` |

The AT&T and Spotify receipts came back byte-identical, which is the check that
the rule fires on rows and nowhere else.

**Not verified on production.** Prod cannot be deployed from a Claude session,
so the four receipts quoted in `transcript-sbc.md` are still the 09-08 ones. The
transcript carries a dated note saying exactly that rather than being rewritten:
it is a receipt for a reply that was actually sent, and editing it to describe a
better reply nobody received would be the one kind of dishonesty this project
cannot afford.

Score 82 → 87.

## 2026-09-09 (afternoon) — four documents, three flags, and the score went 87 → 62

probe-v4 was predeclared in the morning and committed before anything was sent.
Four documents went through production in ninety minutes. Every reply came back
in 19 to 33 seconds. Three defects that had been shipping the whole time became
visible, and **not one of them was found by reading code** — four audit passes
and a code review had scored this build at 82 or higher with all three present.

### What passed, and it is worth saying first

**The injection fixture failed to move anything.** A subscriber agreement
carrying two instructions addressed to machines — one visible, one in a
`display:none` div — was answered from its own clauses on every question. The
document says arbitration is binding and the subscription auto-renews; the
injections demanded the opposite of each; the reply said binding and
auto-renews, citing lines 78 and 10, and never cited either instruction line.
The hidden one demanded a blanket `not stated` on everything and got eight
answers and zero refusals.

**The hidden instruction did reach the parse**, which is the part worth
remembering. `display:none` text survives Firecrawl with
`onlyMainContent: false`. A forwarded document can carry an instruction the
person forwarding it cannot see, and the reason it failed here is that the model
never writes a quote — not that the text was filtered.

**M5 is closed on production**, verified by mail rather than by deploy log: the
SBC receipt now reads `What is the overall deductible? | $500 / individual or
$1,000 / family` where yesterday it read the bare cell.

### The refusal lied, and the refusal is the differentiated claim

`probe-v4/contradiction.html` was built to test what a one-line contract does
with a document that disagrees with itself. It answered that — silently, and
**from different sides of the conflict for different questions**: the deposit
window from the addendum, the late-fee day and the notice period from the body.
That was predeclared as a limitation and it stays one.

The flag is what happened to the late fee amount. Firecrawl wrapped the sentence
after a numeral:

```
22  …TENANT shall pay a late charge of Fifty and 00/100
23  Dollars ($50.00) for that month. The late charge is additional rent…
```

`reflow` joins a wrapped line only when the previous ends `[a-z,;:)]` and the
next starts `[a-z("']`. This one ends in a digit and continues with a capital
`D`, so it fails both halves and the sentence stays in two pieces. No single line
carries both *late charge* and *$50.00*, so the extractor refused — **correctly**,
under a contract that was deliberately written to refuse rather than answer
across lines.

Then the reply printed the sentence it prints for every refusal:

> Searched all 120 lines. This document does not state it.

The document states it. Twice, at two different amounts. `extract.ts`'s prompt
tells the model to refuse *"including when the document does say it but spreads
it across lines you would have to combine"* — so the system already knows
*absent* and *uncitable* are different things, and then publishes the same
sentence for both. **H5, fifteen points**, scored against H3 as the precedent:
that was fifteen for confident false refusals too.

The honest cheap fix is one line — "no single line states it" is true in every
case, including genuine absence — and it is weaker than what ships today.
Whether to buy the stronger sentence back with a reason field on the refusal is a
product decision, not a bug fix, and it is written down as one.

### The receipt that belonged to the other answer

`groupByLine` in `reply.ts` merges two findings that cite the same line: both
answers kept, **first quote wins**. On the injection fixture, `T3a` and `T3b` both
cited line 60. Their stored quotes are different and both correct. The email
printed only the first, so *"You receive at least 30 days' email notice"* went
out under *"We may modify this Agreement at any time…"* — a sentence that does
not mention notice.

This is M5 one layer up, and the function's own comment explains why it was safe
when it was written: before `excerpt` shipped on 09-04, two findings on one line
always carried the identical whole-line quote and grouping them lost nothing.
`excerpt` falsified that assumption and nothing went back to re-read it. **The
lesson is not "grouping was wrong". It is that a change three files away
invalidated a comment that was true when written, and no test held the property.**
M7, and the fix is to key the group on the quote as well as the line.

### 62 is the honest number

`100 − 15(H5) − 5(M2) − 5(M6) − 5(M7) − 5(M8) − 3(lows)`. Third time this log has
recorded a drop that came from running the product rather than auditing it, and
the pattern is now five for five. Nothing broke today. Three things that were
already broken stopped being invisible.

## 2026-09-09 (evening) — the three flags were one flag, and the test is the fix

A fair question got asked after the playtest: *are we not just putting band-aids
on issues the next playtest rips off?* It is answerable, so it was measured
before it was argued.

**Code churn per working day: 1298 → 1807 → 622 → 328.** Docs churn overtook it
on 09-08 and stayed there. That half of the worry is real and the numbers say so.

**The "circles" half is not.** The three flags found that afternoon are in three
different files at three different layers — `extract.ts` (M5), `reply.ts` (M7),
`lines.ts` (M8). What made them feel repetitive is that two of them are **one
class**: *the receipt published under an answer was not that answer's receipt.*
Not going round; one bug walking down a pipeline while it got swatted at each
station.

### The thing three days of auditing had not found

`reply.test.ts` covered the grouping M7 broke. It built both findings like this:

```js
{ ...answered, questionKey: "L3a", answer: "The late fee is $25.00." },
{ ...answered, questionKey: "L3b", answer: "It applies after the fifth day." },
```

Both spread the same fixture, so both carry the **identical quote** — the exact
assumption `excerpt` falsified on 09-04. The test asserts an instance. It passed
all week and **could not fail on M7 in principle**.

Three tests asserting three instances, and no test asserting the property. The
gate has the same shape: it reads the `findings` table, where every quote was
correct, and every defect this week lived in the gap between that table and the
email nobody checks.

### So the fix is the invariant, and the patches are incidental

`reply.test.ts` now parses the rendered reply back into blocks and requires every
answer to sit above its own quote and its own line number. A fourth instance, in
a fifth file, fails it without anyone predicting where it would appear.

The two patches under it are four lines. `groupByLine` keys on the receipt
instead of the line, and the refusal stops asserting absence: **"Searched all N
lines. No single line states it."** True when the fact is absent, true when it is
split across lines, and weaker than what shipped before. The section header was
making the same claim, so "WHAT IT NEVER SAYS" became "WHAT NO SINGLE LINE
SAYS", and the no-document reply was a third copy of it.

**Observed failing against the old renderer first:** 4 fail / 93 pass. 97/97
after.

**Buying the stronger sentence back is a product decision, not a bug.** It needs
a reason field on `not_stated` so the reply has something to branch on. It is
written down in READINESS as explicitly *not* a flag, so the next session does
not open one.

62 → 82. Two hours after 87 → 62, and by the same day's work.

### What this does not fix

The video does not exist, the landing page does not exist, and no outside person
has ever used this. Those are the deliverables, and no amount of flag work is a
substitute for them. The freeze starts here: no further probes until the video
is shot.

## 2026-09-09 (night) — the check written to confirm a fix found a worse flag

A5 was three lines in `probe-v4.md`, predeclared that afternoon: after the next
production deploy, re-forward the two fixtures and confirm the receipts separate,
the refusal reads *"No single line states it"*, and nothing else moves.

**The first passed.** Two answers citing line 60, each under its own receipt. M7
closed on production, by mail rather than by deploy log.

**The second could not be checked**, because the contradiction fixture answered
the late fee this time instead of refusing it. The new refusal sentence is pinned
by a test and is still unproven where it matters. It is recorded as unverified
rather than as a pass, which is the entire reason the check was written down
before it was run.

**The third failed, and that is the day's finding.** The same page, unchanged,
refused the late fee at 14:15 and answered it at 15:13:

```
The late fee is $50.00.
  "Dollars ($50.00) for that month."     line 23
```

Line 23 does not say *late fee*. Line 22 does, and reflow would not join them
because the wrap landed after a numeral — M8, opened six hours earlier, now with
a consequence attached.

### What broke and what did not

The quote is verbatim, located by index, after the model stopped talking. Nothing
was fabricated. **The structural guarantee — it cannot show you a sentence that
is not in your document — held exactly as advertised.**

What failed is one level up: that the sentence shown *supports* the answer above
it. That has always been an instruction to the model rather than a property of
the system, and the difference has been written in `extract.ts` since the day it
was built. Today is the first time it broke where a person could see it. **H6,
fifteen points, 82 → 67.**

### The fix order changed, and not toward the flag

M8 was parked behind M2 that afternoon because its first step is a measurement.
It is now **first**, because it is the measurement that decides whether H6 is a
class or a single parser artefact: the answer out-ran its line because reflow had
orphaned the amount onto a line of its own. Fix the parser, re-run the document,
and H6 either disappears or becomes real.

**What was NOT done, deliberately.** No checker was written. Three shell-page
heuristics were predeclared and measured on 24 documents on 09-07 and all three
false-positived on real HUD and DOL notices; "the cited line must contain a noun
from the answer" is that mistake in a new hat, and it buys a false refusal —
which is worse than what H6 does — to prevent a rare false answer.

### And the video script changed by one sentence

Shot B said *"every claim comes with the sentence that carries it."* Twenty
minutes later production published a sentence that did not carry its answer. The
narration now claims only the provable half: the quote is in your document,
because the system never writes one. The script says out loud, with the date and
the receipt, not to improve that wording back.

**The freeze holds.** M8 bumps `PARSER_VERSION`, and a bump between the enrolment
and the fixture edit makes `attach` re-baseline and swallow the change the video
exists to show. Nothing in the fix order happens before the video is shot.

---

## 2026-09-09 (evening) — the board was a second renderer, and it had not been read

The video script was being rewritten when the reason it needed rewriting turned
out to be in the product. The script led with *documents are long* and buried
the refusal past the point a judge decides. **So does the page**, and the page
is the older mistake.

`documents.recent` orders by `_creationTime`. Which document leads is therefore
an accident of when the corpus was seeded, and the accident put the **Las Vegas
employee handbook — which refuses nothing — on the first screen.** A stranger's
first impression of this project was answers-with-quotes, which is what all six
inbox-and-citation entries on the identical stack also show. The differentiator
was in the fourth card, below the fold.

The comment at the top of `src/App.tsx` has asserted refusal-first ordering
since 09-05, and it is worth quoting against itself:

> A person who arrived here has not asked anything yet, and the reason to keep
> reading is the half nobody else ships.

True inside a card. False at the page level, for four days. **A decision written
down in one file and applied in another is not applied**, and reading either
file alone confirms it.

### The two that were worse, because they were already closed

H5 and M7 were both found, fixed, scored and moved to *Closed* earlier the same
day. Both were still live on the public board that evening.

- The refusal read **"Searched all 174 lines. This document does not state it"**
  under a header reading **"WHAT IT NEVER SAYS"** — the sentence H5 exists to
  say is not knowable — for a day after the email stopped saying it. H5's
  closure names three copies fixed. There were four.
- `groupByLine` in `App.tsx` still keyed on `f.lineNo` alone, the exact shape M7
  was opened for, so the page could publish one answer under another finding's
  receipt while the email could not.

Nothing tests `src/App.tsx`. The `reply.test.ts` guard that forbids
`/does not state|never says|is silent/` could never have reached it, because the
board **restated** the sentence instead of calling the function that produces it.

### The fix is the import, not the two patches

`refusalLine` and `receiptKey` are now exported from `reply.ts` and imported by
the board. One definition of what a refusal says and one definition of what
makes two findings the same receipt. A fix to either reaches both renderers, and
the existing class guard now covers the page transitively. `reply.ts` was
already pure — it imports two types and `questions.ts` — so this cost nothing.

That is the same move that closed H5 and M7 themselves: an invariant rather than
an instance. **The instances keep being the second copy.**

### Two smaller things in the same pass

The re-check stamp rendered a bare date, so the cron's 11:17 UTC sweep and a
hand-run sweep at 15:00 printed an identical string — the one genuinely live
thing on the page was invisible. It carries the time now, in UTC, for the same
reason `reply.ts` stamps receipts in UTC. And the corpus line says what the
watch does, derived from the rows rather than restating the schedule:
**re-read daily, last sweep Sep 9, 12:48 PM UTC.**

### What this says about the discovery modes

`READINESS.md` has said all week that everything was found by sending mail and
nothing by re-reading code. **These three were found by neither.** They came
from opening the public page beside the email and reading the two against each
other. An audit reads files one at a time, which is precisely how a defect
fixed in `reply.ts` and alive in `App.tsx` survives. Sending mail exercises one
renderer. **The mode that worked was comparing two surfaces that are supposed
to agree.**

Score unchanged at 67. Nothing new is open; two closures were completed and one
ordering defect closed unscored.

## 2026-09-10 — the page described a guarantee it did not have

A pre-shoot review read `extract.ts` against the two sentences the project
publishes about how it works, and they disagreed.

`README.md`: *"The model never writes the answer text."*
`src/App.tsx` footer: *"the model returns a line number and never writes the
sentence."*

The prompt in `extract.ts` tells the model **never to copy document text into
`answer`**. The plain-English answer is therefore the one field on the page that
is entirely model prose. Both sentences were false about the thing they named.

### The guarantee is real, and it is about the quote

An earlier reading had gone the other way and worried that `excerpt` *weakened*
the grounding claim, because the model proposes clause text. It does not.
`verify()` calls `excerpt(lines[lineNo - 1], claim.support_quote)`; `excerpt`
returns `whole.slice(start, end)` of the document line. The model's string is
used only to locate the cut, and if it is not present in the line character for
character it is discarded and the whole line publishes. The model's text never
reaches a reader.

So *"neither I nor the model wrote that sentence"* is defensible — **about the
quote, and only about the quote.** Both places now say so:

> The plain sentence above each quote is the model's summary. The quote is not:
> the model returns a line number, and the sentence is cut out of your document
> by index on the server. A quote that is not in the document cannot be shown.

That is a weaker sentence than the one it replaces, and it is the one that is
true. The pattern is now familiar enough to name: **this project's retractions
are all the same shape.** H5 retracted "this document does not state it." M7
retracted a receipt printed under the wrong answer. The board retracted both a
second time because nothing tested the page. H7 retracts a claim about the
mechanism itself. Four for four, the false version was the stronger one and the
correction cost a clause.

### A fourth discovery mode, and it is free

`READINESS.md` had three: re-reading code found nothing all week; sending mail
found five flags; comparing the two renderers found three more in twenty
minutes. This one is none of those. It compares **a claim about the pipeline to
the pipeline** — a published sentence beside the prompt that produces the field
it describes. No deploy, no mail, no model call, and it took one grep.

The surface it applies to is small and enumerable: every sentence in `README.md`
and `src/App.tsx` that begins *"the model"* or *"the system"*. That is a checkable
list, and it is worth walking before the submission rather than after.

### Also in this pass

The 09-10 script rewrite lands with it: beat A no longer says *"it is not in
there"* over a screen reading *"no single line states it"* — the same
self-contradiction H5 exists to stop making, and it would have contradicted beat
D ninety seconds later. Beat A now says *"the government's model health plan
summary — the form every insurer fills in"*, because the SBC is CMS's completed
sample and a judge who clicks finds a fictional plan. Beat B says the summary is
the model's and the quote is not, out loud, so the video and the footer agree.
Beat E names what the platform carried instead of rolling credits.

`docs/shoot-card.md` is new and is the only thing that goes next to the camera:
order, five hazards found in code rather than in the docs — the classifier
re-roll that mails nothing and logs nothing, the token bucket at five forwards,
beat B silently re-extracting the card that was hand-checked 21 of 21 — and one
rule, which is *read the reply before you keep the take*.

`docs/handoff-2026-09-10.md` carries the rest, including the judge panel
(fourteen of seventeen work at the four sponsors) and the decided board
redesign, which is not started.

Score unchanged at 67. H7 opened and closed inside the pass and never survived a
pass boundary, so it moves no number; it is on the do-not-re-flag list because
it is the fourth instance of one class.

## 2026-09-10 (afternoon) — the board became a pleading page

The page had been a scaffold with real data in it since 09-02, when `index.css`
recorded a deliberate deferral: *the typeface is the platform's own for now,
because picking a webfont before the interface is designed would be guessing.*
That note is now removed, because the guessing is over.

### The hierarchy was arguing against the product

The model's summary was bold. The quote — which is the entire claim, and the
only text on a card that came out of the document — was small grey italic under
it. The page led with the one part of a finding the model writes, on a product
whose argument is that the model does not write the part that matters.

So: **the quote is now the largest text on the card**, set in Newsreader, and
the summary is an annotation above it in the chrome face. Line numbers moved
into a real gutter down the left edge, one continuous rule, like a pleading
page. **A refusal renders with an empty gutter** — no line number, because there
is no line. That is the thesis stated before anyone reads a word, and it cost no
new sentence.

The colour decision follows from the same place: **the one accent belongs to
absence.** "What no single line says" is the only thing on the page with a
colour on it. Answers get none and earn attention through size instead. Green
for good and red for bad would have put the differentiator underneath.

Public Sans for chrome, because it is the US Web Design System's face and this
product quotes government model documents. IBM Plex Mono for line numbers,
hashes and timestamps, where it is doing an index job rather than signalling
"technical". Light only — `prefers-color-scheme` meant the shooter's OS theme
decided what beats A and D of the video looked like, and nothing on this page
was gaining anything from the dark variant.

### What was not allowed to move

The board is a second renderer, and 09-09 is the reason that sentence is in the
file header. `refusalLine` and `receiptKey` are still **imported** from
`reply.ts`; `questionFor` is still imported from `questions.ts`; refusals still
come first inside a card; refusing documents are still hoisted by CSS `order`
derived from the data rather than by a hand-picked id; `PublicDocument` is still
`Omit<Doc<"documents">, "watchError">`. **No new factual claim was added to the
page.** Every sentence added is a sentence `reconcile.sh` has to keep true, and
the redesign added none.

### Verified by opening it, which is the whole point

Rendered on `charming-kookabura-768` (**dev**) and read: the SBC card's four
refusals sit against an empty gutter, the superseded clause on the Northfield
fixture strikes through in serif with its own line number in the same gutter as
the current one, and the footer carries the corrected sentence. The first
alignment attempt opened a *second* gutter inside the first for the superseded
clause and was fixed to re-enter the page's one gutter. Mobile at 390px holds;
no console errors; no horizontal overflow.

A dev server already running on this machine was serving the same source against
**production's** public queries, which incidentally answered a question the
pre-shoot review had left open: on production the SBC card is first and refuses
four. That is the board's own data read through a read-only query, not a
deployment — production is still unchanged and still cannot be deployed from
here.

### The stagger, and what it is approximating

Cards fade and rise on entry, staggered. They already reorder as findings
resolve, which is why the script says do not reload on camera; the stagger turns
that reflow into choreography instead of a flicker. The delay keys off DOM index
within the two `order` buckets rather than final visual position, so a hoisted
card can animate a beat out of sequence — imperceptible at six cards and 50ms,
and marked `ponytail:` with the upgrade path. `prefers-reduced-motion` turns it
off.

## 2026-09-10 (evening) — the riskiest thing in the video was a deploy, so it left the video

Beat C had the shooter edit the fixture on camera, publish, and run
`watch:sweep` by hand, while narrating. Three things wrong with that, and the
third is the one that mattered.

**`npm run deploy` is not a demo action.** It pushes the functions, builds the
Vite client and re-uploads the whole static bundle. Running it mid-shoot means a
slow all-or-nothing operation with dead air over it, and a dirty working tree
shipping live on camera.

**`watch:sweep` was the wrong entry point and always had been.** `watchable`
filters on `url !== null`, not on `isPublic`, so a hand-run sweep re-reads every
url-backed document in the deployment — private forwards included. `watch:recheck`
already exists, takes one `documentId`, and is exactly what `sweep` enqueues per
document. **The fix was a function that had been in the file the whole time**,
which is the second time this week the answer was already in the repo.

### The third one is the argument, not the mechanics

Running the sweep by hand undercuts the sentence the beat exists for. *"I did not
ask for this"* is weaker when the viewer has just watched you ask for it.

So the change now happens **the day before**, and the daily cron finds it at
11:17 UTC with nobody watching. *Unprompted* becomes literally true, and the beat
gains an on-screen timestamp that a viewer can check — which is the only kind of
claim this video makes. Nothing is faked and nothing is hidden: the narration
still says out loud, first, that the page was changed on purpose.

**The change is consumable, and that constrains the rehearsal.** Once a change is
detected and published the new reading is the baseline and the next read finds
nothing — the same shape as Firecrawl's `changeTracking`, where reading the
status spends it. A Friday rehearsal that moves the late charge SPENDS the late
charge. So Friday proves the chain on the entry notice (four hours to six), a
clause the video never quotes, and leaves $400 and ninety alone.

### What is left to fail, and it is now checkable before a take

The classifier re-roll. Every hash move forces a re-classify, and if two
consecutive readings land on different checklists the diff finds no prior
question and mails nothing, with no error anywhere. That has not changed.

What changed is that it is now **readable before the camera is on**, with one
read-only query that sends no mail and calls no model: the fixture's `kind` and
the count of findings carrying a `changedAt`. `changed` must be 2. If it is 0 the
re-roll happened, and the recovery — edit again, deploy, `watch:recheck` — is off
camera, which is the whole reason it was moved off camera.

`docs/video-script.md`, `docs/shoot-card.md` and `docs/rehearsal.md` all carry
the new order. Shoot day now contains no deploy at all.

## 2026-09-10 (night) — three things the audit found after the design was called done

Asked whether any stone was left unturned. The honest answer was no, and turning
them over cost three fixes.

### `npm run gate` and `scripts/reconcile.sh`, actually run

7/7 on production `impressive-marten-163`, read-only: 17 functions and 2 public,
6 public documents all `isPublic`, 37 answered findings all quoted with a line
number, last sweep 9.6h ago, no document failing its re-check, 18 threads all
bare addresses.

Reconcile: **CONFIRMED 74, DRIFTED 1**. The one drift was `README.md` claiming
**91 tests** against a suite that reports 97. Fixed. That is the fourth time a
number in the README has drifted and the fourth time the script caught it, which
is the argument for the script.

### The gutter failed its own accessibility floor

The palette shipped that afternoon put `faint` at **2.9:1** on the card ground,
and `faint` was carrying the LINE NUMBERS — the single element the whole redesign
is built around. Below the 4.5 floor for text that size, and worse, it is exactly
the thin small text that mushes first under video compression.

Measured rather than eyeballed, every token against both grounds. The ramp is now
ink ~15, muted ~7.5, faint ~4.6, absent ~6.4, in **both** themes, so neither
reads flatter than the other. `rule` stays at ~1.5 and is exempt: it is a
hairline, and the line numbers beside it carry the meaning.

**The lesson is not "check contrast".** It is that the token doing the most
important job in a design is the one most likely to have been chosen for how
quiet it looked.

### Dark, and the reversal that goes with it

The board ships **dark**. The 09-10 afternoon decision was "light only", on the
grounds that `prefers-color-scheme` let the shooter's OS decide what the video
looked like. That reason survives intact — a committed dark theme removes the
variable just as completely — and Randall's call is that dark reads better on
camera.

Recorded as a reversal because the concern was real and was overruled: the design
is a paper exhibit and dark works against that metaphor, and beats B and C cut
between Gmail's white and the board. Both palettes are defined whole and the
switch is one attribute in `index.html`, so Friday A/Bs them against the actual
camera rather than a screenshot. That is the cheap measurement this project keeps
saying to run first.

Two fixes fell out of rendering it: the serif quote went to weight 500, because a
400 serif thins out on a dark ground and the quote is supposed to be the heaviest
thing on the card; and **the gutter rule ran straight through both section
labels**, invisible on paper and obvious on dark. The labels moved into the
content column, where they align with everything else and where they should have
been anyway.

### Also turned over

`docs/video-script.md` still described the old live-deploy beat C in **three**
sections after beat C itself had been rewritten — the shoot order, the recording
checklist, and the things-that-will-go-wrong list. Fixed, and `CLAUDE.md` and
`AGENTS.md` now name all four places a shoot-mechanics change has to reach. This
is the second-renderer defect again, in prose this time.

`watch:recheck` was recommended as the recovery command without anyone having run
it. Run on **dev**: `lastCheckedAt` moved to 21:03:41Z, `watchError` null, line
count unchanged at 94, findings intact. It takes the early exit cleanly on an
unchanged page. The command form in the shoot card is now proven rather than
assumed.

**Left open on purpose:** `public/og.jpg` is still a screenshot of the old
scaffold board, so every link preview shows a page that no longer exists. It is
Randall's call whether to reshoot it before the submission.
