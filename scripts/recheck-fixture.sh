#!/usr/bin/env bash
#
# Re-check the video fixture on production. One document.
#
# This exists because the command it wraps is 200 characters of JSON with an em
# dash in it, and on 2026-09-11 a paste of it broke across two lines: bash ran
# `npx convex run watch:recheck` with no arguments, Convex rejected `{}`, and
# the rest of the line was executed as a command name. Nothing was consumed and
# nothing was harmed, but it is the recovery command for beat C and it may be
# run at six in the morning on shoot day with adrenaline. So it is one word now.
#
# NEVER `watch:sweep`. Sweep re-reads every url-backed document in the
# deployment, private forwards included — `watchable` filters on `url !== null`,
# not on `isPublic`. `recheck` is what sweep enqueues per document anyway, so it
# walks the same `readAndPublish` path with none of the fan-out.
#
# The TITLE is an input to the classifier, not a label: `readAndPublish` calls
# `classify(args.title, lines)`. Change it and `kind` can re-roll from `other`
# to `lease`, at which point `diff` finds no prior question to compare and
# reports nothing — silence indistinguishable from a broken watch. The values
# below were read from production on 2026-09-11; the heredoc is quoted so the
# shell expands nothing, and `.gitattributes` pins this file to LF so no `\r`
# can reach the title.
#
# Writes to production: it scrapes, extracts, and mails if a quoted clause moved.
set -euo pipefail

ARGS=$(cat <<'JSON'
{"documentId":"jh7cnrw0gq81wxgfke2d8xk3x58e3vfk","url":"https://impressive-marten-163.convex.site/watch-test/lease.html","title":"Lease they sent over — what am I agreeing to?"}
JSON
)

if [ "${1-}" = "--dry-run" ]; then
  printf '%s\n' "$ARGS"
  exit 0
fi

npx convex run watch:recheck "$ARGS" --prod
