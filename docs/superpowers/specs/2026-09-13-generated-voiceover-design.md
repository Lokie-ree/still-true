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
- Footage-dependent numbers are `[brackets]` until the footage exists: `[N]`
  seconds in B, `[timestamp]` in C. Beat A speaks no line count (M6). D and E
  have no brackets and render before the shoot.
- Beat C never says "this morning" or "overnight"; it says the timestamp on
  screen, in local time, because that is what Gmail shows. The card's
  "11:17 UTC" line changes to match.
- Italic stage directions `*(…)*` are allowed inside a beat and are not spoken.
- The banned-words list from the first draft stays.

## The render script — `scripts/render-vo.mjs`

Node, no dependencies, built-in `fetch`.

- **Parse:** `## X —` sets the beat letter; each blockquote paragraph under it
  is the next segment. Skip `*(…)*` directions. Any segment still containing
  `[` aborts the run naming the id — an unfilled number cannot reach the API.
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
2. Render D and E — locks the voice settings before anything is recorded.
3. Throwaway run of all five, deleted.
4. Record B → A → C → D → E, silent. Read every reply against its source between
   takes (H6 open).
5. With footage open, fill brackets in A, B, C. `--list`, proofread, render.
6. Assemble in Clipchamp as above.

## Documents that move in the same PR

Per `CLAUDE.md`: a change to how a beat is shot reaches every file that
describes it.

- `docs/voiceover.md` → the runbook: keeps its decisions; gains the day's order,
  script usage, settings-lock step; drops the `.txt` reference; names ElevenLabs.
- `docs/shoot-card.md` → spoken bullets become "the line this shot carries";
  timestamp line reads local time; "Fluffed a line" row leaves `IF THIS
  HAPPENS`; "Bracket still unfilled" row joins it.
- `docs/video-script.md` → the four mechanics sections: shoot order, beat C,
  recording checklist (mic test leaves), things that will go wrong. Narration
  beats stay as the reasoning record.
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

- `--list` on the rewritten script: D and E have no brackets; total characters printed.
- One real render of a D segment with locked settings, played back (the only paid test).
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
