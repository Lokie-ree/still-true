# still-true: Pre-Build Assessment

**Assessment date:** September 2, 2026  
**Target submission:** September 21, 2026  
**Hard deadline:** September 22, 2026 at 12:00 PM PT

## Executive verdict

The project has found a real problem class, but it has not yet validated or built
the proposed solution.

The evidence supports this narrower statement:

> Parents and school staff sometimes encounter stale, incomplete, or materially
> different instructions across district and school pages. A tool that presents
> those instructions with current, inspectable source receipts may be useful.

The evidence does not yet support these stronger claims:

- Ten districts and five questions are the right product scope.
- Parents want to compare districts or schools in a matrix.
- Email is the preferred front door.
- The system can reliably extract, verify, update, and email cited answers.
- The product saves 20 minutes per fact.
- The probe proved a repeatable market need.
- The current project would score well if submitted now.

The recommendation is a **conditional GO**:

1. Spend two days repairing the validation evidence and testing the proposed
   workflow with real users.
2. If that gate passes, build a sponsor-complete but sharply narrowed MVP.
3. Do not build the current ten-district, five-question vision as written.

If submitted today, the project would likely score poorly. The deployed app is
a healthy but static board of synthetic answers. OpenAI is absent, the
Firecrawl and AgentMail spike is not invoked in production, there are no tests,
and the current comparison-matrix direction exists only in documentation.

No responsible numeric judge score can be estimated because the official
criteria have no published weights.

## Assessment method

Claims were separated into four evidence levels:

- **Observed:** directly visible in source, repository history, live deployment,
  or source pages.
- **Independently corroborated:** supported by an external primary or credible
  source.
- **Self-reported:** recorded in the build log but not independently reproduced
  during this assessment.
- **Unobserved:** planned, asserted, or inferred without sufficient evidence.

The review covered:

- All tracked application and configuration files.
- `README.md`, `hackathon.md`, and `probe.md`.
- Git history and branch state.
- The deployed application.
- The official hackathon page and rubric.
- The Louisiana statute and cited Jefferson Parish pages.
- Current Firecrawl and Convex component documentation.
- Public evidence about parent and district information problems.
- Early competing All Gas submissions as a relative execution benchmark.

## Repository state

At assessment time:

- Current branch: `docs/probe-and-mvp-lock`
- Current commit: `5f9839d`
- Public default branch: `origin/main` at `6012df4`
- The probe and comparison-matrix decision are one local commit beyond the
  public default branch.
- The working tree was clean before this assessment file was added.
- Application source is approximately 338 lines across `src/` and non-generated
  `convex/` files.
- `hackathon.md` and `probe.md` contain approximately 462 lines.

The amount of research relative to implementation is appropriate for an early
validation stage. It also means the project is not yet at the implementation
stage implied by the phrase “MVP locked.”

## What is actually implemented

The code implements the original monitor concept, not the newly documented
comparison matrix.

### Data model

`convex/schema.ts` defines:

- `sources`: URL, owner email, content hash, and last-check time.
- `answers`: question, answer, source, verification time, and fresh/stale state.
- `questions`: inbound email, text, optional answer, and optional routing
  destination.

The `questions` table has no readers or writers. There are no entities for
districts, schools, fixed comparison questions, evidence quotations, source
snapshots, cell versions, diffs, or subscriptions.

### Public API

`convex/answers.ts` exposes:

- `board`: reads up to 100 answers and joins each answer to its source URL.
- `publish`: inserts seeded sources and answers.

`publish` is an unauthenticated public mutation. Anyone who discovers the
function can add arbitrary answers, URLs, hashes, and owner email addresses to
the production database.

### Crawl and email spike

`convex/spike.ts` contains an internal action that:

1. Scrapes a known URL through Firecrawl.
2. Hashes the returned markdown.
3. Compares that hash with the stored hash.
4. Marks up to 100 attached answers stale.
5. Sends the source owner an AgentMail message.

This is a useful mechanism spike, but it is not a product path:

