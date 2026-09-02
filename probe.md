# Probe v2 — one authority, many restatements

**v1 ran 2026-09-02 and did not execute:** 20 minutes on org 1, zero rows.
Facts lived in PDFs and outbound links to LDOE, not in comparable HTML.
That is a finding about *v1's design*, not about the product. Do not read it
as decision rule ④.

## What v1 got wrong

v1 looked for a claim page and an authority page **inside one org**. K-12
does not store contradictions on that axis. It stores them on the fan-out:
**one authority, restated by dozens of downstream pages** — school
subdomains, handbooks, news posts, each maintained by a different person on
a different day.

You already said this: *"our district's info is conflicting across schools
in our district."* v1 didn't look there.

## The question

Pick one dated, citable authority. Find every page that restates it.
**Do the restatements agree with it, and with each other?**

## Setup — 5 min

- **Authority:** LA R.S. 17:239 (Act 313, 2024 — student device ban).
  A statute, dated, quotable, and every public school in the state must
  restate it. Default target; swap only if you have a better one.
- **Population:** one district with per-school subdomains. Find pages with
  a single search: `site:<district>.org "cell phone"` (JP has ~80 schools
  on `*.jpschools.org`; use whichever district you know).
- **Sample:** first 12 pages the search returns. **Do not curate.** Taking
  the messy-looking ones is tuning the instrument to the answer you want.

## The check — 2 min per page, 25 min total

For each page: does it restate the rule, and does the restatement hold up
against the statute?

| Code | Meaning |
|------|---------|
| `MATCH` | Restates it correctly. The expected majority. |
| `VARIANT` | Same law, materially different operational rule — where the phone must be stored, what the consequence is, whether lunch counts. **Not wrong, but a parent reading two schools gets two answers. Watch this bucket.** |
| `STALE` | Quotes superseded text, or a school year that has passed. **The money finding.** |
| `SILENT` | No mention anywhere. Runs on the refusal property. |
| `DEAD` | 404, moved, visibly abandoned. |

| # | Page URL | Restated rule (verbatim) | Code | Min |
|---|----------|--------------------------|------|-----|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |
| 6 |  |  |  |  |
| 7 |  |  |  |  |
| 8 |  |  |  |  |
| 9 |  |  |  |  |
| 10 |  |  |  |  |
| 11 |  |  |  |  |
| 12 |  |  |  |  |

`MATCH __ · VARIANT __ · STALE __ · SILENT __ · DEAD __`

**Already on the board** (found in ~4 min, 2026-09-02, counts toward the 12):

| Page | Finding | Code |
|------|---------|------|
| `haynes.jpschools.org/student-life/cell-phone-smartwatch-policy` | Quotes Act 313. Storage: "school bag," explicitly not pocket. Lunch and bathroom named. 4-step consequence ladder. | `MATCH` |
| `ehret.jpschools.org/families/policies-procedures` | Quotes Act 313 verbatim. No storage detail, no consequences. Page dated 12/15/25, cites "2026-2028 Procedures." | `MATCH` |
| `stpsb.org/uploaded/caps/Policies/GAMI-15.htm` | Board policy on device use — **employees only**. Adopted 2018-01-11, never amended for Act 313. Nothing about students. | `SILENT` |

## Decision — read only after the table is full

First match wins. **Do not negotiate with the result.**

**① STOP — `VARIANT` ≥ 40% and you cannot call them right or wrong.**
If "school bag" vs "locker" vs unspecified is a difference no expert will
adjudicate, no model will either. The grounded-verdict claim dies and the
honest product is dated provenance without adjudication: *here is what this
page said, and when.* Smaller, still true. **This outranks everything below.**

**② GO — ≥2 `STALE`, or ≥3 `VARIANT` a parent would act on differently.**
The front door is real. One authority, N restatements, and the diff is a
fan-out. The demo is a judge typing a district domain.

**③ SILENT-ONLY — no `STALE`, no actionable `VARIANT`, but ≥3 `SILENT`.**
The product is coverage, not contradiction: *this rule exists and these
pages don't mention it.* Weaker pitch, real product, and it runs entirely
on the refusal path already at the core of the build.

**④ FALLBACK — everything `MATCH`.**
Restatement drift is rarer than assumed. The monitor is the product. You
bought that on day 6 instead of day 17.

## Carry forward

- [ ] Winning verdict: `① ② ③ ④` → __
- [ ] Every `STALE` / `VARIANT` / `SILENT` URL copied into a seed list
- [ ] Median minutes-to-find: __ *(the number the product replaces)*
- [ ] Result summarized into `hackathon.md` under a `2026-09-02` entry

## Open, worth one search each

