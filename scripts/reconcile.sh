#!/usr/bin/env bash
# Reconcile what the documentation claims against what is actually true.
#
# `scripts/gate.mjs` asks production whether the SYSTEM still works. This asks
# whether the DOCUMENTS still describe it. Different failure mode entirely:
# nothing breaks, no test goes red, and a sentence quietly stops being true.
# That has happened to the README of this repository three times, and it is the
# one class of defect the gate structurally cannot catch — because the gate is
# itself one of the claims the README makes.
#
#   bash scripts/reconcile.sh          # writes docs/reconcile-report.md
#
# Read-only. Nothing here mutates, deploys, sends mail or calls a model. It
# shells out to the gate, git, gh and curl, and every finding carries the
# command that produced it, so a wrong label can be argued with rather than
# believed.
#
# Three verdicts, and the third one is the point:
#
#   CONFIRMED    — a command ran and the doc agrees with its output.
#   DRIFTED      — a command ran and the doc disagrees. Evidence attached.
#   UNVERIFIABLE — no command run here can settle it. This is NOT a soft pass
#                  and must never be read as one.
#
# Exits non-zero when anything DRIFTED, so it can gate a commit.
#
# ponytail: no framework, no config, no reporter. grep, curl, git and a
# markdown file. Reach for more when this has to run somewhere that reads JUnit.

set -uo pipefail
cd "$(dirname "$0")/.."

REPORT=docs/reconcile-report.md

# Two classes of document, and conflating them produces false drift.
#
# LIVE docs describe the present tense and must be true right now. LOG docs are
# dated records — hackathon.md says "66/66 tests" about an afternoon in
# September and is CORRECT to still say it. Reconciling a log against today
# would be reconciling history against the present, which is just vandalism.
LIVE="README.md AGENTS.md CLAUDE.md"
LOG="hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md"
DOCS="$LIVE $LOG"

confirmed=0; drifted=0; unverifiable=0
C_BODY=""; D_BODY=""; U_BODY=""

ok()  { confirmed=$((confirmed+1));         C_BODY+="- **$1**"$'\n'"  - ran: \`$2\`"$'\n'"  - got: $3"$'\n'; }
bad() { drifted=$((drifted+1));             D_BODY+="- **$1**"$'\n'"  - ran: \`$2\`"$'\n'"  - got: $3"$'\n'; }
huh() { unverifiable=$((unverifiable+1));   U_BODY+="- **$1**"$'\n'"  - ran: \`${2:-nothing that can settle it}\`"$'\n'"  - why: $3"$'\n'; }

# Whole file with newlines flattened, so a claim broken across a line wrap is
# still one claim. CLAUDE.md wraps "six\nread-only checks" and a line-based grep
# walks straight past it.
#
# Every file in this repository is CRLF (`.gitattributes` says `text=auto`).
# Dropping the CR is not cosmetic: without it the flattened text reads
# "six\r read-only checks" and matches nothing, which is a check that silently
# passes because it never ran. For the same reason the CR comes off the stream
# before every grep below — a link at end of line otherwise gets fetched with a
# carriage return stapled to it and reports as a network failure.
flat() { tr -d '\r' < "$1" | tr '\n' ' ' | tr -s ' '; }

# --------------------------------------------------------------- production --
# Delegated whole. The gate already asks production every question this repo
# claims an answer to; a second implementation would be a second thing to keep
# true, and the first thing this script would then get wrong.
section_production() {
  local out rc name verdict
  out=$(node scripts/gate.mjs 2>&1 | tr -d '\r'); rc=${PIPESTATUS[0]}
  if ! grep -qE '^ *(PASS|FAIL) ' <<<"$out"; then
    huh "docs claim a live production deployment at impressive-marten-163" \
        "node scripts/gate.mjs" \
        "the gate produced no check results at all (exit $rc). Production state is UNKNOWN, not fine:<br>\`$(head -c 300 <<<"$out" | tr '\n' ' ')\`"
    return
  fi
  verdict=""; name=""
  while IFS= read -r line; do
    if grep -qE '^ *(PASS|FAIL) ' <<<"$line"; then
      verdict=$(grep -oE 'PASS|FAIL' <<<"$line" | head -1)
      name=$(sed -E 's/^ *(PASS|FAIL) +//' <<<"$line")
    elif [ -n "$verdict" ]; then
      local detail; detail=$(sed 's/^ *//' <<<"$line")
      if [ "$verdict" = PASS ]; then
        ok "production claim: $name" "node scripts/gate.mjs" "$detail"
      else
        bad "production claim: $name" "node scripts/gate.mjs" "$detail"
      fi
      verdict=""
    fi
  done <<<"$out"
}

