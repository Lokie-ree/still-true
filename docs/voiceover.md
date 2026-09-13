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
in C, the refusal count in A. Write them into the script with the footage open
in front of you. This is strictly safer than saying them live, and it makes
*"say no number you did not see on screen"* mechanically true rather than a
discipline.

The pauses come from the timeline, not from the model. Don't try to make the
audio produce beat C's silence — cut it in.

---

## The script file

One line per segment, blank-line separated, in shooting order. Keep it as
`docs/vo-script.txt` so the renderer stays four lines.

Beats D and E have no footage-dependent numbers, so they can be rendered before
the shoot. A, B and C get written after.

---

## Settings, locked before the batch

Generate **one** segment, listen on the speakers the judges won't have, then
lock and don't touch again:

- voice id
- model id
- `voice_settings` (stability, similarity, speed)
- `seed`

A segment re-rendered at 1am with different settings will not sit next to the
ones around it. The join clicks and you will hear it and not know why.

Render each segment to its own file — `A.mp3`, `B1.mp3` — so one rewrite costs
one segment.

---

## Credit budget

1 character = 1 credit on the Multilingual v2/v3 models. Flash and Turbo are
0.5. The narration across all five beats is roughly 2,400 characters.

So on 10,000 credits: **about four full renders**, or many more if you only
re-render the segment you changed. That is enough and it is not generous. The
discipline that protects it is the same one above — lock settings before you
batch, never re-render the whole script to fix one line.

Real number:

```
wc -c docs/vo-script.txt
```

**Check the plan's commercial terms before you submit.** 10,000 credits/month is
the free tier allowance, and the free tier restricts commercial use. A hackathon
submission is an ambiguous case and this is not the week to find out. The paid
entry tier is $5 and carries a commercial license. If the account is free-tier,
pay the $5 — it is the cheapest risk you will retire all month.

---

## Where this stops

Not in scope, this week or after:

- a voice-selection UI
- a batch renderer with config
- anything in the repo outside `docs/vo-script.txt` and one render script
- regenerating beats that are already fine

The student-facing version — the whole pipeline as a lesson, and the voice vote —
happens **after submission**, with the finished video as the exemplar. It is a
better lesson that way and it is not a shoot-week task.