- Was R.S. 17:239 amended in 2025? Justia 403s; check `legis.la.gov`
  directly. A live amendment turns every page quoting the 2024 text `STALE`
  on a known date — which is the monitor and the audit collapsed into one.
- Bossier announced a policy change (`bossierschools.org/article/1693732`).
  A district that moved is where downstream schools lag. Good hunting ground.

---

# Results — swept 2026-09-02, ~12 min, machine-assisted

**Authority:** LA R.S. 17:239 (Act 313, 2024) — *"No student shall possess,
**on his person**, an electronic telecommunication device throughout the
instructional day."* Storage test is **possession**, not visibility.

**Population:** Jefferson Parish (`*.jpschools.org`), plus one St. Tammany
page carried over from v1.

| # | Page | What it says | Code |
|---|------|--------------|------|
| 1 | `haynes.jpschools.org/student-life/cell-phone-smartwatch-policy` | "powered off and placed in their **school bag**" — pocket explicitly banned, *because* the law says not on his person. Lunch, bathroom, transitions named. 1st offense = warning. | `MATCH` |
| 2 | `ehret.jpschools.org/families/policies-procedures` | Quotes Act 313 verbatim. No storage rule, no consequences. Page dated 12/15/25. | `MATCH` |
| 3 | `adams.jpschools.org/families/policies-procedures` | "turned **OFF/Shutdown and Not visible** … 7:00am–2:20pm." 1st offense = discipline referral. Cites 2024-2025. | **`CONFLICT`** + `STALE` |
| 4 | `woods.jpschools.org/news/school-news` | Quotes the statute, then: phones "MUST BE TURNED OFF" and placed in a **CELLPHONE BOX** daily, returned at day's end. | **`CONFLICT`** |
| 5 | `jpschools.org/families/hidden-family-resource-center-for-online-learning/online-policies` | "Students may not use cell phones during virtual class." Cites **Procedures and Policies 2019-2021**. Pandemic-era page still live. | `STALE` |
| 6 | `eastjefferson.jpschools.org/families/policies-procedures` | HTML page carries no rule; defers to a "2026-2028 Procedures & Policies" **PDF**. | `SILENT` |
| 7 | `jeffersonvirtual.jpschools.org/families/policies-procedures` | Same — defers to PDF. | `SILENT` |
| 8 | `jpschools.org/Page/2104` | **404.** Still returned by live web search. | `DEAD` |
| 9 | `jpschools.org/Page/452` | **404.** Still returned by live web search. | `DEAD` |
| 10 | `stpsb.org/uploaded/caps/Policies/GAMI-15.htm` | Device policy covers **employees only**. Adopted 2018-01-11, never amended for Act 313. | `SILENT` |

`MATCH 2 · CONFLICT 2 · STALE 2 · SILENT 3 · DEAD 2`

**Verdict: ② GO** — 2 `CONFLICT`, 2 `STALE`, threshold cleared.
Median time-to-find: **~90 seconds/page machine-assisted vs. 20 min/fact by hand.**

## The finding, stated precisely

Three schools in one district give three physically incompatible answers to
*"where does my kid's phone go?"*

- **Haynes** — in the school bag; a pocket is illegal.
- **Adams** — off and not visible. **A pocket passes.** Not visible is a
  weaker test than not on his person; this one does not satisfy the statute.
- **Woods** — surrender it; the school holds it in a box.

Only Haynes tracks R.S. 17:239. Woods exceeds it, which a district may do.
**Adams falls short of it, and that one is adjudicable against quoted
statutory text** — not a matter of taste.

First-offense consequence for the same act, same district, same law:
warning (Haynes) vs. discipline referral (Adams).

## Hypotheses killed

- **LDOE link rot: dead.** `louisianabelieves.com` → `doe.louisiana.gov` is a
  clean path-preserving 301, deep links included. The Jan 2025 migration was
  done properly. No finding here. Do not build a link checker.
- **"Hard to find" ≠ "contradictory."** LDOE's problem is retrieval, not
  drift. Different product; see `hackathon.md`.

## Honest limits on this sweep

- **Only 1 of 9 is a hard legal conflict.** Woods is a lawful local
  variation. Thin for a headline claim; strong as evidence of a pattern.
- **The `DEAD` rows are commodity.** Any link checker finds a 404.
- **2 of 9 authoritative texts are PDFs.** The diff and the line-index
  grounding must survive PDF→markdown, which is noisier than HTML. Untested.

---

# PDF grounding test — 2026-09-02

Two real district handbooks, Firecrawl v2 `/scrape` with `parsers:["pdf"]`.
Both HTTP 200 on the first try.

| | EBR 2024-25 | LPSS 2025-26 |
|---|---|---|
| markdown | 324,225 chars | 371,541 chars |
| raw lines | 4,975 | 4,298 |
| **raw mid-sentence continuations** | **1,688** | **981** |
| raw non-blank median line | 100 chars | — |
| hyphen-broken words | 0 | 0 |

