# Rehearsal — 09-10 → 09-12

Two days. The card is [`shoot-card.md`](shoot-card.md); the script is
[`video-script.md`](video-script.md); the open items are §8 of
[`handoff-2026-09-10.md`](handoff-2026-09-10.md). This is the schedule.

---

## Tonight, before anything else

**Forward the fixture.** It is the only item on the list with a deadline you
cannot move, because the watch has to have a *prior reading* to diff against and
that reading has to be old enough to look like a real one. Do it now and it is
two days old on Saturday.

Then, on that thread:

- [ ] Confirm `stopped: false`. A stopped thread produces silence that is
      indistinguishable from a broken watch, and the 09-08 production STOP
      stopped 8 rows across 5 documents.
- [ ] **Write down which questions the reply asked** — L3a/L4a, or U2/U3b.
      Friday's edits force a re-classify, and if a reading lands on the other
      checklist the diff finds no prior question to compare and mails nothing,
      with no error anywhere. Knowing which checklist you started on is how you
      recognise that in ten seconds instead of ten minutes.

That is the whole night's obligation. Everything else below is practice.

---

## Thursday — the words, not the machine

Read the card out loud twice, sitting down, no camera, no screen recording.
You are not performing yet. You are finding which sentences you stumble on.

The three that are hardest to say clean, because they are the three carrying
subordinate clauses:

1. *"It's not telling me the lease got worse — it isn't qualified to judge that.
   It's telling me these aren't the words that were there."*
2. *"A change is reported when the hash of the text moved **and** the exact
   clause it quoted is gone."*
3. *"This used to say 'this document does not state it.' Two days ago a test
   document proved that can be false."*

Mark them. They are the ones to say aloud ten times each while doing something
else — walking, dishes. Not memorised word for word; memorised as a **shape**,
so that if the wording drifts on camera the meaning does not.

**Do not send mail today.** See below.

---

## Friday — the machine, dry

**Friday is the day the fixture changes.** Beat C is no longer shot live; the
edit, the deploy and the detection all happen today and overnight, and Saturday
shows the consequence. Reasons are in `video-script.md` under *The change happens
the day before*.

Morning:

- [ ] `npm run gate` (7 checks) and `scripts/reconcile.sh`. Both green. Beat D
      points a judge at `READINESS.md`; it should not be drifted when they open
      it.
- [ ] Open the deployed board. Confirm the SBC card is first and **write down
      its current refusal count.** The review could not check this, and prod
      counts have moved on their own twice (35/12 → 37/10). Say no number on
      camera you have not seen on screen that morning.
- [ ] Whatever the board redesign turns into, it is deployed and looked at
      today, not Saturday. Do not shoot against a page you saw for the first
      time an hour earlier.

Midday — **prove the chain on a clause the video does not use.**

The change is consumable: once a change is detected and published, the new
reading is the baseline and the next read finds nothing. A rehearsal that moves
the late charge **spends** the late charge. So it has to be a different clause —
and it has to be a clause **the current checklist quotes.**

**Rewritten twice on 2026-09-11, and the second rewrite is the interesting one.**
This step originally said *entry notice, four hours → six hours*. At 11:18 UTC
that was wrong, because the fixture had classified as `other` and the universal
checklist quotes no entry notice. It was changed to the modification clause,
the proving run was run at 15:29 — and the re-check **re-classified the document
to `lease`**, which reports nothing at all and mailed nothing. See H8 in
[`READINESS.md`](READINESS.md). The checklist is now pinned on a re-check, the
fixture is a `lease`, and under the lease checklist the entry notice is quoted
again, by **L2**. The original instruction was right all along; what was wrong
was assuming the checklist holds still.

**Deploy the H8 fix before this step**, or the next reading can re-roll again.

- [ ] Edit **line 127** of `public/watch-test/lease.html`: `four (4)` → `six (6)`.
      The string occurs once in the file and sits on one source line — *"four (4)
      hours"* wraps across lines 127–128, so `four (4)` is the token to search
      for, not the phrase. Leave $400 and ninety alone; they are the video's.
      Deploy.
- [ ] Re-check that one document — **never `watch:sweep`**, which re-reads every
      url-backed document in the deployment including private forwards:
      ```
      bash scripts/recheck-fixture.sh
      ```
- [ ] An email arrives quoting four (4) hours and six (6) hours with their
      lines. **L2 is the question it answers.** If it does, the whole chain works
      on production for the first time and you still have a day to fix it if it
      did not.
- [ ] **Then check `kind` is still `lease`** — the pre-roll command on the shoot
      card. That is the H8 fix proving itself on production, on the same run.

**That "first time" is not a figure of speech.** Before today no finding on
production carried a change stamp at all: the moved-clause path — old quote
struck through, new one published, notice in the thread — had only ever run on
dev.

Afternoon — **the full dry run.** Screen recorder on, camera off, no mail sent.
Walk B → A → C → D → E with the tabs, the Ctrl+F, the scroll, the cuts, saying
every line. Where beat B waits for a reply, sit in silence for twenty seconds
and keep talking after. Beat C no longer waits for anything — it is two tabs and
a timestamp — so rehearse the cut into the inbox and the point at the clock.

