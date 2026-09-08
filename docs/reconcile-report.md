# Reconciliation report

Generated `2026-09-08 19:21 UTC` by `bash scripts/reconcile.sh`, at commit `2f4f177`.

Every finding names the command that produced it. **UNVERIFIABLE is not a soft
pass.** It means no command run here can settle the claim, and it should be read
as an open question rather than a clean bill of health.

What this cannot do, stated so a reader can discount it:

- A **line-number** finding is decided by the rarest backticked token in the same
  sentence. When one sentence describes two places in one file, that token may
  belong to the other clause, and the verdict can be right while the evidence
  quoted beside it is not. Read the `grep -nF` output before acting on one.
- A link is checked for a **status code**, not for saying what the doc says it
  says. HTTP 200 is not agreement.
- Only `README.md`, `AGENTS.md`, `CLAUDE.md` and the open-flags half of
  `docs/READINESS.md` are held to the present tense. Dated log entries are
  records, and a record of the past is not drift.

| verdict | count |
|---|---|
| CONFIRMED | 62 |
| DRIFTED | 8 |
| UNVERIFIABLE | 9 |

## DRIFTED — a command ran and the doc disagrees with it

- **docs/READINESS.md:99 cites `convex/mail.ts:575`**
  - ran: `grep -nF 'by_url' convex/mail.ts`
  - got: `by_url` (rarest token, 1 occurrence(s)) is at **L769**, 194 lines from the cited L575. The citation points at unrelated code; the locus it describes is L769.
- **docs/READINESS.md:112 cites `convex/mail.ts:222`**
  - ran: `grep -nF 'console.error' convex/mail.ts`
  - got: `console.error` (rarest token, 1 occurrence(s)) is at **L326**, 104 lines from the cited L222. The citation points at unrelated code; the locus it describes is L326.
- **docs/READINESS.md:115 cites `convex/mail.ts:689`**
  - ran: `grep -nF '.take(100)' convex/mail.ts`
  - got: `.take(100)` (rarest token, 1 occurrence(s)) is at **L894**, 205 lines from the cited L689. The citation points at unrelated code; the locus it describes is L894.
- **docs/probe-universal.md is orphaned**
  - ran: `grep -l '(probe-universal.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: no doc in the set links to it — it will not be found, and will not be maintained
- **README.md says "six read-only checks"**
  - ran: `grep -c '^check(' scripts/gate.mjs`
  - got: gate.mjs defines 7 checks, not 6
- **AGENTS.md says "six read-only checks"**
  - ran: `grep -c '^check(' scripts/gate.mjs`
  - got: gate.mjs defines 7 checks, not 6
- **CLAUDE.md says "six read-only checks"**
  - ran: `grep -c '^check(' scripts/gate.mjs`
  - got: gate.mjs defines 7 checks, not 6
- **README.md says "80 tests"**
  - ran: `npm test`
  - got: the suite reports 91 tests, not 80


## UNVERIFIABLE — no command run here can settle it

- **link in docs/probe-universal.md → https://www.healthcare.gov/sbc-glossary/#deductible**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.healthcare.gov/sbc-glossary/#deductible'`
  - why: no HTTP response — DNS, TLS or timeout. That is a network failure here, NOT evidence the link is dead.
- **link in docs/transcript-sbc.md → https://www.google.com/url?q=https://www.cms.gov/cciio/.../english-sample-completed-sbc-accessible-format-012825.pdf&source=gmail&ust=...&sa=E**
  - ran: `nothing that can settle it`
  - why: the URL is elided in the prose (contains an ellipsis), so it cannot be fetched as written
- **link in hackathon.md → http://127.0.0.1:3210**
  - ran: `nothing that can settle it`
  - why: an illustrative address, not a live resource. Deliberately not fetched; whether it is 'correct' is not a question a request can answer.
- **link in hackathon.md → https://www.att.com/howtocancel**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.att.com/howtocancel'`
  - why: no HTTP response — DNS, TLS or timeout. That is a network failure here, NOT evidence the link is dead.
- **link in hackathon.md → https://www.google.com/url?q=https://www.spotify.com/us/legal/end-user-agreement/&source=gmail&ust=…**
  - ran: `nothing that can settle it`
  - why: the URL is elided in the prose (contains an ellipsis), so it cannot be fetched as written
- **link in README.md → https://example.com/terms**
  - ran: `nothing that can settle it`
  - why: an illustrative address, not a live resource. Deliberately not fetched; whether it is 'correct' is not a question a request can answer.
- **hackathon.md:1290 cites `mail.ts:289`**
  - ran: `grep -nF 'reply-all' convex/mail.ts`
  - why: `reply-all` is at L179, 110 lines from the cited L289 — but this is a dated log entry, and a line number in one points into the tree as it stood that day. Whether it was right when written cannot be settled by reading today's file, and rewriting it would falsify the record.