**Verdict on line-index grounding as designed: it breaks on PDFs.**
~47% of EBR's lines continue mid-sentence into the next one, because a PDF
hard-wraps at the visual column width. `lines[n]` returns half a clause.
Fabrication is still impossible, but the quote is unreadable — which kills
the receipt, and the receipt is the product.

## Fix — reflow before numbering

Join a line into the previous one when the previous clearly continues.
Skip anything starting with a markdown structural char.

```js
const reflow = (md) => md.split("\n").reduce((a, l) => {
  const p = a[a.length - 1];
  if (p !== undefined && /[a-z,;:)]$/.test(p.trim()) &&
      /^[a-z("']/.test(l.trim()) && !/^[|#>*-]/.test(l.trim()))
    a[a.length - 1] = p.trimEnd() + " " + l.trim();
  else a.push(l);
  return a;
}, []);
```

| after reflow | EBR | LPSS |
|---|---|---|
| **continuations** | **1,688 → 0** | **981 → 0** |
| lines | 4,975 → 3,252 | 4,298 → 3,298 |
| length p25/p50/p75/p90 | 52 / 107 / 219 / 406 | 35 / 94 / 197 / 489 |

EBR reflowed line **606** is now one complete, self-contained, citable rule:

> No student shall possess, on his person, a cell phone or electronic device
> on any school bus … the electronic device shall be turned off and properly
> stowed away for the duration of the instructional day.

Two different PDF producers, same result. The fix generalizes.
On HTML input reflow is a near no-op, so one code path serves both.

## Second hazard — table-of-contents lines

LPSS's first keyword match was a **TOC dot-leader line**, not the rule. The
structural anti-fabrication guarantee does not catch this: a TOC line really
is in the document. It is a *relevance* failure, exactly the class that
survives by design.

One-line filter: `/\.{6,}\s*\d+$/` → removes 56 lines in LPSS, 0 in EBR.
After filtering, substantive candidates: EBR 7, LPSS 14.

## Store the quote, not just the index

Firecrawl's parser output can shift between scrapes; a stored bare index
would silently drift onto the wrong line. Persist **the quoted text
alongside the index**. On re-verify, `lines[n] !== storedText` is not a bug —
it *is* the change signal, and it re-locates for free.

## Ceilings hit

- 324–372 KB of markdown per handbook against Convex's **1 MB document cap**.
  These fit; a full board policy manual would not. Upgrade path is a `lines`
  child table keyed `(documentId, n)` per `guidelines.md`.
- `changeTracking` json mode costs **5 credits/page** — untested here.

## Bonus finding

EBR's currently-linked handbook is the **2024-2025** edition, still served in
September 2026. Add one `STALE` to the sweep.

---

# Repair — 2026-09-02, after external assessment

An external review caught four method errors. All four are real. This section
supersedes the tally above. **The repaired count fires no decision rule.**

## The error that mattered: I never opened the handbook

Rows 6 and 7 were coded `SILENT` because the HTML carried no rule. Both link
the district's **2026-2028 Procedures & Policies for Students and Families** —
the controlling document. Coding a page `SILENT` without following its link to
the authority is exactly how probe v1 failed. I repeated it.

Followed it. Firecrawl `/v2/scrape`, `parsers:["pdf"]`, HTTP 200,
363,191 chars, 3,505 lines after reflow + TOC filter.

`eastjefferson.jpschools.org/fs/resource-manager/view/e3f26617-b433-48e5-a80a-c3c063554933`

**Line 608 — the possession rule, stated flatly, no delegation clause:**

> No student shall possess, **on his person**, an electronic telecommunication
> device throughout the instructional day\*, including wearable technology …
> the electronic device shall either be turned off and **properly stowed away**
> for the duration of the instructional day …

**Line 618 — consequences, explicitly delegated:**

> **Each school will establish and communicate consequences** for violating its
> electronic device policy.

## What this kills

**The consequence finding is dead.** I reported Haynes-warning vs.
Adams-referral as drift. Line 618 says the district *delegates* that. Variation
in consequences is the design, not a defect. Struck.

**The Adams `STALE` label is dead.** Verified 2026-09-02: the `2024-2025`
reference sits in the **grading** section. The phone section carries no year.
Struck.

**Woods was never a `CONFLICT`.** Line 150 of this file already said Woods
lawfully exceeds the statute, then the table called it a conflict anyway.
`CONFLICT` was never a predeclared code — I introduced it after seeing results,
and `VARIANT` then vanished from the summary line even though STOP rule ①
keys on its percentage. Recoded to the predeclared taxonomy, one primary code
per row, legal adjudicability kept as a separate reviewed flag.

