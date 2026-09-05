# Hackathon log

- **Project:** still-true
- **Event:** Convex All Gas Hackathon
- **What it does:** Forward it a document — a lease, a terms-of-service update, an insurance renewal — and it replies with what that document requires of you. Every claim is quoted from the source with the line it came from, and it says plainly where the document is silent. For documents that live at a URL it keeps watching, and tells you when the specific thing you asked about changes. CC it on a thread and the same cited reply lands in the thread.
- **Live app:** https://impressive-marten-163.convex.site
- **Built as of 2026-09-05:** the inbox, the parser, the extractor and its grounding
  guarantee, and the cited reply — **live on production**, which answered a forwarded link
  in 15 s with six quoted findings and one refusal. The public board carries six documents,
  34 answered findings and 13 refusals. **The watch is built and proven on development**:
  a sweep over four documents caught both clauses that were edited on a test fixture, each
  quoted before and after with its line, and stamped nothing on the other 22 answered
  findings — and **mailed the change to a real inbox**, unprompted, into the thread that
  had asked about the document, 2 minutes 17 seconds after the clauses moved. It is **not**
  on production. **The CC reply (P5) is not built.**
- **Repo:** https://github.com/Lokie-ree/still-true (public)
- **Frontend:** Convex static hosting
- **Convex deployments:** impressive-marten-163 (production), charming-kookabura-768 (development)
- **Components:** @convex-dev/static-hosting, @agentmail/convex, @convex-dev/workpool
- **Convex features:** schema with a discriminated-union table, indexes, public queries carrying explicit return validators, realtime queries, an HTTP action, the scheduler, cron jobs, and internal mutations, queries and actions. Every write is internal — the only thing that reaches them from outside is the component's signature-verified webhook.
- **Auth:** none
- **AI models:** gpt-5.6-terra (OpenAI Responses API, strict JSON schema). gpt-5.6-sol held as the tiebreaker if a gate ever fails; gpt-5.6-luna, the plan's original pick, has never run.
- **Started:** 2026-08-29T15:29:17Z
- **Last updated:** 2026-09-05T16:45:00Z

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
