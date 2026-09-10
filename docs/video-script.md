# The demo video — script, shot list, and the order it has to be shot in

Rewritten 2026-09-09, before anything was recorded. Four rival projects have a
video and this one does not; that is the largest unclosed gap left, and it is
worth more than any remaining flag on the board.

**Length: 2:30.** Not three minutes. A judge watching twenty of these decides in
the first fifteen seconds whether to keep watching.

**The rule the whole video is built on:** every claim on screen is checkable
while it is on screen. No cut between a claim and its evidence, no sped-up
footage during a timed shot, and the source document visible beside its quote. A
demo that asks to be trusted is the exact thing this product exists to refuse.

> **Changed 2026-09-10**, after a review that read the source rather than the
> docs. Five things moved and nothing else: beat A's refusal claim, which
> contradicted what the board says; beat A's description of the SBC, which was
> loose about what that document is; one clause in beat B about who wrote which
> sentence; beat E, rewritten for the panel that is actually judging; and four
> hazards added to the list of what will go wrong, all of them found in code and
> none of them previously written down. The evidence for each is in
> `docs/handoff-2026-09-10.md`.

---

## Why this is a rewrite, and what was wrong with the first one

The first draft opened like this:

> This is a 94-line lease. The late fee is on line 21. Nobody reads to line 21.

Three things were wrong with it, and they are worth keeping on the page so they
do not come back.

**It argued that documents are long.** That is the summarizer pitch, and the
09-07 competitive read records six of twelve entries under the tag built on it.
The recon artifact's own decided order is **refusal, then watch, then
grounding**; that draft led with length and grounding and did not reach the
refusal until roughly fifty seconds in, past the point a judge has decided.

**It argued length using the shortest document in the corpus.** Ninety-four
lines, against 2,007 for AT&T and 1,227 for PayPal. Anyone would read a 94-line
lease. And the fixture is synthetic — written for this project — so the opening
argument ran on a document no judge has ever seen.

**It contradicted its own footage.** The lease was forwarded on camera at 0:00,
and at 1:20 the narration said *"I asked one question, once, days ago."* Eighty
seconds apart, in a video whose entire premise is that it does not ask to be
trusted.

The honest claim is not that documents are long. **It is that you cannot notice
what a document does not say**, because there is nothing there to notice, and
that you can read your lease once but not every morning forever. Those are the
two things a person genuinely cannot do, and per the 09-07 read they are the two
things nobody else in the field claims.

---

## Before anything is recorded

**1. Deploy `main` to production**, with the board fix merged (the PR that
imports `refusalLine` and `receiptKey` into `src/App.tsx`), the board redesign,
and the answer-text correction in `README.md` and the `App.tsx` footer. Beat A
and beat D both put the board on camera. Until that is live the page reads
*"WHAT IT NEVER SAYS"* and *"This document does not state it"* while the email
reads *"no single line states it"*, and the video contradicts itself. One
deploy, not three. Randall runs prod deploys; they are blocked from an agent
session.

**2. Forward the fixture, and do it days before you record.** This is the fix
for the contradiction above and it costs one email:

```
to:      still-true@agentmail.to
subject: lease question
body:    https://impressive-marten-163.convex.site/watch-test/lease.html
         What's the late fee and how much notice do I have to give?
```

Beat C says the question was asked days ago. Send it days ago and the sentence
is true. Nothing else in the video depends on when it was sent.

**Note which questions the reply asks** — lease keys or universal keys. Beat C's
recovery path below depends on knowing it, and it costs one glance.

**3. Freeze `PARSER_VERSION` for the whole session.** A bump between the
enrolment and the edit makes `attach` re-baseline instead of diff, and the change
is swallowed — safe by design, fatal to a demo. This is why **M8 stays parked
until the video is shot**, and it is also why **H6 cannot be fixed first**: H6's
recommended fix is M8, and M8 bumps the parser. You are shooting with a
known-open high flag, deliberately, and it is recorded here so it is a decision
rather than an oversight.