You are rehearsing **the hands and the pauses**, which is where takes actually
die. Watch it back once at 1.5×. You are looking for two things only: places you
scrolled when you meant not to, and places you stopped talking.

Evening — **the real edit, then hands off.** Last thing you do on Friday. Two
find-and-replaces in `public/watch-test/lease.html`, each occurring once in the
file and each on a single source line:

- [ ] **line 72** — `Four Hundred and 00/100 Dollars ($400.00)` →
      `Six Hundred and 00/100 Dollars ($600.00)`  (quoted by **L3a**)
- [ ] **line 158** — `ninety (90)` → `thirty (30)`  (quoted by **L4a**)
- [ ] Deploy. Stop touching it.
- [ ] Do **not** re-check it by hand. The 11:17 UTC cron finding it unprompted is
      the entire beat; running the check yourself spends the change and leaves
      you nothing to show.

**These are the script's original two edits, and they came back for a reason.**
For part of 2026-09-11 the second one was `seven (7) days → ten (10) days`,
because under the *universal* checklist line 63 was quoted twice — by U3a and
U3b at two different lengths — and one edit would have moved three findings and
printed one line twice on camera. The fixture is a `lease` now and line 63 is
quoted once, by L4a, so the duplicate is gone and the cure period is quoted by
nobody. Checked against production 2026-09-11: `$400.00` is inside L3a's quote
and `ninety (90)` is inside L4a's.

## Saturday — shoot

**First, before anything else:** the notice from the overnight cron is in the
thread, and the `kind` check on the shoot card reports `kind: "lease"` with
**`L3a` in `changed`**. `L4a` will be there too, and `L2` carried over from
Friday's proving run — a change stamp survives later readings, and that is
correct, not a leak.

If `kind` came back anything other than `lease`, the H8 pin is not deployed:
the prior questions have no counterpart on the new checklist, `diff` skips all
of them and reports nothing. Deploy it, then edit again ($600 → $700), deploy,
run `bash scripts/recheck-fixture.sh`, and shoot later. All of that is off
camera, which is the whole reason it was moved off camera.

**Do not expect a number.** The old card said `changed` must be 2 and no number
is right: drift can bring a moved clause back as `not_stated`, which is reported
in the mail as a removal and never stamped. The question is whether `L3a` moved,
not how many did.

Card is next to the camera. Do the throwaway run of all five first and delete
it, as written. That is the plan, not a warm-up you can skip.

Between takes: read the reply against its source. Every time. H6 is open, and
that one habit is the only thing standing between this video and a fourth
retraction.

---

## Why you cannot practice the part you most want to practice

The rate limiter is a token bucket — five forwards back to back, then one every
six minutes. Beat B is the take-heavy beat. If you rehearse it by sending, you
arrive at the real take with an empty bucket and a six-minute wait between
attempts.

So: **rehearse the sending dry, and spend the bucket on takes.** The forward, the
typing, the send, the wait, the reading-aloud of the finding — all of it can be
walked through with an unsent draft on screen. The only thing you cannot fake is
the reply landing, and you do not need to fake it, because you have already read
one: the enrolment reply from tonight is sitting in that thread, and it is the
same shape.

`watch:sweep` is now never run by hand at all. It re-reads **every** url-backed
document in the deployment, private forwards included, and there is no reason to
take that fan-out when `watch:recheck` does one document down the same
`readAndPublish` path. The cron is the only thing that sweeps.

---

## About being nervous

Some of this is fixable by mechanism rather than by nerve, so fix it by
mechanism:

**You are not on camera. The screen is.** Four of the five beats are a screen
recording with your voice over it. Nobody is watching your face. If that makes
it easier, do not shoot your face at all — the script does not need it.

**Every take is free.** The deploys were one-way. The takes are not. You can
say a sentence eleven times and keep the eleventh, and no one watching the
finished video can tell which take it was. The card says *third take is usually
the one* because that is empirically where it lands, not because two is a
failure.

**You are not selling. You are reading a receipt.** The tone that works here is
the one you would use to point at a line in a document for someone sitting next
to you. Not pitch cadence. If you catch yourself performing, you are in the
wrong register and the fix is to slow down, not to project harder.

**Beat D is the one to not rush, and it is the one you will want to rush**,
because it is the beat where you say the product was wrong. Deliver it as a
finding, not as a confession. The reason it belongs in the video is that a
product which tells you what is broken with it is making a stronger claim than
one that doesn't — that is the argument, so let it land at its own speed.

**The stumble you are afraid of is not the failure mode.** A fluffed word costs
one re-forward. The actual failure mode is keeping a take with a claim in it you
did not check — which is why the card has exactly one rule on it, and it is not
about your delivery.

**If you spiral on a beat**, shoot the other four and come back. The order on
the card is a shooting order, not a narrative order; the edit puts them back
however you want.

---

## Done means

- Five beats in the can, each with a reply you read against its source.
- No number spoken that you did not see on screen that day.
- Beat D not rushed.

Not: perfect. There is no take in this video whose value is smoothness.