- Nothing invokes it.
- There is no cron, scheduler entry, or HTTP route.
- It marks every answer stale after any page-level byte change.
- It does not extract or repair an answer.
- It does not receive email.
- It does not persist an outbox or retry failed email.
- It does not use an OpenAI model.

The build log self-reports that the spike worked against a controlled GitHub
Gist. That validates the basic vendor calls, caching behavior, and state
transition in a controlled environment. It does not validate messy school HTML,
PDFs, source authority, extraction accuracy, or product demand.

### Live deployment

The production site at
<https://impressive-marten-163.convex.site> was inspected in desktop and mobile
viewports.

Observed:

- Four answers render successfully.
- All four belong to a fictional Northgate Unified School District.
- All are marked `fresh`.
- All were verified on September 1, 2026.
- Their source links point to two controlled GitHub Gists.
- Loading resolves cleanly.
- No browser console or failed-network errors were observed.
- The layout remains readable at a 375 × 667 mobile viewport.

Not observable:

- Automatic crawling.
- A fresh-to-stale transition.
- Repair or re-extraction.
- Inbound email.
- Question matching.
- Cell subscriptions.
- OpenAI usage.

The live application proves static hosting, a functioning public Convex query,
and a serviceable responsive board. It does not prove the product claim.

## Verification baseline

Fresh read-only checks produced the following results:

- Frontend TypeScript project: passed.
- Vite/config TypeScript project: passed.
- Convex TypeScript project: passed.
- ESLint across TypeScript and TSX files: passed.
- Runtime dependency audit at high severity: zero reported vulnerabilities.

Important limitations:

- There is no `test` script.
- There are no test files.
- There is no CI configuration.
- `npm run typecheck` references the frontend and Vite projects but not
  `convex/tsconfig.json`.
- A successful frontend build would not prove crawl, email, extraction, or
  production behavior.

## Is the problem real?

### Broad problem: yes

The broad problem—families struggling with incomplete, stale, or inconsistent
school information—is supported.

A December 2025 GreatSchools survey of more than 1,000 K–12 parents reported:

- Approximately 70% use official school/district sites or school-information
  aggregators.
- 74% of parents highly likely to recommend their school said relevant
  information was easy to find.
- Only 20% of parents less likely to recommend their school said the same.
- Missed opportunities or deadlines were reported much more often by parents
  dissatisfied with school communication.

Source:
<https://blog.greatschools.org/2025/12/09/new-national-survey-finds-parents-want-clearer-school-information-and-are-more-satisfied-when-they-can-find-it/>

The organizational maintenance problem is also real. Provo City School
District adopted a policy requiring monthly and annual audits for accuracy,
timeliness, relevance, dead links, and outdated content.

Source:
<https://provo.edu/policies-procedures-forms/policy-7150-p1-district-website-content-auditing-procedure/>

These sources validate the category. They do not validate demand for
still-true's specific interface or workflow.

### Local instance: partially validated

The cited Louisiana authority is current:

<https://www.legis.la.gov/Legis/Law.aspx?d=80350>

The statute says that a student may not possess an electronic
telecommunication device on their person during the instructional day and that
a device brought to school must be turned off and properly stowed.

The inspected Jefferson Parish pages do present materially different
instructions:

- Haynes says the device must be powered off and placed in a school bag and
  explicitly says a pocket is not allowed.
- Adams says devices must be powered off and not visible.
- Woods says devices must be surrendered into a cellphone box and returned at
  the end of the day.
- John Ehret quotes the statute without adding a school-specific storage
  procedure.
- A district virtual-learning page still cites 2019–2021 procedures.
- Two cited `/Page/...` URLs return HTTP 404.

This is real evidence of fragmented instructions. It supports showing each
school's exact words with source receipts.

It does not establish that all differences are errors:

- Woods's box rule is stricter than the statute but can still be lawful.
- School-specific consequences and storage procedures may intentionally vary.
- A difference is not automatically a contradiction.
- Labeling Adams legally noncompliant is a legal interpretation, not a
  lawyer-verified conclusion.
- A current 2026–2028 district handbook is linked from school pages and must be
  included before declaring the authority chain inconsistent.