**4. Know that H6 can bite on camera.** An answer can out-run the line it cites.
On production on 09-09 the same document refused a question at 14:15 and answered
it wrongly at 15:13, unchanged. So read every reply against its source **before**
you keep a take. Choosing which take to ship is not faking anything; every claim
on screen stays checkable. Shooting a take you have not read is the only version
of this that would be dishonest.

**5. Open the deployed board and look at it.** Confirm the health plan card is
first and note what it currently refuses. The card order is derived from the
data — a card hoists itself when any of its findings refuse — and the counts have
moved on their own twice, 35/12 to 37/10. A claim about what a visitor sees is a
claim about a rendering, and only looking at it settles that.

## The order it has to be shot in

Not the order it appears in.

1. Deploy, then send the fixture forward (steps 1 and 2 above), days ahead.
2. **Shoot B** — the live send and the receipt. It is the only beat with a
   stopwatch in it and the one most likely to need takes.
3. **Shoot A** — the board. It needs nothing live and it is easier once you have
   watched the reply come back. **Read the Livonia card before you shoot it**:
   beat B's forward re-extracted it, so those receipts are new ones, not the 21
   that were opened by hand.
4. **Then** deploy the fixture edit, which is its own PR and marked
   do-not-deploy for exactly this reason.
5. **Then** run the sweep and shoot C, the change notice.
6. Shoot D and E last.

---

## A — what it never says · 0:00–0:30

**On screen:** the public board, cold. No preamble, no logo, no product name
read aloud. The health plan card is first and it opens with four refusals.

**Say:**

> You can read a document once. You cannot notice what it does not say, because
> there is nothing there to notice.
>
> This is the government's model health plan summary — the form every insurer
> fills in. No single line of it tells you how to cancel your coverage.
> Something read every line to be able to say that, and I opened the source PDF
> and checked it by hand.

Let the four refusals sit on screen while you say it. Do not scroll yet.

**Two things this wording is careful about**, both changed on 09-10. The screen
says *"no single line states it"*, so the narration says the same thing —
the earlier draft said *"it is not in there"*, which is the stronger claim
**H5 exists to stop making**, and it would have contradicted beat D ninety
seconds later. And the document is CMS's completed sample SBC, not a plan
anybody is enrolled in; a judge who clicks finds a fictional plan, so "the form
every insurer fills in" is the version that survives the click. The hand check is
real: the 09-08 round trip verified all four refusals against sixteen search
terms.

**Why this is the opening.** Twelve entries under the tag, six on this exact
stack, and every one of them finds what *is* in a document. Nobody claims the
absence. It is also the harder claim, which is the point: an answer can be
checked by opening its citation, and a refusal has nothing to open. The rest of
the video is about why you should believe this one anyway.

---

## B — why you can believe it · 0:30–1:15

**On screen:** Gmail. The Livonia lease open in the next tab.

**Do:** forward the lease link to `still-true@agentmail.to` with a real question
typed by hand. Send. **Do not cut.** Let the empty inbox sit there.

Use the Livonia lease rather than something new. It is on the board, its
citations were opened by hand and held 21 of 21, and you will spot a bad answer
in a second rather than a minute. It is still a live send, and it still
re-extracts.

**Say, over the wait:**

> So here is the same thing, live, on a document you can go read yourself. No
> app, no upload, no account. I forwarded it to an email address.

The reply lands in under thirty seconds. Say the number out loud only after the
timestamp is visible, and say whatever it actually was.

**Then the receipt:**

> Every claim comes with a sentence from the document and the line it came from.

Read the late-charge finding aloud, **switch to the lease, and find it** with
`Ctrl+F`. Do not cut. A judge watching find-in-page land on the exact sentence is
the most convincing four seconds available to this project.

> The plain-English line is the model's summary. The sentence under it is not.
> The model returns a line *number*. The sentence is pulled out of the document
> by index, on the server, after the model has finished talking. So it cannot
> show you a sentence that is not in your document.