- **hackathon.md:1556 cites `mail.ts:367`**
  - ran: `sed -n '367p' convex/mail.ts`
  - why: the line exists, but nothing else in that sentence names code found in the file, so the LINE NUMBER itself is unchecked. The citation is neither confirmed nor refuted.
- **dated counts inside hackathon.md and docs/READINESS.md**
  - ran: `nothing that can settle it`
  - why: log entries record what was true on a named date ("66/66 tests", "five board rows"). They are deliberately NOT reconciled against today — a record of the past is not drift, and rewriting one would destroy the thing it is for.


## CONFIRMED — a command ran and the doc agrees with it

- **production claim: prod exposes only read-only queries**
  - ran: `node scripts/gate.mjs`
  - got: 17 functions, 2 public, all queries
- **production claim: the site serves the app document**
  - ran: `node scripts/gate.mjs`
  - got: HTTP 200, 2591 bytes, bundle referenced
- **production claim: the public board returns only public documents**
  - ran: `node scripts/gate.mjs`
  - got: 6 documents, all isPublic
- **production claim: every published answer carries its quote**
  - ran: `node scripts/gate.mjs`
  - got: 36 answered findings, all quoted with a line number
- **production claim: the watch has swept recently**
  - ran: `node scripts/gate.mjs`
  - got: last sweep 0.6h ago, 6 documents stamped
- **production claim: no document is failing its re-check**
  - ran: `node scripts/gate.mjs`
  - got: 10 documents, none carrying a watch error
- **production claim: every sender identity is a bare address**
  - ran: `node scripts/gate.mjs`
  - got: 10 threads, 1 distinct senders, all bare addresses
- **P1 claimed shipped — README.md — "P1–P3 — the inbox, the parser, the extractor and the cit…"**
  - ran: `gh pr list --state merged --json number,title | grep 'P1'`
  - got: #13 P1: the front door — forwarded mail becomes a cited-ready document
- **P2 claimed shipped — README.md — "P1–P3 — the inbox, the parser, the extractor and the cit…"**
  - ran: `gh pr list --state merged --json number,title | grep 'P2'`
  - got: #14 P2: the extractor — one line, one answer, and the STOP gate it passed
- **P3 claimed shipped — README.md — "P1–P3 — the inbox, the parser, the extractor and the cit…"**
  - ran: `gh pr list --state merged --json number,title | grep 'P3'`
  - got: #17 P3: the cited reply, the provenance gate, and the clause-level receipt
- **P4 claimed shipped — README.md — "P4 — the watch:** shipped…"**
  - ran: `gh pr list --state merged --json number,title | grep 'P4'`
  - got: #21 P4: the watch
- **P5 claimed shipped — README.md — "P5 — the CC reply:** shipped…"**
  - ran: `gh pr list --state merged --json number,title | grep 'P5'`
  - got: #32 P5: the CC reply, and an audience for everything else
- **link in AGENTS.md → docs/READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in AGENTS.md → hackathon.md**
  - ran: `test -e hackathon.md`
  - got: hackathon.md exists
- **link in AGENTS.md → https://convex.dev**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://convex.dev'`
  - got: HTTP 200
- **link in AGENTS.md → README.md**
  - ran: `test -e README.md`
  - got: README.md exists
- **link in CLAUDE.md → docs/READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in CLAUDE.md → hackathon.md**
  - ran: `test -e hackathon.md`
  - got: hackathon.md exists
- **link in CLAUDE.md → https://convex.dev**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://convex.dev'`
  - got: HTTP 200
- **link in CLAUDE.md → README.md**
  - ran: `test -e README.md`
  - got: README.md exists
- **link in docs/ASSESSMENT.md → ../README.md**
  - ran: `test -e docs/../README.md`
  - got: docs/../README.md exists
- **link in docs/ASSESSMENT.md → https://blog.greatschools.org/2025/12/09/new-national-survey-finds-parents-want-clearer-school-information-and-are-more-satisfied-when-they-can-find-it/**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://blog.greatschools.org/2025/12/09/new-national-survey-finds-parents-want-clearer-school-information-and-are-more-satisfied-when-they-can-find-it/'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://impressive-marten-163.convex.site**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://impressive-marten-163.convex.site'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://luma.com/convex-allgas-hackathon**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://luma.com/convex-allgas-hackathon'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://provo.edu/policies-procedures-forms/policy-7150-p1-district-website-content-auditing-procedure/**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://provo.edu/policies-procedures-forms/policy-7150-p1-district-website-content-auditing-procedure/'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://vibeapps.dev/md/attest.md**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://vibeapps.dev/md/attest.md'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://vibeapps.dev/md/noticeproof.md**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://vibeapps.dev/md/noticeproof.md'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://vibeapps.dev/md/recourse.md**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://vibeapps.dev/md/recourse.md'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://vibeapps.dev/md/tableforall.md**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://vibeapps.dev/md/tableforall.md'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → https://www.legis.la.gov/Legis/Law.aspx?d=80350**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.legis.la.gov/Legis/Law.aspx?d=80350'`
  - got: HTTP 200
