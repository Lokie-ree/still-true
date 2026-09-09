# The demo video — script, shot list, and the order it has to be shot in

Written 2026-09-09, before anything was recorded. Four rival projects have a
video and this one does not; that is the largest unclosed gap left, and it is
worth more than any remaining flag on the board.

**Length: 2:30.** Not three minutes. A judge watching twenty of these decides in
the first fifteen seconds whether to keep watching.

**The rule the whole video is built on:** every claim on screen is checkable
while it is on screen. No cut between a claim and its evidence, no sped-up
footage during a timed shot, and the source document visible beside its quote. A
demo that asks to be trusted is the exact thing this product exists to refuse.

---

## The order it has to be shot in

Not the order it appears in. Shooting out of order will make the copy disagree
with itself on camera.

1. **Deploy `main` to production first**, with PRs #39 and #40 merged. Until #40
   is live a reply still reads *"WHAT IT NEVER SAYS"* and *"This document does
   not state it"* — the sentence today's log says was fixed — and half the video
   would contradict the other half.
2. **Shoot A and B** (send, reply, verify) on a **fresh forward** made after that
   deploy.
3. **Then** deploy the fixture edit, which is its own PR and marked do-not-deploy
   for exactly this reason.
4. **Then** run the sweep and shoot C, the change notice.
5. Shoot D and E last. They need nothing live.

**Freeze `PARSER_VERSION` for the whole session.** A bump between the enrolment
and the edit makes `attach` re-baseline instead of diff, and the change is
swallowed — safe by design, fatal to a demo. This is why **M8 stays parked until
the video is shot**: fixing reflow bumps the parser.

---

## A — the send · 0:00–0:35

**On screen:** a real Gmail window, the lease open in the next tab, nothing else.

**Do:** forward the lease to `still-true@agentmail.to` with a real question typed
by hand — *"What's the late fee, how much notice do I have to give, and how long
do they have to return my deposit?"* Send. **Do not cut.** Let the empty inbox
sit there.

**Say, over the wait:**

> This is a 94-line lease. The late fee is on line 21. Nobody reads to line 21.
>
> So I forwarded it to an email address. No app, no upload, no account.

The reply lands in under thirty seconds. Let the timestamp be visible, and say
the number out loud only after it appears. If it takes forty seconds, say forty.

---

## B — the receipt · 0:35–1:20

**On screen:** the reply, then the lease beside it.

> Every claim comes with the sentence from the document that carries it, and the
> line it came from.

Read the late-charge finding aloud, then **switch to the lease and find it**.
Scroll to it. Do not cut. The point of the shot is that the scroll is possible.

> I did not write that sentence. The model returns a line *number*. The sentence
> is pulled out of the document by index, on the server, after the model has
> finished talking — so it cannot show you a sentence that is not in your
> document, because it never writes one.

**Then scroll to the refusal half.**

> And this is the part I have not seen anyone else ship: it tells you what it
> could not answer, and how many lines it searched to fail.
>
> It used to say *"this document does not state it."* Two hours before I recorded
> this, a test document proved that sentence can be false — a fact split across
> two lines is in the document and on no one line of it. So now it says what it
> actually knows: **no single line states it.**

That beat is not a confession, and it should not be delivered as one. It is the
product's thesis demonstrated on itself, and it is the sentence a judge will
still remember at the end of the day.

---

## C — the change nobody asked for · 1:20–2:00

**On screen:** the lease page with the late charge visible, then the edit, then
the inbox.

**Say it before making the edit, not after:**

> This page is a fixture I control. I am about to change it on purpose, and I am
> telling you that so the next part means something.

Change **$400 to $600** and **ninety days to thirty**. Publish.

**Cut to the inbox and wait.** The email arrives unprompted, in the thread that
asked.

> I did not ask for this. I asked one question, once, days ago.

Read the notice on screen. It quotes the old clause and the new one, each with
its line.

> Two things I had quoted no longer read the same way. It does not tell me the
> lease got worse — it is not qualified to judge that. It tells me these words
> are not the words that were there.

**Then the line that is the hardest engineering in the project and invisible
without saying it:**

> It will not email you because a model answered differently on a Tuesday. The
> same six documents, read twice hours apart, disagreed on two of forty-seven
> answers with nothing having changed. So a change is only reported when a hash
> of the parsed text has moved **and** the exact clause it quoted is no longer in
> the document. Both gates are string comparisons. Neither asks the model a
> second time.

---

## D — what it will not do · 2:00–2:15

**On screen:** the public board, one document open.

> It does not interpret, advise, or judge. It quotes and it counts.
>
> And `docs/READINESS.md` in the repo is the list of everything currently wrong
> with it, scored, with the fixed ones kept on the page so nobody rediscovers
> them. Today that score went 87, to 62, to 82 — because four documents were
> forwarded through production and three defects fell out.

**Do not cut this shot for time.** Every other submission's README says the
project works. This one publishes the argument against itself, and it is the one
thing no rival can copy in two weeks.

---

## E — the stack · 2:15–2:30

> Convex holds all of it: the documents and findings, the daily re-check cron,
> the reactive queries behind the board, and the static site the fixture is
> served from. AgentMail is the inbox. Firecrawl parses the PDFs.
>
> One question, forwarded once, answered with receipts, and watched until it
> stops being true.

End on the reply, not on a logo.

---

## The recording checklist

- [ ] #39 and #40 merged, `main` deployed to production
- [ ] `PARSER_VERSION` unchanged since enrolment, and staying that way
- [ ] `npm run gate` green and screenshotted before recording
- [ ] A **fresh forward made after the deploy** — never record a pre-#40 reply
- [ ] The fixture-edit PR **not** deployed until A and B are in the can
- [ ] Sweep trigger ready: `npx convex run watch:sweep --prod`
- [ ] Screen at a readable size. The quotes are the whole point and they are long

## The two things that will go wrong

**The line count moves between takes.** M6: one byte-identical PDF read 171 lines
one hour and 174 the next. If take one says "94 lines" and take three says 96, do
not re-record for it and do not explain it on camera — cut the number from the
narration and let the reply show whatever it shows.

**The change notice needs a sweep.** It will not arrive on its own until 11:17
UTC. Run `watch:sweep` by hand and wait — on development that was 2m17s from edit
to inbox. The wait is honest footage. Do not fake it with a cut.
