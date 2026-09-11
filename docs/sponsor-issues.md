# Two issues to file — drafts

Copy-paste bodies for the Firecrawl and AgentMail trackers. **File after the
shoot, before the submission**, per §5 of
[`handoff-2026-09-10.md`](handoff-2026-09-10.md).

Everything below is already in `hackathon.md` or `docs/READINESS.md`; nothing
here is new, and nothing here is inferred. If a number in a draft cannot be
traced back to one of those files, cut the sentence rather than soften it.

**Before filing:** search each tracker for an existing report and add to it
instead of opening a duplicate. Both drafts assume you are reporting, not
demanding — neither blocked this build, and both say so.

---

## 1 · Firecrawl — PDF parse is not deterministic for one URL

**Where:** the Firecrawl issue tracker / support. **Title:**

> `/scrape` returns a different line count for the same PDF bytes (171 vs 174, same URL, same afternoon)

**Body:**

Reporting a reproducible-by-waiting non-determinism rather than a blocker — the
system this was found in handled it correctly and shipped.

One URL, one afternoon, four reads, two distinct parses:

| read | lines returned |
|---|---|
| 11:17 | 171 |
| 17:49 | 174 |
| 18:31 | 174 |
| 18:46 | **171** |

URL: `https://www.cms.gov/cciio/resources/forms-reports-and-other-resources/downloads/english-sample-completed-sbc-accessible-format-012825.pdf`
(CMS's completed sample Summary of Benefits and Coverage, ~170 lines of markdown).

**The source file did not move.** Downloaded independently at 17:49 and again at
18:47: `sha256 863bf56f…` both times, `cmp` clean. Two hashes of the same bytes
beside four different readings of them. All four reads were made with
`maxAge: 0`, so none of them was a cache hit.

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

Happy to supply both hashes, the four raw responses, and timestamps.

---

## 2 · AgentMail — `@agentmail/convex` 0.1.0 cannot send on Convex 1.44

**Where:** the `@agentmail/convex` repo. **Title:**

> 0.1.0 cannot send on Convex 1.44: the component reads `process.env.AGENTMAIL_API_KEY`, which a component sandbox never sees

**Body:**

Three of the component's four jobs work and we kept all three — Svix
verification, `event_id` dedupe, and the dispatch workpool are untouched in our
build. This is only about outbound send.

**The failure.** `agentmailFetch` reads `process.env.AGENTMAIL_API_KEY` from
inside the component sandbox. Convex 1.44 populates a component's environment
only from what the parent binds via `app.use(child, { env })`. The component
declares no env vars, so there is nothing to bind and the key is invisible to it.

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

**Why we could not work around it.** 0.1.0 is the latest published version,
`convex env set` has no component flag, and vendoring the component to add one
line to its config meant owning ~400 lines of someone else's code for the rest
of the build. We moved outbound to a single HTTP POST of our own, reusing the
component's exported `toSendPayload` so the wire format cannot drift from yours.

**Suggested fix:** declare the key in the component's `convex.config.ts` env so
`app.use(agentmail, { env: { AGENTMAIL_API_KEY: ... } })` binds it, and fail loud
rather than returning success when the key is absent.

**A second, smaller thing while I am here.** Real inbound messages carry a
**scalar `from`** (`"Name <addr>"`), not the `from_` array the docs example
shows — checked against a live message, not against the docs. `0.1.0`'s
`inboundMessages` schema declares `from: string`, so the types and the docs
disagree; we carry two `as unknown as` casts because of it, both marked in our
source with the condition for deleting them.

---

## Filing notes

- Send the Firecrawl one to Max Kelly's team, the AgentMail one to the repo. Do
  not @ individual judges — the point is that the report exists with your name
  on it, not that a specific person sees it.
- Neither issue should read as a complaint. Both products are in the shipped
  build and the log says so; keep that tone.
- Link the public repo in each. The evidence is already in `hackathon.md`, and a
  reader who follows the link finds the whole reasoning rather than a summary.
