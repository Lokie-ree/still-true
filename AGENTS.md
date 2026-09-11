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

## The shoot, until it is shot

Four files, and they are not interchangeable:

- **`docs/shoot-card.md`** — the only thing that goes next to the camera. Order,
  the lines, one rule, and an `IF THIS HAPPENS` table. Keep it scannable; detail
  belongs elsewhere.
- **`docs/video-script.md`** — the full script and the reasoning behind each
  beat. **It has four sections that describe shoot mechanics** (the shoot order,
  beat C, the recording checklist, the things that will go wrong). A change to
  how a beat is shot has to reach all four; fixing one and leaving the others is
  the same second-renderer defect this project has logged twice.
- **`docs/rehearsal.md`** — the dated 09-10 to 09-12 schedule.
- **`docs/handoff-2026-09-10.md`** — the pre-shoot review, its §9 status block,
  and what only Randall can close.

**No deploy happens on shoot day.** The fixture edit goes out the day before and
the 11:17 UTC cron finds it; `watch:sweep` is never run by hand, because
`watch:recheck` takes one `documentId` and the sweep fans out over private
forwards.
