# Generated voiceover for the demo video — design

Decided 2026-09-13. Supersedes nothing; it completes the 2026-09-12 decision in
`docs/voiceover.md` that the narration is generated, not performed live.

## What this is for

One video, 150 seconds, five beats, recorded as soon as the pieces below exist.
The narration is rendered from text with ElevenLabs and laid under silent screen
takes in the edit. Reusing the pipeline for a later hackathon is a stated goal
and is deliberately **not** built here; the seams are named at the end.

## The problem found on 2026-09-12

The first VO script (`docs/vo-script.md` as drafted) did not match the shoot
card in any beat. It re-introduced the "$50 late fee" opening, the 174-line
figure, the score trajectory, and the six-check count — every one already
struck in `docs/video-script.md`, `docs/READINESS.md` or `hackathon.md`. The
cause was writing from memory instead of from the vetted source. The fix is
structural: the VO script is **derived from the shoot card**, and every spoken
line must exist on the card or be a bracket.

## Pipeline

Three stages. Only the second is a program.

1. **Capture** — silent screen takes, one file per shot, Windows `Win+Shift+R`.
   Judged on hands: unintended scrolls and stalled cursors. Not automatable:
   beat B is a live email round trip through Gmail.
2. **Render** — text segments in, one mp3 per segment out. `scripts/render-vo.mjs`.
3. **Assemble** — Clipchamp. Clips on the video track A→E, each segment placed
   under its shot, silence cut in (beat C), duration caption on B if the wait is
   trimmed. No music, no transitions. Export 1080p.

## The VO script — `docs/vo-script.md`

One file. Human-readable and machine-parsed; no second copy.

- Beats in video order A→E. Each beat: `## X — title`, an **On screen** line,
  then the spoken lines as blockquote paragraphs. One blockquote paragraph is
  one segment; ids are derived (`A1`, `A2`, `B1`…), never typed.
- Lines come from the shoot card's bullets, reworded only where speech needs it.
- Footage-dependent numbers are `[brackets]` until the footage exists. There
  are exactly two: `[N]` seconds in B, `[timestamp]` in C. **Beat A has no
  bracket and speaks no number** — the card's A bullets carry none, and M6 is
  why. So A, D and E have no brackets and render before the shoot; only B and C
  are filled after.
- **No relative-time words anywhere.** Not "this morning", "overnight",
  "yesterday", "days ago", "two days ago", "Friday", "Saturday". A, D and E are
  rendered under locked settings before the shoot and must stay true on any
  later day; B and C may be recorded days after the cron fired. The card lines
  that carry these words are reworded timelessly: C's "I changed it yesterday"
  → "I changed it, on purpose, before the watch's next run"; C's "Once, days
  ago" → "once, and left it"; D's "Two days ago a test document proved" → "A
  test document proved". C says the timestamp on screen, in local time, because
  that is what Gmail shows; the card's "11:17 UTC" line changes to match.
- **No fixture re-edit.** The 2026-09-12 notice is the receipt on any later
  day: the change stamps persist and the cron mails nothing while the hash is
  unchanged. If a re-edit is ever forced (the H8 recovery on the card), the
  timestamp bracket is simply filled from the new notice.
- Italic stage directions `*(…)*` are allowed inside a beat and are not spoken.
  The parser strips them wherever they appear; a paragraph that is empty after
  stripping is not a segment.
- The banned-words list from the first draft stays.

## The render script — `scripts/render-vo.mjs`

Node, no dependencies, built-in `fetch`.

- **Parse:** `## X —` sets the beat letter; each blockquote paragraph under it
  is the next segment. Strip `*(…)*` directions; drop paragraphs left empty.
  In render mode, any segment still containing `[` aborts **before the first
  API call**, naming every offending id — an unfilled number cannot reach the
  API and no paid render precedes the check. `--list` does not abort; it shows
  the brackets so they can be found.
- **Settings:** `VOICE_ID`, `MODEL_ID`, `voice_settings` (stability, similarity,
  speed), `SEED` are constants at the top of the file, set once after listening
  to a single rendered segment, then never changed for this video. Committing
  them is the lock.
