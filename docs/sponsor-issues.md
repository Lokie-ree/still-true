# Two issues to file — drafts

Copy-paste bodies for the Firecrawl and AgentMail trackers. **File after the
shoot, before the submission**, per §5 of
[`handoff-2026-09-10.md`](handoff-2026-09-10.md).

Nothing here is inferred. If a number in a draft cannot be traced to
`hackathon.md`, `docs/READINESS.md` or a measurement recorded in this file with
its date, cut the sentence rather than soften it.

**Revised 2026-09-19, and the revision is the point.** Both drafts were written
around 09-10 and both had drifted by the time they were due to be filed. The
Firecrawl one was *understating* its evidence — it had two line counts from one
afternoon, and there are now four across twelve days, on bytes confirmed
identical by three independent measurements. The AgentMail one was
*overstating*: its title pinned a Convex version we no longer run, and its
second half was wrong on two counts and is withdrawn below. A draft is a claim
like any other here, and it goes stale the same way.

**Corrected again 2026-09-20 — the 09-19 revision introduced a false
instruction.** It said 172 was "never a measured parse" and told a reader not
to cite it. **172 was a production reading on 2026-09-16**, and two artifacts
prove it: `submission-2026-09-16.md`, whose header states its numbers were read
from production `documents:recent`, and `public/og.jpg`, a screenshot of the
board taken that afternoon showing *"172 lines"* and four refusals reading
*"Searched all 172 lines."* The 09-18 verification listed "the SBC at 172
lines" as a defect because that copy had gone **stale**, not because the number
was invented, and the 09-19 pass collapsed those two things. **The error was
made by grepping this repository's prose instead of opening the artifact** —
the exact check the 09-19 revision was performing on everything except itself.
The set is 169 / 171 / 172 / 174.

**Before filing:** both trackers were searched on 2026-09-19 and neither holds
an existing report — the venue and the result are recorded in each draft. Both
drafts assume you are reporting, not demanding; neither product blocked this
build and both say so.

---

## 1 · Firecrawl — PDF parse is not deterministic for one URL

**Where:** <https://github.com/firecrawl/firecrawl/issues> — a public tracker,
and a better venue than support because the submission can cite it. Searched
2026-09-19: no existing report of this. **Title:**

> `/scrape` returns four different line counts (169 / 171 / 172 / 174) for the same PDF bytes over twelve days

**Body:**

Reporting a reproducible-by-waiting non-determinism rather than a blocker — the
system this was found in handled it correctly and shipped.

URL: `https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf`
(CMS's completed sample Summary of Benefits and Coverage, 440,883 bytes.)

**Seven reads, four distinct parses, one unchanged file.** All with
`maxAge: 0`, so none was a cache hit.

| date | read | lines returned |
|---|---|---|
| 2026-09-08 | 11:17 cron sweep | 171 |
| 2026-09-08 | 17:49 round trip | 174 |
| 2026-09-08 | 18:31 forward | 174 |
| 2026-09-08 | 18:46 forward | **171** |
| 2026-09-16 | 11:18 cron sweep | **172** |
| 2026-09-17 | 11:17 cron sweep | **169** |
| 2026-09-20 | 11:17 cron sweep | 169 (unchanged) |

**The source file did not move, and three independent measurements say so.**

1. Downloaded by hand on 2026-09-08 at 17:49 and again at 18:47:
   `sha256 863bf56f…` both times, `cmp` clean.
2. Our pipeline now hashes the source bytes before every scrape and stores it.
   The row for this URL carries
   `863bf56fdf99f7f9493d6c9a8a988685348f5f2200b8655bcc92484a111f079c`,
   written automatically at `2026-09-19T11:17:34Z`.
3. Downloaded again on 2026-09-19: 440,883 bytes, same sha256.

So the bytes are constant from 09-08 to 09-20 and the parse returned 171, then
174, then 172, then 169. Our own parser version is a single constant that has
not changed across that window, so the variance is not ours.

**A possible mechanism, from your own tracker.** Issue #4050 (open, 2026-07-28)
lists `pdf-parse` pinned at `^1.1.1` against a current `~2.4.x`, described there
as "PDF parsing of untrusted input on an old major." This may simply be that.

**Why it matters downstream.** We hash the parsed text to decide whether a
document changed. Every flip moves the hash, which misses our early exit and
spends two model calls re-deriving answers that did not change. It also surfaces
publicly: our refusal sentence quotes the line count, so the same untouched
document reads *"Searched all 171 lines"* one hour and *"all 174 lines"* the
next.

**What it is not.** Nothing incorrect was ever published. The differences appear
to be line-breaking in the markdown rather than lost or invented content — every
clause we had quoted was still present in every parse. So this is a stability
report, not a correctness one.

**What would help**, in order of usefulness to us: a documented guarantee that
one `(url, bytes)` yields one parse; failing that, a parse version or fingerprint
in the response so a consumer can tell "the document changed" from "the parser
did"; failing that, just knowing whether this is expected.

Happy to supply all three hashes, the raw responses, and timestamps.

---

## 2 · AgentMail — `@agentmail/convex` 0.1.0 cannot send

**Where:** <https://github.com/agentmail-to/convex/issues> (the `bugs` URL in
the package). Searched 2026-09-19: one issue ever, closed, unrelated.