The strongest safe claim is:

> Schools within one district publish different instructions that a parent
> could act on differently.

The weaker and riskier claim is:

> Multiple schools are violating state law.

The project should lead with the first unless an authoritative legal review
supports the second.

## Problems with the probe

The probe found useful evidence, but its declared “② GO” is not a cleanly
executed decision rule.

### The sample protocol was not completed

The protocol specified the first 12 search results with no curation. The result
contains 10 rows, including one page carried over from another district. The
search result order and query snapshot were not preserved.

The missing two rows matter because the protocol says the first matching
decision rule wins.

### The taxonomy changed

The predeclared categories were:

- `MATCH`
- `VARIANT`
- `STALE`
- `SILENT`
- `DEAD`

The result introduced `CONFLICT`, which was not part of the decision rules.
`VARIANT` then disappeared from the reported summary even though the STOP rule
depends on its percentage.

### Counts are not mutually exclusive

The summary contains 11 tag instances for 10 rows because Adams receives two
labels. Secondary flags can be useful, but the method did not define them.
Without one primary disposition per row, the thresholds cannot be applied
mechanically.

### Woods is mischaracterized

The result labels Woods a conflict but later acknowledges that Woods lawfully
exceeds the statute. That is a variant, not a hard legal conflict.

### The Adams stale label is questionable

The phone section cites the 2024 act. A separate grading section references the
2024–2025 school year. That does not prove the phone instruction itself is
stale.

### Some SILENT rows defer to PDFs

Two HTML pages were classified as silent even though they link to current
policy PDFs. Because the first probe failed precisely by not following facts
into PDFs and outbound links, the revised probe should not repeat that mistake.

### The time-savings comparison is unsupported

The machine-assisted sweep took about 12 minutes for 10 pages. The claimed
comparison is “90 seconds per page versus 20 minutes per fact by hand.”

The manual attempt did not take 20 minutes to find one fact; it took 20 minutes
and found zero rows under a different, failed protocol. Those are not equivalent
tasks.

A timed baseline must ask humans and the system to answer the same question
from the same starting point.

### The result is evidence for another validation step

The probe supports continuing. It does not yet support locking a 50-cell
product.

Before implementation, complete a blind re-run that:

1. Uses 12 preserved results.
2. Follows relevant PDF and outbound links.
3. Assigns one primary category per result.
4. Keeps legal conflict as a separate reviewed flag.
5. Applies the original thresholds without changing labels afterward.
6. Records equivalent manual and assisted task times.

## Is the proposed solution validated?

No.

The project has validated that selected pages can be collected and compared by
a researcher. It has not validated:

- A matrix as the preferred user experience.
- The identity of the primary user.
- The five proposed questions.
- Ten districts as useful scope.
- Email as a natural entry point.
- Willingness to subscribe.
- Trust in machine-extracted answers.
- Whether source receipts materially change user decisions.
- Whether people return after the first lookup.
- Whether district staff would act on reported discrepancies.

The phrase “MVP is locked” is therefore premature.

## The unresolved user decision

Two different products are currently mixed together.

### Parent-facing answer product

Job:

> Tell me what my child's school actually requires, show me the source, and tell
> me when it was checked.

Strengths:

- Fits the “everyday app” criterion.
- Produces an immediate, understandable demo.
- Naturally uses AgentMail for a question or update.
- Makes refusal and receipts valuable.

Weaknesses:

- Parents usually care about one school, not ten districts.
- Demand for email and comparison views is untested.
- A free public answer does not establish a business model.

### District communications audit

Job:

> Show me where school pages disagree with the current district policy and
> notify the responsible person when they drift.

Strengths:

- The maintenance burden and need for audits are documented.
- Monitoring, ownership, and email alerts fit naturally.
- The original schema's `ownerEmail` concept belongs here.

Weaknesses:

- Requires identifying authoritative documents and content owners.
- May need authentication and tenant isolation.
- Sales and institutional adoption cannot be validated during a short
  hackathon.