- **Key:** `ELEVENLABS_API_KEY` from the environment; run with
  `node --env-file=.env.local scripts/render-vo.mjs`. Never in the repo.
- **Output:** `vo/<id>.mp3`; `vo/` is gitignored. Skip-if-exists: delete a file
  to re-render that one line.
- **Modes:** default renders missing segments and prints id, character count,
  running total. `--list` prints the same table and calls nothing — the credit
  check and the proofread.
- **Failure:** non-200 prints id, status, body, and stops; nothing is written
  for that segment, so a rerun picks it up.
- **Check:** the parser is ~10 lines; `--list` against the real file is its
  runnable check. No test file — adding one changes the test glob and the count
  the README carries.

## Licensing

Free-tier ElevenLabs audio is (as recalled; verify on the pricing page)
non-commercial with attribution. A prize hackathon is ambiguous. Decision:
**Starter for one month, cancel after.** Step one of the runbook.

## Shoot-day order

1. Pre-flight from the card, unchanged: `kind` check, Do Not Disturb, three
   tabs, Gmail filtered.
2. Render one D segment. Play it back on laptop speakers. If it is right, the
   settings are locked and committed; if not, change them and delete the file.
   This is the settings-lock step, and the only render that may be repeated
   with different settings.
3. Render the rest of A, D and E — everything without a bracket.
4. Throwaway run of all five, deleted.
5. Record B → A → C → D → E, silent. Read every reply against its source between
   takes (H6 open).
6. With footage open, fill the two brackets in B and C. `--list`, proofread,
   render.
7. Assemble in Clipchamp as above.

## Documents that move in the same PR

Per `CLAUDE.md`: a change to how a beat is shot reaches every file that
describes it.

- `docs/voiceover.md` → the runbook: keeps its decisions; gains the day's order,
  script usage, settings-lock step; drops the `.txt` reference; names ElevenLabs.
- `docs/shoot-card.md` → spoken bullets become "the line this shot carries";
  timestamp line reads local time; "Fluffed a line" row leaves `IF THIS
  HAPPENS`; "Bracket still unfilled" row joins it.
- `docs/video-script.md` → **five** sections describe shoot mechanics, not the
  four `CLAUDE.md` counts, and all five move: the shoot order, beat C, the
  recording checklist, the things that will go wrong, and "How to actually
  record it" (the section that carries the mic test, "the narration is what
  fills it", "Fluffed a line? Forward again", "screen and voice only", and
  "read the script aloud"). The mic test leaves. While that section is open,
  its "$600 → $700, deploy, sweep" recovery line is corrected to
  `bash scripts/recheck-fixture.sh`, which `CLAUDE.md` already requires.
  `CLAUDE.md`'s own count of the sections changes from four to five. The
  narration beats (A–E) stay as the reasoning record and are **not** edited;
  in particular beat C's quoted "11:17 UTC" line stays, and is not a missed
  rename.
- `docs/rehearsal.md` → one dated note at top: Saturday's plan executed on a
  later day with generated narration; points at the runbook.
- `hackathon.md` → dated entry for the decision, including that the first VO
  script was the struck first draft and why.
- `.gitignore` → `vo/`.

## Only Randall can do

1. Pay for Starter; confirm the plan reads as commercial.
2. Pick a voice; render one segment in the web app; listen on laptop speakers;
   report voice id and model id.
3. Put the key in `.env.local`.
4. Record.

## Verification before "done"

- `--list` on the rewritten script: A, D and E have no brackets, B and C have
  exactly one each, no relative-time words anywhere; total characters printed.
- The settings-lock render (shoot-day step 2), played back. Every later render
  uses the committed constants.
- `npm run gate` before the PR (prod, read-only).
- Every spoken line in the final script exists on the shoot card or is a
  bracket — checked by hand, line for line, and stated as such.

## Out of scope this week

Voice picker, config file, stitching script, regenerating segments that are
fine, anything in the repo beyond the script, the VO script, and the docs above.

**Reusable seams for the next hackathon:** the VO script format and
`render-vo.mjs`. Both are already general. They get a README the day they move
to a second project, not before.

## Delivery

Branch `demo/generated-voiceover-0913`. Checkpoint commits: spec → script +
gitignore → VO script rewrite → doc updates. One PR; one concern.