**The version is deliberately not in the title.** The failure was observed on
Convex 1.44. We are on 1.45.0 now and have **not** re-tested the component's
send path, because we replaced it — so do not claim it still fails there. The
title does not need to: the mechanism below is a missing declaration in the
published package, not a platform behaviour, and naming a platform version
invites "does it repro on the latest?" when the answer is in a file anyone can
open. **Title:**

> 0.1.0 cannot send: the component reads `process.env.AGENTMAIL_API_KEY`, which a component sandbox never sees

**Body:**

Three of the component's four jobs work and we kept all three — Svix
verification, `event_id` dedupe, and the dispatch workpool are untouched in our
build. This is only about outbound send.

**The failure.** `agentmailFetch` reads `process.env.AGENTMAIL_API_KEY` from
inside the component sandbox. Convex populates a component's environment only
from what the parent binds via `app.use(child, { env })`, and the component
declares no env at all. `dist/component/convex.config.js` in the published
0.1.0 tarball is, in full:

```js
const component = defineComponent("agentmail");
component.use(workpool, { name: "sendPool" });
component.use(workpool, { name: "callbackPool" });
```

There is nothing there for any Convex version to bind, so the key is invisible
to the component. That file is in the current published tarball, checked
2026-09-19.

**It fails green**, which is the part worth fixing regardless of the mechanism.
On our first send, `repliedAt` was stamped, `error` was null, the document and
its findings were published — and the recipient's inbox stayed empty.

**Proof, one deployment, one second apart:**

```
19:31:51  attachmentUrl()   [our code]        requireEnv("AGENTMAIL_API_KEY")  -> OK, fetched, 418 lines parsed
19:31:51  agentmailFetch()  [the component]   process.env same name            -> "AGENTMAIL_API_KEY is not set on this Convex deployment."
```

Same deployment, same variable name, same second. Ours reads it; the
component's does not.

**Why we could not work around it.** 0.1.0 is still the latest published
version — published 2026-05-11, re-checked on npm 2026-09-19 —
`convex env set` has no component flag, and vendoring the component to add one
line to its config meant owning ~400 lines of someone else's code for the rest
of the build. We moved outbound to a single HTTP POST of our own, reusing the
component's exported `toSendPayload` so the wire format cannot drift from yours.

**Suggested fix:** declare the key in the component's `convex.config.ts` env so
`app.use(agentmail, { env: { AGENTMAIL_API_KEY: ... } })` binds it, and fail loud
rather than returning success when the key is absent.

### Withdrawn before filing, 2026-09-19 — do not put this back

This draft carried a second item: that real inbound messages carry a **scalar
`from`** rather than "the `from_` array the docs example shows," and that our
two `as unknown as` casts existed because of it. **It was wrong twice and is
cut.** Checked against the published artifacts rather than against memory:

- `from_` appears in AgentMail's docs **only in Python examples**, where it is
  the reserved-word escape for `from`. The Node SDK has no `from_`; the
  component README has no `from_`; there is **no Convex page in their docs at
  all**. It is a language binding convention, not a wire format.
- It is a **scalar** in those examples too (`from_field = message.from_ or ""`),
  not an array. Their own examples hedge across both spellings.
- So `inboundMessages` declaring `from: string` and live messages sending a
  scalar `from` **agree**. There is no discrepancy to report.
- The two casts are `ctx as unknown as WebhookCtx` (`convex/http.ts:27`) and
  `internal.mail.received as unknown as OnMessageReceived` (`convex/mail.ts:54`,
  optional thread metadata). Neither has anything to do with `from`.

Filing it would have been answered in one line and cost the first half the
credibility it earns.

---

## Filing notes

- Both go to a public GitHub tracker: `firecrawl/firecrawl` and
  `agentmail-to/convex`. A tracker beats a support channel here because the
  submission can cite the issue URL. Do not @ individual judges — the point is
  that the report exists with your name on it, not that a specific person sees
  it.
- Neither issue should read as a complaint. Both products are in the shipped
  build and the log says so; keep that tone.
- Link the public repo in each. The evidence is already in `hackathon.md`, and a
  reader who follows the link finds the whole reasoning rather than a summary.