# ------------------------------------------------------------------- phases --
# "P4 — the watch: shipped" is a claim about git, not a claim about prose. A
# phase is shipped when a merged PR or a commit on main says so.
#
# Ranges are expanded: "P1–P3 … shipped" claims P1, P2 AND P3, and checking
# only the two endpoints would leave the middle silently unaudited.
section_phases() {
  local prs claimed n first last phase hit where
  prs=$(gh pr list --state merged --limit 100 --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null)
  if [ -z "$prs" ]; then
    huh "every 'shipped' / 'complete' phase claim" "gh pr list --state merged" \
        "gh returned nothing — not authenticated, or offline. Phases were NOT checked against merged PRs."
    return
  fi

  # Carries the doc through the range expansion. "P1–P3 … shipped" claims P2,
  # and a P2 finding that cannot say which sentence claimed it is not evidence.
  claimed=$(
    grep -oE 'P[0-9](\s*[–—-]\s*P?[0-9])?[^.]{0,120}(shipped|complete)' $DOCS 2>/dev/null | tr -d '\r' |
    while IFS=: read -r doc c; do
      first=$(grep -oE '^P[0-9]' <<<"$c" | tr -d 'P')
      last=$(grep -oE '^P[0-9]\s*[–—-]\s*P?[0-9]' <<<"$c" | grep -oE '[0-9]$')
      for ((n=first; n<=${last:-$first}; n++)); do
        echo "P$n|$doc|$(cut -c1-60 <<<"$c")"
      done
    done | sort -u -t'|' -k1,1
  )
  if [ -z "$claimed" ]; then
    huh "phase-complete claims" "grep -oE 'P[0-9].*(shipped|complete)' \$DOCS" \
        "no doc makes a phase-complete claim in a shape this script recognises"
    return
  fi

  while IFS='|' read -r phase doc where; do
    [ -z "$phase" ] && continue
    where="$doc — \"$where…\""
    hit=$(grep -E "^#[0-9]+ $phase[:. ]" <<<"$prs" | head -1)
    [ -z "$hit" ] && hit=$(git log --oneline --grep="$phase" main 2>/dev/null | head -1)
    if [ -n "$hit" ]; then
      ok "$phase claimed shipped — $where" \
         "gh pr list --state merged --json number,title | grep '$phase'" "$hit"
    else
      bad "$phase claimed shipped — $where" \
          "gh pr list --state merged --json number,title | grep '$phase'" \
          "no merged PR and no commit on main names $phase"
    fi
  done <<<"$claimed"
}

# -------------------------------------------------------------------- links --
# Every link in every doc, local and remote. A dead link in a receipt is the
# receipt failing, which on this project is the entire product.
slug() { tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9 -]//g; s/ +/-/g'; }

