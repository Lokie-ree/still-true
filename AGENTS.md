<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Project state

Read [`docs/READINESS.md`](docs/READINESS.md) before changing anything under
`convex/`. It carries the open readiness flags with severities, the findings
that are already closed (do not re-flag them), and the deliberate simplifications
that are listed but not scored (do not "fix" them unasked). The fix order in it
is already decided.

[`README.md`](README.md) has what is built and what is not.
[`hackathon.md`](hackathon.md) is the dated build log, including reversals.

## Before you say it works

Run **`npm run gate`**. It is `npm run lint && npm test` followed by seven
read-only checks against production: the public surface is queries only, the
site serves the app, the board leaks nothing private, every published answer
carries a quote and a line number, the watch has swept inside 48 hours, no
document is failing its re-check, and every stored sender identity is a bare
address. Read-only and free — no mutation, no scrape, no model call — so there
is no reason not to have run it.

The re-check one reads the `documents` table with your credentials rather than
through a public query, so it covers PRIVATE forwarded documents too — the ones
the board cannot show and the ones most likely to be quietly broken.

A claim about production that the gate could have checked and you did not run is
not a claim, and this project has retracted two of them. If a check is not in
the gate, say "unverified" rather than implying otherwise, and name which
deployment (dev or prod) any command you ran was pointed at.

## Keeping this documentation current

These files are the project's own account of itself. **A PR that changes what
the project is or does updates them in the same PR** — not in a follow-up.

- **`docs/READINESS.md`** — when a flag is fixed, move it to *Closed* and
  re-derive the score line so the delta stays auditable. When an audit finds a
  new one, add it with a severity and a locus. Never delete a closed finding:
  the "do not re-flag" list is what stops the next session rediscovering it,
  and the "listed, not scored" list is what stops the next session "fixing" a
  deliberate simplification.
- **`README.md`** — the Status section, whenever a phase ships or a sentence in
  it stops being true.
- **`hackathon.md`** — a dated entry for the decision, including the reversals.
  The log's value is that it records what was wrong first.
- **This file** (and its twin), when any of the above move.

The test is not "is this a big change" — it is **would this PR make a sentence
in one of those files false?** If yes, the fix belongs in this PR.

This rule exists because the README spent three days claiming the watch was not
built, on a repository whose whole premise is that a claim without a current
receipt is not worth reading.

## Two PRs open at once WILL conflict, and it is the rule above's own doing

The docs-currency rule means every PR here touches the same two or three files.
Measured 2026-09-17: of the last 25 commits, **23 touched at least one of
`README.md`, `docs/READINESS.md` and `hackathon.md`, and 8 touched all
three.** Combine that with one-concern-per-PR and the collision is structural —
**any two branches cut from `main` at the same time conflict**, hardest at the
tail of `hackathon.md`, where both append a dated entry to the same last line.

**So keep one PR in flight at a time.** Merge the first, pull `main`, then cut
the second from it. That is the whole rule, and it costs nothing here because
these PRs are small and land the same day. Cutting both from `main` and hoping
the edits are far apart is not a third option — they never are, because both
entries land at EOF.

**Do NOT stack the second branch on the first.** It is the obvious fix, it is
what a merge conflict makes you want, and it has already cost this workflow
twice — a portfolio repo in 2026-07 and this one on 2026-09-07, where four PRs
all read MERGED and only one reached `main`. A PR based on an intermediate
branch merges cleanly **into that branch** and lands nothing, unless every base
is merged bottom-up *and* deleted so GitHub re-targets the children. A
`PreToolUse` hook blocks a non-`main` base for exactly this reason; when it
fires, the answer is to wait for the first PR, not to override it.

**What not to reach for: `merge=union` on `hackathon.md`.** It is the obvious
answer for an append-only log, and this log is not one — 3 of the last 12
commits to it deleted lines, one of them 14. Union resolves an overlap by
silently keeping both copies, with no marker and no failure, in the one file
whose entire job is to be an accurate record of what was true. **A conflict
that stops you is cheaper than a log that quietly says a thing twice.**

## The shoot, until it is shot

Five files, and they are not interchangeable:

- **`docs/shoot-card.md`** — the only thing that goes next to the camera. Order,
  the lines, one rule, and an `IF THIS HAPPENS` table. Keep it scannable; detail
  belongs elsewhere.
- **`docs/video-script.md`** — the full script and the reasoning behind each
  beat. **It has five sections that describe shoot mechanics** (the shoot order,
  beat C, the recording checklist, the things that will go wrong, and how to
  actually record it). A change to how a beat is shot has to reach all five;
  fixing one and leaving the others is the same second-renderer defect this
  project has logged twice, and undercounting the list at four is that defect
  a third time.
- **`docs/vo-script.md`** — the spoken words, derived from the card. A change
  to a card line has to reach it too.
- **`docs/rehearsal.md`** — the dated 09-10 to 09-12 schedule.
- **`docs/handoff-2026-09-10.md`** — the pre-shoot review, its §9 status block,
  and what only Randall can close.

**No deploy happens on shoot day.** The edit went out 2026-09-11 and the
11:17 UTC cron found it the next morning; the notice in the thread is the
receipt on any later day. `watch:sweep` is never run by hand,
because `watch:recheck` takes one `documentId` and the sweep fans out over
private forwards.
