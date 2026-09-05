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
