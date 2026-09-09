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
imports `refusalLine` and `receiptKey` into `src/App.tsx`). Beat A and beat D
both put the board on camera. Until that is live the page reads *"WHAT IT NEVER
SAYS"* and *"This document does not state it"* while the email reads *"no single
line states it"*, and the video contradicts itself. Randall runs prod deploys;
they are blocked from a Claude session.

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

## The order it has to be shot in

Not the order it appears in.

1. Deploy, then send the fixture forward (steps 1 and 2 above), days ahead.
2. **Shoot B** — the live send and the receipt. It is the only beat with a
   stopwatch in it and the one most likely to need takes.
3. **Shoot A** — the board. It needs nothing live and it is easier once you have
   watched the reply come back.
4. **Then** deploy the fixture edit, which is its own PR and marked
   do-not-deploy for exactly this reason.
5. **Then** run the sweep and shoot C, the change notice.
6. Shoot D and E last.

---

## A — what it never says · 0:00–0:30

**On screen:** the public board, cold. No preamble, no logo, no product name
read aloud. The health plan card is first and it opens with four refusals.

**Say:**

> This is a real health plan summary. The government publishes it as the model
> other insurers copy.
>
> It does not tell you how to cancel it. Not buried somewhere — it is not in
> there. Something read every line of it to be able to say that.

Let the four refusals sit on screen while you say it. Do not scroll yet.

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

> I did not write that sentence and neither did the model. The model returns a
> line *number*. The sentence is pulled out of the document by index, on the
> server, after the model has finished talking. So it cannot show you a sentence
> that is not in your document.

**Do not "improve" that wording.** An earlier draft said the quote is the
sentence that *carries* the answer. On 2026-09-09 production published *"The late
fee is $50.00"* citing a line reading only `Dollars ($50.00) for that month.` —
a real sentence from the document, under an answer it does not carry (**H6**).
What this system proves is that the quote is in your document. That the quote
*supports* the answer is a model instruction, not a structural property, and the
narration says only the provable half.

**Optional, and strong if the timing cooperates:** put the board on half the
screen during the wait. The lease is a public document, so the forward joins the
row that is already there, and the card's re-checked stamp moves while you watch.
Nobody refreshed anything. That is the reactive query, on camera, without a
sentence of explanation.

---

## C — the change nobody asked for · 1:15–1:55

**On screen:** the fixture lease with the late charge visible, then the edit,
then the inbox thread from days ago.

**Say it before making the edit, not after:**

> This page is a fixture I control. I am about to change it on purpose, and I am
> telling you that so the next part means something.

Change **$400 to $600** and **ninety days to thirty**. Publish. Run the sweep.

**Cut to the inbox and wait.** The email arrives unprompted, in the thread that
asked days ago.

> I asked one question about this page, once, before I started recording. I did
> not ask for this.

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

> Convex holds all of it: the documents and findings, the daily re-check cron,
> the reactive queries behind that page, and the site itself. AgentMail is the
> inbox. Firecrawl parses the PDFs.
>
> There is no app. The interface is your mail client. One question, forwarded
> once, answered with receipts, and watched until it stops being true.

End on the reply, not on a logo.

---

## The recording checklist

- [ ] Board fix merged and `main` deployed to production
- [ ] The board reads "What no single line says", not "What it never says"
- [ ] The fixture forward sent **days** before recording, not on the day
- [ ] `PARSER_VERSION` unchanged since that forward, and staying that way
- [ ] `npm run gate` green and screenshotted before recording
- [ ] Every reply read against its source before the take is kept (**H6**)
- [ ] The fixture-edit PR **not** deployed until A and B are in the can
- [ ] Sweep trigger ready: `npx convex run watch:sweep --prod`
- [ ] Screen at a readable size. The quotes are the whole point and they are long

## The three things that will go wrong

**The line count moves between takes.** M6: one byte-identical PDF read 171 lines
one hour and 174 the next. Cut the number from the narration and let the reply
show whatever it shows.

**An answer out-runs its line.** H6, open, unfixable before this shoot because
its fix bumps the parser. Read the reply before keeping the take. If it happens
on a take you like, forward again rather than talking around it.

**The change notice needs a sweep.** It will not arrive on its own until 11:17
UTC. Run `watch:sweep` by hand and wait — on development that was 2m17s from edit
to inbox. The wait is honest footage. Do not fake it with a cut.

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
  Fluffed a line? Forward again with a slightly different subject and reshoot.
  Scroll slowly, or better, use `Ctrl+F` to find the quote.
- **A** — screen and voice only, once you have seen the reply come back.
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