**The "90 seconds vs. 20 minutes" claim is dead.** The 20 minutes produced
zero rows under a different, failed protocol. Not equivalent tasks. Any timing
claim needs the same question, same starting point, both methods. Struck until
measured.

**Row 10 (`stpsb.org`) is out of population.** St. Tammany, not Jefferson.
Excluded from the tally.

## Repaired tally — 9 in-population rows, one primary code each

| # | Page | Primary | Flag |
|---|------|---------|------|
| 1 | `haynes` cell-phone-smartwatch-policy | `MATCH` | fills the blank: school bag, pocket banned |
| 2 | `ehret` policies-procedures | `MATCH` | quotes statute, blank left unfilled |
| 3 | `adams` policies-procedures | `VARIANT` | ⚠ **adjudicable** — see below |
| 4 | `woods` news/school-news | `VARIANT` | lawfully exceeds |
| 5 | `jpschools.org` …/online-policies | `STALE` | cites 2019-2021 procedures |
| 6 | `eastjefferson` policies-procedures | `MATCH` | links current handbook |
| 7 | `jeffersonvirtual` policies-procedures | `MATCH` | links current handbook |
| 8 | `jpschools.org/Page/2104` | `DEAD` | 404 |
| 9 | `jpschools.org/Page/452` | `DEAD` | 404 |

`MATCH 4 · VARIANT 2 (22%) · STALE 1 · SILENT 0 · DEAD 2`

**Rule ①** — `VARIANT` 22%, under the 40% floor. Does not fire.
**Rule ②** — needs ≥2 `STALE` or ≥3 actionable `VARIANT`. Has 1 and 2. **Does not fire.**
**Rule ③** — needs zero `STALE`. Has 1. Does not fire.
**Rule ④** — not all `MATCH`. Does not fire.

**No rule fires.** The ② GO called above was wrong, and it was wrong because
the tally that produced it double-counted Adams, invented a code, and rested
on two rows I had not actually read. Recording that plainly rather than
reaching for a rule that flatters the build.

## The one surviving adjudicable case

The handbook says **not on his person** and **properly stowed away**. It never
says *where*. Each school fills that blank:

- **Haynes** — "powered off and **placed in their school bag**." Fills it.
- **Woods** — surrender to a **cellphone box**. Exceeds it. Permitted.
- **Adams** — "turned **OFF/Shutdown and Not visible**." **A pocket passes.**

A phone in a pocket is *not visible* and *is on his person*. That is the only
row adjudicable against quoted text — and now it is **text against text**, the
district's own handbook against its school's page. No legal opinion required.
Drop every "violates state law" framing; it was never necessary and it was the
riskiest sentence in the file.

## The finding that actually survives: omission, not contradiction

The taxonomy asked *do restatements contradict the authority?* Repaired answer:
**mostly no.** One adjudicable variant out of nine. That is thin.

It measured the wrong thing. The handbook publishes material facts that school
pages simply **do not carry** — and `SILENT` was defined page-level ("no
mention anywhere"), so it could not count them.

Three material facts in the controlling document:

- **F1** — not on person, properly stowed away *(location undefined)* — line 608
- **F2** — the rule **does not apply** where an IEP, 504, or Individualized
  Health Plan requires the device — lines 622-623
- **F3** — devices confiscated during testing; being caught **invalidates the
  assessment** — line 616

| School | F1 | F2 | F3 |
|--------|----|----|----|
| Haynes | ✓ fills | ✗ | ✗ |
| Adams | ⚠ diverges | ✗ | ✗ |
| Ehret | ✓ defers | ✗ | ✗ |

Verified 2026-09-02 by direct fetch. Haynes does not even link the handbook.

**6 of 9 cells omitted. F2 and F3 are absent from every school page checked.**

A parent whose child runs a continuous glucose monitor on their phone cannot
learn from their school's page that the ban does not apply to them. Nobody is
wrong. The parent is still uninformed. That is a better product than the
contradiction was, and it runs on the refusal path already at the core of the
build — which is what rule ③ described.

## Pre-registered before extending the sample

Declared **now**, before counting more schools, so the threshold cannot be
tuned to the result the way the ② GO was:

> **GO on coverage** if, across 8 schools × 3 facts, **≥40% of cells are
> omitted** by the school page while the controlling handbook publishes them.
> **STOP** if <20% — the schools are already carrying the district's material
> facts and the product has no gap to close.

Current n=3: 67%. Not a decision. A prior.

## Method debts carried forward

- Sample is 9, not the 12 the protocol specified. Search order was not preserved.
  Any future sweep snapshots the query and the result list first.
- Ehret's F1/F2/F3 row is from the earlier sweep, not re-fetched during repair.
- One district. Nothing here generalizes past Jefferson Parish yet.