**Do not "improve" that wording.** It is precise in two directions and both were
paid for. An earlier draft said the quote is the sentence that *carries* the
answer. On 2026-09-09 production published *"The late fee is $50.00"* citing a
line reading only `Dollars ($50.00) for that month.` — a real sentence from the
document, under an answer it does not carry (**H6**). What this system proves is
that the quote is in your document. That the quote *supports* the answer is a
model instruction, not a structural property, and the narration says only the
provable half. The first sentence is the other direction, added 09-10: the
`answer` field **is** the model's prose — `extract.ts` explicitly forbids copying
document text into it — so saying nothing about authorship invites the one
question a sharp judge will ask. Naming it costs three seconds and closes it.

**Optional, and strong if the timing cooperates:** put the board on half the
screen during the wait. The lease is a public document, so the forward joins the
row that is already there, and the card's re-checked stamp moves while you watch.
Nobody refreshed anything. That is the reactive query, on camera, without a
sentence of explanation.

---

## C — the change nobody asked for · 1:15–1:55

**On screen:** the fixture lease as it now reads, then the inbox thread from days
ago with the notice already in it.

**Nothing in this beat is done on camera. Changed 2026-09-10** — the edit, the
deploy and the detection all happen before the shoot, and the beat is the
consequence rather than the procedure. See *The change happens the day before*
below for why that is stronger and not weaker.

**Say the honest line first, exactly as before:**

> This page is a fixture I control. I changed it yesterday, on purpose, and I am
> telling you that so the next part means something.

The change is **$400 to $600** and **ninety days to thirty**. Both values were
confirmed against the live production page on 09-10.

**Cut to the inbox.** The notice is already there, in the thread that asked days
ago.

> I asked one question about this page. Once, days ago. Then I went to bed.
>
> That arrived at 11:17 UTC. I did not run it. It is a daily job, and it found
> this while nobody was looking.

Point at the timestamp while saying it. It is on screen and it is checkable,
which is the only kind of claim this video makes.

Read the notice on screen. It quotes the old clause and the new one, each with
its line.

> Two things I had quoted no longer read the same way. It does not tell me the
> lease got worse — it is not qualified to judge that. It tells me these words
> are not the words that were there.

**Then the line that is the hardest engineering in the project and invisible
without saying it:**

> It will not email you because a model answered differently on a Tuesday. A
> change is only reported when a hash of the parsed text has moved **and** the
> exact clause it quoted is gone from the document. Both gates are string
> comparisons. Neither asks the model a second time.

### The change happens the day before, and that is the point

The earlier version had the shooter edit the fixture on camera, publish, and run
`watch:sweep` by hand. Three problems, and the third is the real one:

1. **`npm run deploy` rebuilds and re-uploads the entire site and pushes the
   functions.** That is not an operation to run while talking, and a dirty
   working tree ships live on camera.
2. **`watch:sweep` re-reads every url-backed document in the deployment**,
   private forwards included — `watchable` filters on `url !== null`, not on
   `isPublic`. It is a real fan-out, not a fixture-only action.
3. **Running the sweep by hand quietly undercuts the sentence the beat exists
   for.** "I did not ask for this" is weaker when the viewer has just watched
   you ask for it. The cron asking instead makes *unprompted* literally true and
   puts a timestamp on screen that proves it.

So: edit and deploy on Friday, let the 11:17 UTC cron find it Saturday morning,
shoot Saturday afternoon. Nothing is faked and nothing is hidden — the narration
says out loud that the change was made deliberately, the day before.

**The change is consumable.** Once a change is detected and published, the new
reading becomes the baseline and the next read finds nothing. So a rehearsal that
moves the late charge SPENDS the late charge. Prove the chain on a clause the
video does not use — the entry notice, four hours to six — and leave $400 and
ninety alone for the real one.

**If the cron mails nothing**, the recovery is off camera and unchanged in
substance: edit again, then run the single-document re-check rather than the
sweep.

```
npx convex run watch:recheck '{"documentId":"<id>","url":"<fixture url>","title":"<title>"}' --prod
```

`recheck` is what `sweep` enqueues per document, so it exercises the same
`readAndPublish` path with none of the fan-out.

The first draft put a measurement in that paragraph — two disagreements in
forty-seven answers across two runs. It is a real number and it is in the README.
It does not belong in narration, because the listener cannot check it while
hearing it, and asking to be taken on faith is the one move this video cannot
make. **If a sentence has a number the viewer cannot see on screen, put the
number on screen or cut the sentence.**