section_links() {
  local src raw target file anchor code cand
  while IFS='|' read -r src raw; do
    # `]` must lead the bracket expression or it closes it, and a URL that keeps
    # a trailing `**` off the end of bold markup gets fetched as written.
    target=$(sed -E 's/[].,*)]+$//' <<<"$raw")
    [ -z "$target" ] && continue
    case "$target" in
      http://127.0.0.1*|http://localhost*|*example.com*)
        huh "link in $src → $target" "" \
            "an illustrative address, not a live resource. Deliberately not fetched; whether it is 'correct' is not a question a request can answer."
        continue ;;
      *…*|*...*)
        huh "link in $src → $target" "" \
            "the URL is elided in the prose (contains an ellipsis), so it cannot be fetched as written"
        continue ;;
    esac

    if [[ "$target" == http* ]]; then
      # HEAD first. A GET on the CMS Summary of Benefits downloads the whole PDF
      # to /dev/null, which turned the first run of this script into a five
      # minute wait for information a header already carried. Plenty of hosts
      # refuse HEAD, so fall back to a GET of the first kilobyte, never the file.
      code=$(curl -sS -L -I -o /dev/null -w '%{http_code}' --max-time 20 "$target" 2>/dev/null)
      if [ -z "$code" ] || [ "$code" = "000" ] || [ "$code" -ge 400 ]; then
        code=$(curl -sS -L -r 0-1023 -o /dev/null -w '%{http_code}' --max-time 25 "$target" 2>/dev/null)
      fi
      if [ -z "$code" ] || [ "$code" = "000" ]; then
        huh "link in $src → $target" "curl -sL -o /dev/null -w '%{http_code}' '$target'" \
            "no HTTP response — DNS, TLS or timeout. That is a network failure here, NOT evidence the link is dead."
      elif [ "$code" -ge 400 ]; then
        bad "link in $src → $target" "curl -sL -o /dev/null -w '%{http_code}' '$target'" "HTTP $code"
      else
        ok "link in $src → $target" "curl -sL -o /dev/null -w '%{http_code}' '$target'" "HTTP $code"
      fi
      continue
    fi

    # Local path. Resolve against the doc that carries it, then against the
    # repo root. No realpath — Git Bash cannot be relied on to have it.
    file=$(cut -d'#' -f1 <<<"$target"); anchor=$(cut -s -d'#' -f2 <<<"$target")
    [ -z "$file" ] && continue
    cand=""
    for try in "$(dirname "$src")/$file" "$file"; do
      try=$(sed -E 's#/[^/]+/\.\./#/#g; s#^\./##' <<<"$try")
      [ -e "$try" ] && { cand="$try"; break; }
    done
    if [ -z "$cand" ]; then
      bad "link in $src → $target" "test -e '$(dirname "$src")/$file'" "no such file — the link points at nothing"
    elif [ -n "$anchor" ]; then
      if grep -E '^#+ ' "$cand" | tr -d '\r' | sed -E 's/^#+ *//' | slug | grep -qx "$anchor"; then
        ok "link in $src → $target" "grep '^#' $cand | slug" "a heading slugs to '#$anchor'"
      else
        bad "link in $src → $target" "grep '^#' $cand | slug" "$cand exists, but no heading in it slugs to '#$anchor'"
      fi
    else
      ok "link in $src → $target" "test -e $cand" "$cand exists"
    fi
  done < <(
    for d in $DOCS; do
      [ -f "$d" ] || continue
      # CR comes off the stream BEFORE grep. Putting `\r` inside the bracket
      # instead would be read by POSIX ERE as "not a backslash and not the
      # letter r", which quietly truncates every URL containing an r.
      tr -d '\r' < "$d" | grep -ohE '\]\([^) ]+\)' | sed 's/^](//; s/)$//' | sed "s|^|$d\||"
      tr -d '\r' < "$d" | grep -ohE 'https?://[^ )>`"]+' | sed "s|^|$d\||"
    done | sort -u
  )
}