- The demo can feel like a professional tool rather than an everyday app.

For this hackathon, the recommended primary user is the parent. District
communications staff can be named as a later beneficiary. Mixing both users in
the MVP will produce an incoherent product.

## Hackathon requirements and current fit

Official event page:
<https://luma.com/convex-allgas-hackathon>

### Eligibility and submission requirements

Observed as satisfied:

- New application started after August 25.
- Convex is the backend.
- Frontend is hosted through Convex static hosting.
- Public live URL exists.
- GitHub repository is public.
- An agent/IDE with the Convex integration is being used.

Not observed:

- Event registration.
- Participant age and geographic eligibility.
- Final submission.
- Public demo video.
- Social post.

Important clarification:

- Authentication is not an eligibility requirement.
- The official rubric nevertheless cites auth among examples of Convex depth.
- Adding auth only to collect rubric checkboxes would waste time and add risk.

### Creativity and usefulness

Potential: good.

The concrete phrase “three schools in one district give three different answers
to where a phone goes” is understandable and memorable. Receipts and explicit
refusal are useful trust mechanisms.

Current scoreability: weak.

The live app contains fictional data and does not perform the proposed job.
Usefulness must be visible in the product, not only described in the build log.

### Convex depth

Current:

- Schema and indexed tables.
- Public query and mutation.
- Internal action and mutation.
- Reactive client query.
- Static-hosting component.

Missing from the actual product:

- Scheduled work.
- Durable job state.
- Meaningful sponsor components.
- Source/cell version transactions.
- Realtime crawl or extraction progress.
- Signed webhook ingestion.
- Rate limiting or capability protection for paid operations.
- Tests of Convex state transitions.

The current implementation is closer to the rubric's warning about a thin
frontend than to a deep Convex application.

### Sponsor stack

The rubric says OpenAI, Firecrawl, and AgentMail must do real work rather than
appear only in documentation.

Current:

- Firecrawl: direct REST call in an uninvoked internal spike.
- AgentMail: direct outbound REST call in the same spike.
- OpenAI: absent from dependencies and code.

The final MVP should use each sponsor for one indispensable responsibility:

- Firecrawl retrieves live HTML and PDF source material.
- OpenAI extracts constrained candidate values and supporting quotations.
- AgentMail receives a parent's question or sends a requested update.
- Convex owns application state, orchestration, versioning, scheduling,
  transactions, and realtime presentation.

### Live URL

Satisfied technically, not satisfied narratively. The live URL works but shows
the abandoned concept and synthetic content.

### Social proof

No discoverable launch post or engagement evidence was found. Social work must
not wait until the final hour because the rubric explicitly says engagement
counts.

### Demo

No demo exists. Judges require a video under three minutes and prefer clicking
through the real product over narration.

## Competitive position

Early All Gas submissions already claim complete sponsor-stack integrations,
production workflows, and substantial test coverage:

- Recourse:
  <https://vibeapps.dev/md/recourse.md>
- NoticeProof:
  <https://vibeapps.dev/md/noticeproof.md>
- TableForAll:
  <https://vibeapps.dev/md/tableforall.md>
- Attest:
  <https://vibeapps.dev/md/attest.md>

These descriptions are self-reported and are not published judge scores.
Nevertheless, they establish a visible execution bar:

- All four sponsor technologies perform clear jobs.
- The products demonstrate production end-to-end loops.
- Failure states and safety boundaries are part of the story.
- Tests and concrete production metrics are reported.
- Videos and public submission pages already exist.

Source receipts alone are not a differentiator because several competitors use
them. still-true's defensible distinction is the fan-out problem:

> One authority is restated by many school pages, and the public needs to know
> what each page currently says and when it diverges.

Submitted in its current state, still-true is not competitive. With a narrowed,
reliable, sponsor-complete loop, it could become competitive. Placement remains
unpredictable.

## Highest-priority technical findings

### 1. Public administrative write

`answers.publish` is public and unauthenticated. This permits board poisoning
and arbitrary owner email insertion. Make administrative writes internal or
properly authorized before public promotion.