---

## D — what it does when it is wrong · 1:55–2:15

**On screen:** the inbox, then the board.

This beat did not exist in the first draft, and it is the one nobody else can
copy. Every rival video shows the happy path.

**Do:** send a message with no attachment and no link. The reply is already
built and already tested:

> I did not find a document in that message.

It is also free: the no-document branch runs ahead of both spend gates, so this
take costs no rate-limit token however many times you shoot it.

**Say:**

> When it cannot do the job it says so, and it does not invent a document to
> talk about.

**Then the harder half.** Put the health plan refusal back on screen.

> This used to say *"this document does not state it."* Two days ago a test
> document proved that sentence can be false — a fact split across two lines is
> in the document and on no one line of it. So it says what it actually knows
> now: **no single line states it.** That is weaker than what I shipped, and it
> is the version that is true.
>
> The list of everything currently wrong with this is in the repo, scored, with
> the fixed ones kept on the page so nobody rediscovers them.

**Do not cut this shot for time**, and do not deliver it as a confession. Every
other submission's README says the project works. This one publishes the argument
against itself, and it is the one thing no rival can copy in two weeks.

Do not recite the score trajectory. It means nothing to a stranger and it eats
eight seconds. One sentence that changed, and why, is the whole beat.

---

## E — the stack · 2:15–2:30

Rewritten 2026-09-10. Fourteen of the seventeen judges work at Convex, OpenAI,
AgentMail or Firecrawl, and the first draft of this beat was a credits roll. It
costs no new footage to say what the platform actually carried.

> Convex is the whole backend. One deployment holds the schema, the documents
> and their findings, the daily cron that re-reads them, the reactive queries
> behind that page, the workpool that retries a failed re-check, the HTTP action
> the mail webhook posts to, and the site itself. No server, no separate host,
> no queue. AgentMail is the inbox. Firecrawl parses the PDFs.
>
> There is no app. The interface is your mail client. One question, forwarded
> once, answered with receipts, and watched until it stops being true.

End on the reply, not on a logo.

**The sponsor-specific depth stays out of the video.** Seventeen specialists
cannot be served in 150 seconds, and every one of them can read. The Firecrawl
cache and change-tracking findings, the AgentMail component evidence, the Convex
component evaluation and the schema design that makes a bad answer
unrepresentable all live in `README.md`, `hackathon.md` and `docs/READINESS.md`.
They are already written and they are already better than most of what will be
submitted.

---

## The recording checklist

- [ ] Board fix, board redesign and the answer-text correction merged, and
      `main` deployed to production as one deploy
- [ ] The board reads "What no single line says", not "What it never says"
- [ ] `README.md` and the `App.tsx` footer say the model writes the *answer*,
      not the quote
- [ ] The fixture forward sent **days** before recording, not on the day
- [ ] That thread confirmed `stopped: false` — the 09-08 production STOP stopped
      8 rows across 5 documents, and a stopped thread is silent in a way that
      looks exactly like a broken watch
- [ ] Which checklist the enrolment reply used, written down (beat C recovery)
- [ ] `PARSER_VERSION` unchanged since that forward, and staying that way
- [ ] `npm run gate` green — **7 checks**, not 6 — and screenshotted
- [ ] `scripts/reconcile.sh` green. Beat D points a judge at `READINESS.md`; it
      should not be drifted when they open it
- [ ] The health plan card confirmed first on the deployed board, and its
      current refusal count noted
- [ ] Every reply read against its source before the take is kept (**H6**)
- [ ] The fixture-edit PR **not** deployed until A and B are in the can
- [ ] Sweep trigger ready: `npx convex run watch:sweep --prod`
- [ ] Screen at a readable size. The quotes are the whole point and they are long

## The things that will go wrong

**The line count moves between takes.** M6: one byte-identical PDF read 171 lines
one hour and 174 the next. Cut the number from the narration and let the reply
show whatever it shows. This is why beat A says "every line" and not a figure.

**An answer out-runs its line.** H6, open, unfixable before this shoot because
its fix bumps the parser. Read the reply before keeping the take. If it happens
on a take you like, forward again rather than talking around it.