# ---------------------------------------------------------------- staleness --
# A doc labelled Superseded / Archived / Historical is making a claim about
# time. Check it against git log, not against the banner's own say-so.
section_staleness() {
  local f label last banner_date
  for f in $DOCS; do
    [ -f "$f" ] || continue
    label=$(grep -m1 -iE '^> *\*\*(superseded|archived|stale|historical|deprecated)' "$f" | tr -d '\r')
    [ -z "$label" ] && continue
    last=$(git log -1 --format=%cI -- "$f" 2>/dev/null)
    banner_date=$(grep -m1 -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' <<<"$(head -12 "$f")")
    if [ -z "$last" ]; then
      huh "$f carries a superseded/archived banner" "git log -1 --format=%cI -- $f" \
          "the file is untracked, so there is no commit date to check the banner against"
    else
      ok "$f carries a superseded/archived banner" "git log -1 --format=%cI -- $f" \
         "banner asserts ${banner_date:-no date}; git says last touched ${last%T*}. Label is dated, not vibes."
    fi
  done
}

# ---------------------------------------------------------------- citations --
# `convex/mail.ts:575` claims specific code sits at a specific line, and it is
# the claim most likely to rot in silence: every edit above it moves the target
# and absolutely nothing complains.
#
# Checked by proximity rather than by faith. The other backticked code tokens
# in the same sentence must appear within a few lines of the cited number. When
# none of them do, the report says where they actually live, so the fix is a
# lookup rather than an investigation.
#
# The corroborating token is the RAREST one, not the first one. `attach` occurs
# 31 times in mail.ts, so "is `attach` near line 689?" is always yes and the
# check confirms every citation put in front of it — which it did, twice, on the
# first run of this script. `.take(100)` occurs once. Rarity is specificity.
#
# A citation in a DATED LOG ENTRY points into the tree as it stood that day, and
# every commit since has moved it. That is not drift, it is what a log is, so
# hackathon.md is reported UNVERIFIABLE rather than wrong. The exception is the
# open-flags half of READINESS.md: those are present-tense claims about code
# somebody is being sent to go and fix, and a wrong line number there costs a
# reader real time.
NEAR=10   # lines. A citation is a pointer to a neighbourhood, not to a byte.

# Present-tense for citation purposes: the LIVE docs, plus everything in
# READINESS.md above `## Closed`.
present_tense() {
  local src=$1 lineno=$2 closed
  case " $LIVE " in *" $src "*) return 0 ;; esac
  if [ "$src" = docs/READINESS.md ]; then
    closed=$(grep -n '^## Closed' "$src" | head -1 | cut -d: -f1)
    [ -n "$closed" ] && [ "$lineno" -lt "$closed" ] && return 0
  fi
  return 1
}

