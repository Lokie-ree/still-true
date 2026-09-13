# Voiceover — the pipeline, and where it stops

Decided 2026-09-12. The narration is generated, not performed live. The beats are
captured silent and the audio is laid under them in the edit.

**This document covers one video.** It is not a content pipeline, it is not a
reusable tool, and it does not get a `src/` directory. If it grows past a script
that reads a text file and writes numbered mp3s, it has left its scope.

---

## What this changes about the shoot

`shoot-card.md` and `rehearsal.md` were written for live narration. Four things
move, and nothing else.

**The takes are judged on hands, not delivery.** Watch the dry run back for two
things: places you scrolled when you meant not to, and places the cursor stalled.
Where you stopped talking no longer matters — there is no talking.

**The five-forward budget goes further than planned.** The token bucket was a
constraint mostly because a fluffed line forced a re-forward. It doesn't now.
The only reason left to re-forward beat B is a bad answer — H6 — or a bad shot.
Budget accordingly; you have more room than the card assumes.

**The one rule is unchanged and matters more.** Read the reply before you keep
the take. You will be writing narration against footage hours later, and the
failure mode is narrating a claim the footage does not support. The rule was
always the only thing protecting the video. It is now the *only* thing.

**Every number is transcribed, not recalled.** `[N]` seconds in B, the timestamp
in C. Write them into the script with the footage open
in front of you. This is strictly safer than saying them live, and it makes
*"say no number you did not see on screen"* mechanically true rather than a
discipline.

The pauses come from the timeline, not from the model. Don't try to make the
audio produce beat C's silence — cut it in.

---

## The script file

One blockquote per segment under a beat heading, in shooting order, in
`docs/vo-script.md`.

A, D and E have none and render before the shoot; only B and C are written
after.

---

## Settings, locked before the batch

Generate **one** segment, listen on the speakers the judges won't have, then
lock and don't touch again:

- voice id
- model id
- `voice_settings` (stability, `similarity_boost`, speed) — the field is
  `similarity_boost`, not `similarity`; the API accepts the wrong name and
  silently ignores it
- `seed`

A segment re-rendered at 1am with different settings will not sit next to the
ones around it. The join clicks and you will hear it and not know why.

Render each segment to its own file — ids are derived from beat letter and
position: `A1.mp3`, `B1.mp3` — so one rewrite costs one segment.

---

## Credit budget

1 character = 1 credit on `eleven_multilingual_v2`. The full script measures
2,529 characters — about eleven full renders on the Starter tier's 30,000
credits/month, roughly a twelfth of the allowance each. The pre-shoot subset
(beats A, D and E) is 11 segments, 1,326 characters.

Credits are not the reason to avoid re-rendering the whole script. There is
room for it. The reason is the same one above: the joins click. Lock settings
before you batch, and re-render one file, not the script, when one line is
wrong.

Real number:

```
node scripts/render-vo.mjs --list
```

**Check the plan's commercial terms before you submit.** The Free tier (10,000
credits/month) does not list a commercial license. The Starter tier is
$6/month, 30,000 credits/month, and does list one. A hackathon submission is
an ambiguous case and this is not the week to find out. If the account is
free-tier, pay the $6 — it is the cheapest risk you will retire all month, and
it buys the license, not headroom you were short on.

---

## Shoot-day order

1. Pre-flight from the shoot card: the `kind` check, Do Not Disturb, three
   tabs, Gmail filtered.
2. Settings lock — render one D segment, play it on laptop speakers. Right
   means the constants are locked and committed. Wrong means change them,
   delete that one file, repeat. This is the only render that may be repeated
   with different settings.
3. Render the rest of the pre-shoot set (A, D, E) — everything without a
   bracket.
4. Throwaway run of all five beats on camera. Delete it.
5. Record B, A, C, D, E — silent. Read every reply against its source between
   takes (flag H6 is open).
6. With the footage open, fill the two brackets: `[N]` in B and `[timestamp]`
   in C, read off the screen. Then list, proofread, render.
7. Assemble in Clipchamp.

```
node scripts/render-vo.mjs --list
node --env-file=.env.local scripts/render-vo.mjs D1
node --env-file=.env.local scripts/render-vo.mjs A D E
```

The constants in `scripts/render-vo.mjs` are the lock from step 2 — re-rendering
one line means deleting that one file, not touching the constants. Naming
beats (`A D E`) is what makes the pre-shoot render possible while B and C
still hold their brackets; the parser refuses to render a segment with an
unfilled `[` in it. `GET /v1/models` was tried as a way to confirm the model
id and it returns HTTP 401 for a key scoped to Text-to-Speech only — that
confirmation is impossible for a correctly-scoped key, so the settings-lock
render in step 2 is the confirmation instead.

---

## Where this stops

Not in scope, this week or after:

- a voice-selection UI
- a batch renderer with config
- anything in the repo outside `docs/vo-script.md` and one render script
- regenerating beats that are already fine

The student-facing version — the whole pipeline as a lesson, and the voice vote —
happens **after submission**, with the finished video as the exemplar. It is a
better lesson that way and it is not a shoot-week task.