**You get five forwards, then one every six minutes.** The ingest limiter is a
token bucket: rate 10 per hour, capacity 5. Reshooting beat B by forwarding again
is the intended move and it is cheap for the first five. After that a take costs
a six-minute wait, and the sixth forward in a burst comes back as the rate-limit
reply — which is correct behaviour and terrible footage. Budget the takes, or
plan the reshoots around the refill.

**Beat C can produce silence, and it will not tell you why.** The change diff is
keyed on question key: a question the previous reading never asked is not a
change. This fixture has classified `lease` twice and `other` twice across four
readings of near-identical text, and the edit is what forces a re-classify —
while the page sits unchanged, the sweep takes the early exit and never
reclassifies. So there is exactly one coin flip, at the worst moment. **If the
sweep mails nothing: edit again, $600 to $700, publish, sweep again.** The second
pass diffs against the reading the first pass just published, so it converges.

**Beat B rewrites the card you are about to shoot in A.** Forwarding a URL
already on the board finds the existing row, replaces every finding from a fresh
model run, and patches its timestamps. That is what makes the split-screen shot
work — but the Livonia receipts afterwards are new ones, not the 21 that were
opened by hand. Read the card between B and A.

**The change notice needs a sweep.** It will not arrive on its own until 11:17
UTC. Run `watch:sweep` by hand and wait — on development that was 2m17s from edit
to inbox. The wait is honest footage. Do not fake it with a cut. Note that the
sweep re-reads **every** url-backed document in the deployment, forwarded ones
included, not just the fixture.

**Do not reload the board on camera.** Cards that refuse something sort to the
top once their findings load, so a cold reload shows a brief reorder. Leave the
tab open and it never happens.

---

## How to actually record it

Everything below is preinstalled on Windows 11. Nothing to buy, nothing to
install.

### Before any recording — ten minutes

1. **Notifications off.** Settings → System → Notifications → **Do Not Disturb**.
   Quit Slack, Discord, Steam. A popup mid-take is the commonest ruin of a first
   video.
2. **Clean browser.** A new Chrome window with three tabs — the board, Gmail, and
   the lease. Hide the bookmarks bar with `Ctrl+Shift+B`. Zoom to **125%** with
   `Ctrl` and `+`, then look at a quote and ask whether it is readable on a
   laptop. The quotes are long, and this matters more than anything else here.
3. **The inbox is on camera.** Search Gmail for `still-true` first, so the list
   shows only these threads and not every subject line in the account.
4. **Test the mic.** Voice Recorder, ten seconds, play it back. Bad audio loses
   more demo videos than bad video does.

### Rehearse once with recording OFF

Read the script aloud while clicking through. Two sentences will not fit your
mouth. **Change them.** It is your script, and the constraint is that every claim
stays checkable, not that the wording is mine. If a line feels like recitation,
it is — say the point to a friend instead and keep whatever comes out.

### Record shot by shot, not in one take

`Win + Shift + R` → drag a box around the Chrome window → Start. One shot. Stop.
Save as `A.mp4`, `B.mp4`, and so on. Redo any shot as often as you like.

Nobody records a good first take. The third is usually fine.

- **B** — the wait is real, 25 to 30 seconds, and the narration is what fills it.
  Fluffed a line? Forward again with a slightly different subject and reshoot,
  inside the five-forward budget above. Scroll slowly, or better, use `Ctrl+F` to
  find the quote.
- **A** — screen and voice only, once you have seen the reply come back and read
  the Livonia card it changed.
- **C** — the only shot with a real cost, because deploying the edit changes the
  page for good. **Shoot A and B first and confirm they are good.** If C goes
  wrong it can be redone: edit the clause again, $600 → $700, deploy, sweep.
- **D and E** — leave until last, when warmed up.

### Stitch it in Clipchamp

Search Clipchamp in Start. New project → import the clips → drag them onto the
timeline in order → trim the dead air off each head and tail → export 1080p.

**No music and no transitions.** A hard cut between shots is correct; anything
else reads as a product video, which is the register this whole thing is arguing
against.

### Budget

Two to three hours including setup and reshoots. That is normal for a first one.