section_citations() {
  local src lineno rest prose cite path line tokens tok n best bestn at dist resolved
  while IFS=: read -r src lineno rest; do
    # A bullet wraps, and the token that corroborates the number is routinely on
    # the next line of prose. Read to the end of the paragraph, stopping before
    # the next bullet so tokens cannot bleed in from a neighbouring finding.
    prose=$(sed -n "${lineno},$((lineno+4))p" "$src" | tr -d '\r' |
            awk 'NR==1{print;next} /^[[:space:]]*$/||/^- /||/^#/{exit} {print}')
    for cite in $(grep -oE '`[A-Za-z0-9_./-]+\.(ts|tsx|mjs|json):[0-9]+`' <<<"$rest" | tr -d '`'); do
      path=${cite%:*}; line=${cite##*:}
      # `mail.ts:289` means convex/mail.ts. Resolve a bare filename against the
      # tracked tree rather than reporting the doc wrong for being informal.
      resolved=""
      if [ -f "$path" ]; then
        resolved="$path"
      else
        mapfile -t cands < <(git ls-files | grep -E "(^|/)$(basename "$path")$")
        if [ "${#cands[@]}" -eq 1 ]; then
          resolved="${cands[0]}"
        elif [ "${#cands[@]}" -eq 0 ]; then
          bad "$src:$lineno cites \`$cite\`" "git ls-files | grep '/$(basename "$path")\$'" \
              "no file by that name is tracked anywhere in the repository"
          continue
        else
          huh "$src:$lineno cites \`$cite\`" "git ls-files | grep '/$(basename "$path")\$'" \
              "the bare filename matches ${#cands[@]} tracked files (${cands[*]}) — which one is meant cannot be determined mechanically"
          continue
        fi
      fi
      if [ "$line" -gt "$(wc -l < "$resolved")" ]; then
        bad "$src:$lineno cites \`$cite\`" "wc -l $resolved" "$resolved has only $(wc -l < "$resolved") lines"
        continue
      fi

      # Tokens that actually occur in the file, ranked rarest first.
      best=""; bestn=0
      while IFS= read -r tok; do
        [ -z "$tok" ] && continue
        n=$(grep -cF -- "$tok" "$resolved" 2>/dev/null)
        [ "${n:-0}" -eq 0 ] && continue
        if [ -z "$best" ] || [ "$n" -lt "$bestn" ]; then best="$tok"; bestn="$n"; fi
      done < <(grep -oE '`[^`]+`' <<<"$prose" | tr -d '`' | grep -vF "$path" | grep -vE '^ *$' | sort -u)

      if [ -z "$best" ]; then
        huh "$src:$lineno cites \`$cite\`" "sed -n '${line}p' $resolved" \
            "the line exists, but nothing else in that sentence names code found in the file, so the LINE NUMBER itself is unchecked. The citation is neither confirmed nor refuted."
        continue
      fi

      # Nearest occurrence of the rarest token to the line actually cited.
      dist=""; at=""
      while IFS= read -r n; do
        local d=$(( n > line ? n - line : line - n ))
        if [ -z "$dist" ] || [ "$d" -lt "$dist" ]; then dist="$d"; at="$n"; fi
      done < <(grep -nF -- "$best" "$resolved" | cut -d: -f1)

      if [ "$dist" -le "$NEAR" ]; then
        ok "$src:$lineno cites \`$cite\`" "grep -nF '$best' $resolved" \
           "\`$best\` (rarest token, $bestn occurrence(s)) is at L$at, $dist line(s) from the cited L$line — the citation points at the right code"
      elif present_tense "$src" "$lineno"; then
        bad "$src:$lineno cites \`$cite\`" "grep -nF '$best' $resolved" \
            "\`$best\` (rarest token, $bestn occurrence(s)) is at **L$at**, $dist lines from the cited L$line. The citation points at unrelated code; the locus it describes is L$at."
      else
        huh "$src:$lineno cites \`$cite\`" "grep -nF '$best' $resolved" \
            "\`$best\` is at L$at, $dist lines from the cited L$line — but this is a dated log entry, and a line number in one points into the tree as it stood that day. Whether it was right when written cannot be settled by reading today's file, and rewriting it would falsify the record."
      fi
    done
  done < <(grep -nE '`[A-Za-z0-9_./-]+\.(ts|tsx|mjs|json):[0-9]+`' $DOCS 2>/dev/null | tr -d '\r')
}

# ------------------------------------------------------------------ orphans --
# A doc nothing links to is a doc nobody reads and nobody updates. README,
# CLAUDE.md and AGENTS.md are entry points reached from outside the set.
section_orphans() {
  local links f base
  links=$(for d in $DOCS; do [ -f "$d" ] && tr -d '\r' < "$d" | grep -ohE '\]\([^) ]+\)'; done |
          sed 's/^](//; s/)$//; s/#.*//; s|.*/||' | sort -u)
  for f in $DOCS; do
    [ -f "$f" ] || continue
    case " $LIVE " in *" $f "*) continue ;; esac
    base=$(basename "$f")
    if grep -qxF "$base" <<<"$links"; then
      ok "$f is reachable" "grep -l '($base)' $DOCS" "at least one doc links to it"
    else
      bad "$f is orphaned" "grep -l '($base)' $DOCS" \
          "no doc in the set links to it — it will not be found, and will not be maintained"
    fi
  done
}

