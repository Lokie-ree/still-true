# SHOOT CARD — still-true

Everything else is in `docs/video-script.md`. This is what goes next to the camera.

**One rule:** read the reply before you keep the take. That's it. Nothing else
can put a false claim in this video.

---

## Before you hit record

- [ ] **The notice from the cron is in the thread.** If it is not, beat C has no
      footage — go to *IF THIS HAPPENS*.
- [ ] **The diff actually fired.** One read-only command, no mail, no model:
      ```
      npx convex run --prod --inline-query 'const d=(await ctx.db.query("documents").take(200)).find(x=>x.url?.includes("watch-test")); const f=await ctx.db.query("findings").collect(); return {kind:d.kind, changed:f.filter(x=>x.documentId===d._id&&x.changedAt!=null).length};'
      ```
      `changed` must be 2. If it is 0, the classifier re-rolled between readings.
- [ ] Do Not Disturb on. Slack, Discord, Steam quit.
- [ ] Three tabs: board, Gmail, Livonia lease. Bookmarks bar hidden. Zoom 125%.
- [ ] Gmail searched for `still-true` so the list is clean.

## Order

**B** → read the Livonia card → **A** → **C** → **D** → **E**

No deploy on shoot day. The fixture edit went out Friday; the cron found it at
11:17 UTC.

Shoot one throwaway run of all five first. Delete it. That's the plan, not a failure.

---

## B · the live send

Forward the lease link. Type a real question. Send. **Don't cut.**

- Here's the same thing, live, on a document you can go read yourself.
- No app. No upload. No account. I sent it to an email address.
- *(reply lands — say the real number)* That took [N] seconds.
- Every claim comes back with a sentence from the document and the line it's on.

Read the late-charge finding. Switch to the lease. `Ctrl+F`. **Don't cut.**

- The plain sentence is the model's summary. The quote under it isn't.
- The model returns a line number. The server cuts that sentence out of your
  document by index, after the model is done talking.
- So it can't show you a sentence that isn't in your document.

## A · the board, cold

Health plan card first, four refusals on screen. Don't scroll.

- You can read a document once. You can't notice what it doesn't say — there's
  nothing there to notice.
- This is the government's model health plan summary. The form every insurer
  fills in.
- No single line of it tells you how to cancel your coverage.
- Something read every line to be able to say that. I opened the source PDF and
  checked it by hand.

## C · the change nobody asked for

**Nothing here is done on camera.** The edit, the deploy and the detection all
happened yesterday and overnight. You are showing the consequence.

Fixture on screen as it now reads. Then cut to the inbox, notice already in it.

- This page is a fixture I control. I changed it yesterday, on purpose, and I'm
  telling you so the next part means something.
- I asked one question about this page. Once, days ago. Then I went to bed.
- *(point at the timestamp)* That arrived at 11:17 UTC. I didn't run it. It's a
  daily job, and it found this while nobody was looking.
- Two things I'd quoted don't read the same way. It's not telling me the lease
  got worse — it isn't qualified to judge that. It's telling me these aren't the
  words that were there.
- It won't email you because a model answered differently on a Tuesday. A change
  is reported when the hash of the text moved **and** the exact clause it quoted
  is gone. Both gates are string comparisons. Neither asks the model again.

## D · when it's wrong

Send a message with no attachment and no link.

- When it can't do the job it says so. It doesn't invent a document to talk about.

Health plan refusal back on screen.

- This used to say "this document does not state it." Two days ago a test
  document proved that can be false — a fact split across two lines is in the
  document and on no single line of it.
- So now it says what it actually knows: no single line states it. That's weaker
  than what I shipped, and it's the version that's true.
- Everything currently wrong with this is in the repo, scored, with the fixed
  ones still on the page so nobody rediscovers them.

Don't rush this one. Don't deliver it as a confession.

## E · the stack

- Convex is the whole backend. One deployment: the schema, the documents and
  findings, the daily cron, the reactive queries behind that page, the workpool
  that retries a failed re-check, the HTTP action the mail webhook hits, and the
  site itself. No server. No separate host. No queue.
- AgentMail is the inbox. Firecrawl parses the PDFs.
- There's no app. The interface is your mail client. One question, forwarded
  once, answered with receipts, and watched until it stops being true.

End on the reply. Not a logo.

---

## IF THIS HAPPENS

| | |
|---|---|
| **Answer doesn't match its quote** | H6. Forward again, new take. Don't talk around it. |
| **Line count differs from last take** | M6, expected. Say no numbers you can't see on screen. |
| **6th forward comes back a rate-limit reply** | Bucket's empty. 5 per burst, then one every 6 min. Wait or shoot A. |
| **Two change notices in the thread** | Expected. Friday's proving run (entry notice) + Saturday's cron (late charge). Check the timestamp before you point. |
| **Cron mailed nothing overnight** | Reclassified. Off camera: edit $600 → $700, deploy, `watch:recheck` (NOT `sweep`). It converges. |
| **Not sure the diff will work** | Read it before you shoot — the `kind` check under *Before you hit record*. |
| **Board reorders on screen** | You reloaded. Leave the tab open. |
| **Fluffed a line** | Forward again, different subject. Third take is usually the one. |

**Nothing here is one-way.** The deploys were. The takes aren't.