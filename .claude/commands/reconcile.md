---
description: Reconcile the docs against live state, fix the drift, and open a PR
allowed-tools: Bash, Read, Edit, Glob, Grep
---

# /reconcile

Run `scripts/reconcile.sh`, fix what it proves wrong, and open a PR. **Never
commit to `main`.**

## 1. Measure before touching anything

```sh
bash scripts/reconcile.sh
```

It writes `docs/reconcile-report.md` and exits non-zero when anything DRIFTED.
Read the report. If DRIFTED is 0, say so, stop, and do not open a PR — there is
nothing to reconcile and an empty PR is noise.

## 2. Branch first

```sh
git checkout -b chore/reconcile-docs-$(date -u +%Y%m%d)
```

Branch before the first edit, not after.

## 3. Fix only what the report proves

One rule, and it is the whole point of the command: **the report's evidence is
the authority, not your reading of the docs.**

- **DRIFTED** → fix it. The doc is wrong; the command output is right. Change
  the doc to match the evidence quoted in the finding.
- **UNVERIFIABLE** → change nothing. It is an open question, not a defect. If
  the same item is unverifiable on a second run, add one line to
  `docs/READINESS.md` under *Coverage — what the audit could not see* saying
  what cannot be checked and why.
- **CONFIRMED** → leave it alone.

Two things you must not do:

- Do not "fix" a dated entry in `hackathon.md` or a closed finding in
  `docs/READINESS.md`. Those are records of what was true on a named day. The
  script already excludes them; if you find yourself editing one, you have gone
  past the report.
- Do not fix the code to match the doc. This command reconciles docs to
  reality. If the report shows production is wrong, that is a bug, not drift —
  report it and stop.

Adjust a claim to what the evidence says, and keep the sentence's voice. A
count moving from six to seven is a one-word edit, not a rewrite.

## 4. Re-run, and let it prove the fix

```sh
bash scripts/reconcile.sh
```

DRIFTED must be lower than it was. If a finding survives your edit, the edit
was wrong — do not argue with it in the PR body.

## 5. Keep the docs' own rule

`CLAUDE.md` requires that a PR changing what the project is or does updates
`README.md`, `docs/READINESS.md` and `hackathon.md` in the same PR. This
command's PR usually IS that update, but it still needs a dated entry in
`hackathon.md` recording what had drifted and how it was found — the log's
value is that it records what was wrong first.

## 6. Commit, push, PR

Commit in single-concern chunks (the doc fixes; the regenerated report). Then:

```sh
git push -u origin HEAD
gh pr create --title 'chore: reconcile docs with live state' --body '...'
```

The PR body must carry, for each fix, the command output that proved the doc
wrong — copied from the report, not paraphrased. A reconciliation PR that
asserts rather than quotes has reproduced the exact problem it exists to fix.

State the before/after counts (`CONFIRMED / DRIFTED / UNVERIFIABLE`) at the top,
and list what stayed UNVERIFIABLE so the reader knows what this PR did *not*
settle.