- **link in docs/ASSESSMENT.md → READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in docs/READINESS.md → https://www.paypal.com/us/legalhub/useragreement-full**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.paypal.com/us/legalhub/useragreement-full'`
  - got: HTTP 200
- **link in docs/READINESS.md → transcript-sbc.md**
  - ran: `test -e docs/transcript-sbc.md`
  - got: docs/transcript-sbc.md exists
- **link in docs/round-trip.md → https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf'`
  - got: HTTP 200
- **link in docs/transcript-sbc.md → ../hackathon.md**
  - ran: `test -e docs/../hackathon.md`
  - got: docs/../hackathon.md exists
- **link in docs/transcript-sbc.md → https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf'`
  - got: HTTP 200
- **link in docs/transcript-sbc.md → READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in docs/transcript-sbc.md → round-trip.md**
  - ran: `test -e docs/round-trip.md`
  - got: docs/round-trip.md exists
- **link in hackathon.md → docs/READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in hackathon.md → docs/round-trip.md**
  - ran: `test -e docs/round-trip.md`
  - got: docs/round-trip.md exists
- **link in hackathon.md → docs/transcript-sbc.md**
  - ran: `test -e docs/transcript-sbc.md`
  - got: docs/transcript-sbc.md exists
- **link in hackathon.md → https://github.com/Lokie-ree/still-true**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://github.com/Lokie-ree/still-true'`
  - got: HTTP 200
- **link in hackathon.md → https://impressive-marten-163.convex.site**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://impressive-marten-163.convex.site'`
  - got: HTTP 200
- **link in hackathon.md → https://vibeapps.dev/s/still-true**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://vibeapps.dev/s/still-true'`
  - got: HTTP 200
- **link in README.md → convex/lines.ts**
  - ran: `test -e convex/lines.ts`
  - got: convex/lines.ts exists
- **link in README.md → docs/ASSESSMENT.md**
  - ran: `test -e docs/ASSESSMENT.md`
  - got: docs/ASSESSMENT.md exists
- **link in README.md → docs/probe.md**
  - ran: `test -e docs/probe.md`
  - got: docs/probe.md exists
- **link in README.md → docs/probe-v3.md**
  - ran: `test -e docs/probe-v3.md`
  - got: docs/probe-v3.md exists
- **link in README.md → docs/READINESS.md**
  - ran: `test -e docs/READINESS.md`
  - got: docs/READINESS.md exists
- **link in README.md → docs/round-trip.md**
  - ran: `test -e docs/round-trip.md`
  - got: docs/round-trip.md exists
- **link in README.md → docs/transcript-sbc.md**
  - ran: `test -e docs/transcript-sbc.md`
  - got: docs/transcript-sbc.md exists
- **link in README.md → hackathon.md**
  - ran: `test -e hackathon.md`
  - got: hackathon.md exists
- **link in README.md → https://impressive-marten-163.convex.site**
  - ran: `curl -sL -o /dev/null -w '%{http_code}' 'https://impressive-marten-163.convex.site'`
  - got: HTTP 200
- **docs/ASSESSMENT.md carries a superseded/archived banner**
  - ran: `git log -1 --format=%cI -- docs/ASSESSMENT.md`
  - got: banner asserts 2026-09-02; git says last touched 2026-09-05. Label is dated, not vibes.
- **docs/READINESS.md:109 cites `convex/documents.ts:28`**
  - ran: `grep -nF 'recent' convex/documents.ts`
  - got: `recent` (rarest token, 2 occurrence(s)) is at L23, 5 line(s) from the cited L28 — the citation points at the right code
- **hackathon.md is reachable**
  - ran: `grep -l '(hackathon.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/ASSESSMENT.md is reachable**
  - ran: `grep -l '(ASSESSMENT.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/probe.md is reachable**
  - ran: `grep -l '(probe.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/probe-v3.md is reachable**
  - ran: `grep -l '(probe-v3.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/READINESS.md is reachable**
  - ran: `grep -l '(READINESS.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/round-trip.md is reachable**
  - ran: `grep -l '(round-trip.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it
- **docs/transcript-sbc.md is reachable**
  - ran: `grep -l '(transcript-sbc.md)' README.md AGENTS.md CLAUDE.md hackathon.md docs/ASSESSMENT.md docs/probe.md docs/probe-universal.md docs/probe-v3.md docs/READINESS.md docs/round-trip.md docs/transcript-sbc.md`
  - got: at least one doc links to it