### 2. Obsolete data model

The schema cannot represent the new product. Continuing to extend the
whole-page hash monitor would increase migration cost.

### 3. No automated verification

The next phase introduces probabilistic extraction, PDF normalization,
webhooks, and retries. Building these without tests would make the demo
unreliable.

### 4. Notification loss after email failure

The spike commits the new hash and stale state before sending mail. If the send
fails, the next crawl sees no new change and does not retry the missing alert.

### 5. First-crawl semantics are misleading

Production seeds use an empty hash. The first crawl records a baseline and
returns unchanged, leaving preexisting seeded answers marked fresh even though
they were never verified against that crawl.

### 6. Production AgentMail variable mismatch

The build log records `AGENTMAIL_API_KEY` in production while the spike reads
`AGENT_MAIL_API_KEY`. The code still contains the latter. Whether production
was corrected outside the repository is unobserved.

### 7. Missing return validators

All Convex functions omit explicit return validators. A prior public query
accidentally exposed owner email, demonstrating why response contracts matter.

### 8. Unvalidated external data

Firecrawl's JSON response is accessed without runtime validation. URLs are
accepted as arbitrary strings and rendered as links.

### 9. Board read amplification

The board performs one source lookup per answer. This is acceptable for the
current tiny board but should not define the new matrix read model.

### 10. Stale documentation

`README.md`, the header of `hackathon.md`, the generic Convex README, and the
HTML title describe different project states. Because judges read
`hackathon.md`, claims must distinguish built, verified, and planned behavior.

## Recommended MVP

Build a parent-facing, receipted policy matrix for one district.

### Scope

- One district.
- Five to eight schools.
- Three action-changing questions from one policy domain:
  - Where must the phone be stored?
  - When does the restriction apply?
  - What happens on the first offense?
- Fifteen to twenty-four cells rather than fifty.
- Each cell shows:
  - Exact school wording.
  - Source URL and document title.
  - Verification date.
  - Source type and authority level.
  - Explicit `not found` or `needs review` status.
- One inbound AgentMail question returns an existing cited cell or refuses.
- One controlled source-change fixture proves versioning, realtime updates, and
  a visible diff.
- Real Jefferson Parish pages prove usefulness.
- The clearly labeled fixture proves the change mechanism.

### Explicit cuts

- Ten districts.
- Arbitrary district-domain discovery.
- Open-ended legal adjudication.
- Generic RAG or unrestricted Q&A.
- Full organization-owner workflow.
- Admin dashboard.
- Authentication unless required by a later scope decision.
- Both inbound Q&A and subscription notifications unless ahead of schedule.
- Claims that prose “repairs itself.”

The safer product behavior is:

> Re-extract a structured cell, verify its supporting quotation
> deterministically, append a new version, and expose the change.

### Proposed data shape

The exact schema still needs design review, but the minimum concepts are:

- `organizations`: district and school entities.
- `sources`: curated URLs, source type, authority level, current snapshot, and
  crawl state.
- `questions`: a fixed controlled set.
- `cells`: current value, evidence quote, source, verification date, and
  disposition.
- `cellVersions`: append-only history and diffs.
- `mailRequests` or component-backed mail state.
- `subscriptions`: stretch scope only.

Large raw documents should use Convex file storage or bounded child records,
not an unbounded array in one document.

### Grounding boundary

OpenAI should return a constrained candidate:

- Answer value.
- Exact supporting quotation.
- Source line or page reference.
- Explicit unable-to-answer state.

Deterministic code should then verify:

- The quote exists in the normalized snapshot.
- The source is on the curated allowlist.
- The requested field is supported by the quote.
- The result is versioned before publication.

Exact quote existence prevents fabricated citations. It does not prove
relevance, authority, or correct interpretation. Those remain separate checks.

### Firecrawl boundary

Firecrawl supports:

- HTML scraping.
- PDF parsing.
- Basic and Git-style change tracking.
- JSON field-level change tracking at additional credit cost.
- A Convex component for scrape, map, search, and durable crawl operations.