# ------------------------------------------------------------------- counts --
# The docs count things that can be counted: gate checks and tests. A countable
# number does not get to be prose.
#
# Only the LIVE docs are reconciled. hackathon.md and READINESS.md record what
# was true on a dated afternoon and are correct to keep saying it.
section_counts() {
  local f text claimed actual tout tcount
  actual=$(grep -cE '^check\(' scripts/gate.mjs)

  for f in $LIVE; do
    [ -f "$f" ] || continue
    text=$(flat "$f")
    while IFS= read -r m; do
      [ -z "$m" ] && continue
      claimed=$(grep -oiE '^[a-z0-9]+' <<<"$m")
      case "$(tr '[:upper:]' '[:lower:]' <<<"$claimed")" in
        one) claimed=1;; two) claimed=2;; three) claimed=3;; four) claimed=4;; five) claimed=5;;
        six) claimed=6;; seven) claimed=7;; eight) claimed=8;; nine) claimed=9;; ten) claimed=10;;
      esac
      if [ "$claimed" = "$actual" ]; then
        ok "$f says \"$m\"" "grep -c '^check(' scripts/gate.mjs" "gate.mjs defines $actual"
      else
        bad "$f says \"$m\"" "grep -c '^check(' scripts/gate.mjs" \
            "gate.mjs defines $actual checks, not $claimed"
      fi
    done < <(grep -oiE '(one|two|three|four|five|six|seven|eight|nine|ten|[0-9]+) read-only checks' <<<"$text")
  done

  tout=$(npm test 2>&1); tcount=$(grep -oE '^# tests [0-9]+' <<<"$tout" | grep -oE '[0-9]+' | head -1)
  if [ -z "$tcount" ]; then
    huh "docs that state a test count" "npm test" "the suite reported no total — the claim cannot be checked"
  else
    for f in $LIVE; do
      [ -f "$f" ] || continue
      while IFS= read -r m; do
        [ -z "$m" ] && continue
        claimed=$(grep -oE '[0-9]+' <<<"$m" | head -1)
        if [ "$claimed" = "$tcount" ]; then
          ok "$f says \"$m\"" "npm test" "the suite reports $tcount"
        else
          bad "$f says \"$m\"" "npm test" "the suite reports $tcount tests, not $claimed"
        fi
      done < <(grep -oE '[0-9]+ tests' <<<"$(flat "$f")")
    done
  fi

  huh "dated counts inside hackathon.md and docs/READINESS.md" "" \
      "log entries record what was true on a named date (\"66/66 tests\", \"five board rows\"). They are deliberately NOT reconciled against today — a record of the past is not drift, and rewriting one would destroy the thing it is for."
}

# --------------------------------------------------------------------- main --
echo "reconcile: checking the documentation against the world it describes"
for s in production phases links staleness citations orphans counts; do
  echo "  · $s"
  "section_$s"
done

{
  echo "# Reconciliation report"
  echo
  echo "Generated \`$(date -u '+%Y-%m-%d %H:%M UTC')\` by \`bash scripts/reconcile.sh\`, at commit \`$(git rev-parse --short HEAD)\`."
  echo
  echo "Every finding names the command that produced it. **UNVERIFIABLE is not a soft"
  echo "pass.** It means no command run here can settle the claim, and it should be read"
  echo "as an open question rather than a clean bill of health."
  echo
  echo "What this cannot do, stated so a reader can discount it:"
  echo
  echo "- A **line-number** finding is decided by the rarest backticked token in the same"
  echo "  sentence. When one sentence describes two places in one file, that token may"
  echo "  belong to the other clause, and the verdict can be right while the evidence"
  echo "  quoted beside it is not. Read the \`grep -nF\` output before acting on one."
  echo "- A link is checked for a **status code**, not for saying what the doc says it"
  echo "  says. HTTP 200 is not agreement."
  echo "- Only \`README.md\`, \`AGENTS.md\`, \`CLAUDE.md\` and the open-flags half of"
  echo "  \`docs/READINESS.md\` are held to the present tense. Dated log entries are"
  echo "  records, and a record of the past is not drift."
  echo
  echo "| verdict | count |"
  echo "|---|---|"
  echo "| CONFIRMED | $confirmed |"
  echo "| DRIFTED | $drifted |"
  echo "| UNVERIFIABLE | $unverifiable |"
  echo
  echo "## DRIFTED — a command ran and the doc disagrees with it"
  echo
  if [ -n "$D_BODY" ]; then printf '%s\n' "$D_BODY"; else echo "_Nothing._"; fi
  echo
  echo "## UNVERIFIABLE — no command run here can settle it"
  echo
  if [ -n "$U_BODY" ]; then printf '%s\n' "$U_BODY"; else echo "_Nothing._"; fi
  echo
  echo "## CONFIRMED — a command ran and the doc agrees with it"
  echo
  if [ -n "$C_BODY" ]; then printf '%s\n' "$C_BODY"; else echo "_Nothing._"; fi
} > "$REPORT"

echo
echo "CONFIRMED $confirmed   DRIFTED $drifted   UNVERIFIABLE $unverifiable   → $REPORT"
[ "$drifted" -eq 0 ]