Field-level change tracking itself uses model extraction. It should be treated
as a change signal, not an authority or truth oracle. Using Firecrawl JSON
extraction and a second OpenAI extraction may duplicate responsibilities. The
final design should assign one clear extraction job and keep deterministic
verification in the application.

### AgentMail boundary

Use the AgentMail Convex component where feasible because it provides signed,
deduplicated webhook ingestion and persistent reactive mail state.

One email job is enough for MVP:

- Recommended core job: ask a constrained school-policy question and receive a
  cited response.
- Stretch job: subscribe to a cell and receive a version diff.

Do not build both until the first production round trip is stable.

## Twenty-day plan

### Day 1 — September 3: repair the evidence

- Preserve the search query and first 12 results.
- Follow relevant PDF and outbound links.
- Restore one primary taxonomy.
- Separate operational variation, stale content, and reviewed legal conflict.

**Gate:** a second reader can reproduce every classification.

### Day 2 — September 4: validate user and scope

- Interview five parents or school staff.
- Ask for the last school-policy question they tried to answer.
- Time a manual lookup for the same tasks.
- Test whether the receipt matrix changes confidence or action.
- Select the three questions from observed demand, not intuition.

**Gate:** proceed only if users recognize an actionable problem and the
one-district sample contains multiple meaningful differences.

### Day 3 — September 5: lock the MVP contract

- Choose the parent as primary user or explicitly reject that recommendation.
- Freeze the three questions and source allowlist.
- Define publication, refusal, and needs-review states.
- Script the intended three-minute demo before coding.

**Gate:** every planned feature appears in the demo; everything else is cut.

### Days 4–5 — September 6–7: schema and safety baseline

- Replace the obsolete schema.
- Internalize administrative writes.
- Add return validators and URL validation.
- Add `convex-test`, Vitest, and a real `test` command.
- Ensure the standard typecheck covers Convex.

**Gate:** seeded matrix state can be created and read only through intended
boundaries.

### Days 6–8 — September 8–10: retrieve and extract

- Mount and test the Firecrawl component.
- Crawl one HTML page and one PDF.
- Implement normalization and table-of-contents filtering.
- Add OpenAI structured extraction.
- Deterministically validate evidence quotations.
- Evaluate against the manually labeled gold set.

**Gate:** zero unsupported cells are auto-published. Low recall is acceptable;
unsupported publication is not.

If this gate fails, retain human-reviewed publication and present OpenAI as an
assistive extraction step rather than an autonomous publisher.

### Days 9–10 — September 11–12: live matrix

- Build the district/school comparison view.
- Display quotes, source hierarchy, dates, and refusal states.
- Deploy real Jefferson Parish data.
- Confirm realtime updates in two browser sessions.

**Gate:** a new user can explain the difference among authority, school rule,
and stale/unknown status without coaching.

### Days 11–12 — September 13–14: version and refresh

- Add scheduled or manually triggered refresh.
- Append versions instead of overwriting history.
- Prevent unchanged crawls from creating false changes.
- Add an idempotent outbox or equivalent retry mechanism.
- Demonstrate one controlled source change.

**Gate:** the open UI updates without refresh and the receipt remains
inspectable before and after the change.

If scheduling is unstable, keep a safe manual refresh for the demo and remove
claims of continuous monitoring.

### Days 13–14 — September 15–16: AgentMail

- Mount the AgentMail component.
- Configure signed webhook ingestion.
- Handle duplicate events safely.
- Match only the controlled question set.
- Send one real cited production response.
- Add rate or capability protection around paid operations.

**Gate:** one real inbound email produces exactly one correct reply in
production.

If inbound mail is unstable, use a user-requested outbound receipt flow rather
than pretending the inbox works.

### Day 15 — September 17: scope freeze

- Run code, security, and Convex reviews.
- Exercise all failure states.
- Reconcile README and `hackathon.md`.
- Remove or mark every unbuilt claim.
- Add production evidence to the build log.

No new capabilities after this date.

### Day 16 — September 18: user and judge rehearsal

- Run task-based tests with unfamiliar users.
- Test desktop, mobile, refusal, bad URL, crawl failure, and email delay.
- Cut confusing functionality rather than explaining around it.

### Day 17 — September 19: presentation assets

- Finalize the story:
  1. Same district, incompatible public instructions.
  2. Cited matrix with current receipts.
  3. Email question and cited reply.
  4. Controlled change and realtime version.
- Prepare social images and copy.
- Verify that all sponsor roles are visible.

### Day 18 — September 20: record

- Record the video under three minutes.
- Have an unfamiliar viewer watch once without narration.
- Fix only breakage or confusion.

### Day 19 — September 21: submit

- Verify the live app, repository, video, and source links anonymously.
- Ensure the latest assessment-driven direction is on the public default
  branch.
- Submit through the exact official VibeApps link.
- Publish the social post and tag the required organizations.

### Day 20 — September 22: contingency

Use only for:

- Broken production deployment.
- Broken submission/video URL.
- Submission correction.
- Critical data or security issue.

Do not add features.

## Stop/go gates

### Validation stop

Stop the parent matrix if:

- Blind reclassification leaves only expected lawful variation.
- Users do not recognize the questions as consequential.
- The selected questions cannot be sourced consistently.

Possible fallback: a district communications audit, but only after explicitly
changing the target user and demo.

### Extraction stop

Stop autonomous publication if any unsupported answer reaches the gold set.
Continue with reviewed publication and explicit refusal.

### Monitoring stop

Remove continuous-monitoring claims if a source change cannot reliably produce
one idempotent version and notification by September 14.

### Email stop

Reduce AgentMail to one safe outbound job if inbound processing is not stable by
September 16.

### Feature stop

After September 17, cut rather than add.

### Submission stop

Do not submit the old hash monitor under the comparison-matrix story. The live
behavior, build log, README, and demo must describe the same product.

## Demo proof requirements

A competitive demo should visibly prove:

1. Real pages in one district contain different action-changing instructions.
2. Every displayed answer has a source quotation and verification date.
3. Unsupported facts are refused rather than invented.
4. Firecrawl retrieves the source.
5. OpenAI extracts a constrained candidate.
6. Convex persists and streams the result.
7. AgentMail completes a real user interaction.
8. A controlled source change creates a new visible version.
9. The full path runs in production rather than localhost.

The demo should not claim:

- A nationwide dataset.
- Legal compliance determinations.
- Fully autonomous repairs.
- Continuous monitoring unless the scheduled path is actually operating.
- Time savings until equivalent tasks have been measured.

## Open questions

These questions are material and remain unanswered:

1. Is the primary user a parent or a district communications employee?
2. What are the three or five questions, and where did they come from?
3. What is the current controlling Jefferson Parish 2026–2028 policy for each
   selected fact?
4. Are school-specific variants permitted, and by whom?
5. Will users trust a matrix, prefer a direct answer, or want both?
6. Is email genuinely preferable to a web question box?
7. Does the available Convex plan include AI Gateway, or will OpenAI require a
   separate key and client?
8. Are the 0.1.x Firecrawl and AgentMail components stable for the required
   paths?
9. How many focused development hours are realistically available each day?
10. Can the gold-source snapshots be retained reproducibly without creating
    copyright, privacy, or repository-size problems?
11. What disclaimer is appropriate when presenting policy text without legal
    advice?
12. What exact evidence would cause the project to abandon the parent-facing
    direction?

## Final recommendation

Proceed only with a narrower claim and a two-day evidence gate:

> still-true gives a parent the current words published by their district and
> school, shows where those instructions differ, and provides a dated source
> receipt. It refuses when the source does not support an answer.

That claim is:

- Grounded in the observed fan-out problem.
- Safer than legal adjudication.
- More distinctive than generic page monitoring.
- Small enough to make reliable.
- Naturally aligned with Convex, OpenAI, Firecrawl, and AgentMail.
- Demonstrable in under three minutes.

The project should not begin by scaling to ten districts. It should begin by
proving that one parent, one district, and three questions produce a useful,
trusted, repeatable loop.
