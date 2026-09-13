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
  them is the lock. Until Randall reports them, `VOICE_ID` and `MODEL_ID` are
  empty strings, and an empty one aborts before the first API call, the same
  way a bracket does — the first run never spends a failed request to learn it.
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
  runnable check. No test file: the suite's glob is `convex/*.test.ts`, so a
  test here would either be invisible or need the glob widened, which changes
  the count the README carries. Not worth it for ten lines whose failure is
  visible in `--list`.

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

Two decisions make sentences false: **narration is generated** (nothing is
said while recording) and **no fixture re-edit** (the shoot is not "the day
after" the edit; the receipt is the 2026-09-12 notice). The sentences below
are the ones found by reading each file; the implementer re-reads each file
for any this list missed.

- `docs/voiceover.md` → the runbook. Keeps its decisions; gains the shoot-day
  order, script usage, and the settings-lock step; names ElevenLabs. Sentences
  that go false and change: "the refusal count in A" (A carries no number);
  "A, B and C get written after" (only B and C); the example ids `A.mp3,
  B1.mp3` (ids are derived: `A1`, `B1`); every `docs/vo-script.txt` reference,
  including the `wc -c` line and the scope list (the file is `vo-script.md`
  and the count comes from `--list`); "the renderer stays four lines".
- `docs/shoot-card.md` → spoken bullets become "the line this shot carries";
  C's "happened yesterday and overnight" → timeless; the "That arrived at
  11:17 UTC" line reads local time; under *Order*, "The fixture edit went out
  Friday; the cron found it at 11:17 UTC" → "went out 2026-09-11; the cron
  found it the next morning", matching the `CLAUDE.md` rewrite; "Fluffed a
  line" row leaves `IF THIS
  HAPPENS`; "Bracket still unfilled" row joins it; the "Cron mailed nothing
  overnight" row label loses "overnight".
- `docs/video-script.md` → **five** sections describe shoot mechanics, not the
  four `CLAUDE.md` counts, and all five move:
  - *The order it has to be shot in*, step 2: "The day before the shoot, deploy
    the fixture edit … the cron finds it overnight" → the edit went out
    2026-09-11 and the 09-12 notice is the receipt; no edit precedes the shoot.
  - *Beat C*, the mechanics subsection "The change happens the day before":
    "edit and deploy on Friday … shoot Saturday afternoon", "the narration says
    out loud that the change was made deliberately, the day before" → the
    narration says it was made deliberately, without a day. The quoted
    narration block itself (including "I changed it yesterday" and "11:17
    UTC") is the reasoning record and is **not** edited; a one-line note under
    it says the spoken version is in `vo-script.md`.
  - *The recording checklist*: "The fixture edit deployed the day before, and
    not touched since" → "deployed 2026-09-11 and not touched since"; "The
    overnight change notice" → "The 2026-09-12 change notice".
  - *The things that will go wrong*: "Cut the number from the narration" stays
    (still true); "forward again rather than talking around it" → "rather than
    writing around it"; "resolves overnight" and "the edit goes out the day
    before" → dated; the "Friday's … Saturday's" notice paragraph keeps its
    days (history) but "Saturday's is the one with 11:17 UTC on" gains a
    parenthetical with the local time **as read from the inbox at shoot-day
    step 6**, when the `[timestamp]` bracket is filled. Nothing in the repo
    records what Gmail shows, and a previous draft of this spec wrote "6:18 AM
    Central" from a conversion of the stamp, not from the screen — the defect
    this spec exists to stop. Until step 6 the parenthetical is a bracket.
  - *How to actually record it*: the mic test leaves the pre-record list;
    "Rehearse once with recording OFF: read the script aloud" → walk the clicks
    silently; "the narration is what fills it" → the wait is filled in the
    edit; "Fluffed a line? Forward again" leaves; "screen and voice only" →
    "screen only"; the C bullet's "the only shot with a real cost, because
    deploying the edit changes the page for good. Shoot A and B first" goes
    (no edit precedes this shoot; C is the cheapest shot, nothing on camera is
    live); its "$600 → $700, deploy, sweep" recovery line is corrected to
    `bash scripts/recheck-fixture.sh`, which the card already uses; Clipchamp
    gains the audio track and the silence cut.
  - The beat C subsection title "The change happens the day before, and that
    is the point" and its cross-reference under the beat C heading → "The
    change happened before the shoot, and that is the point".
  - `docs/handoff-2026-09-10.md` is on `CLAUDE.md`'s shoot-file list and was
    read: no sentence in it goes false. It is not edited.
- `CLAUDE.md` and its twin `AGENTS.md` → the section count four → five, and
  "The fixture edit goes out the day before and the 11:17 UTC cron finds it"
  → "The fixture edit went out 2026-09-11 and the 11:17 UTC cron found it the
  next morning; the notice is the receipt on any later day."
- `docs/rehearsal.md` → one dated note at top: Saturday's plan executed on a
  later day with generated narration; points at the runbook.
- `hackathon.md` → dated entry for the decision, including that the first VO
  script was the struck first draft and why.
- `.gitignore` → `vo/`.

## Only Randall can do

1. Pay for Starter; confirm the plan reads as commercial.
2. Pick a voice: render one segment in the web app, listen on laptop speakers,
   report voice id and model id. This chooses the voice. The settings lock
   (shoot-day step 2) is a different render, through the script, and is what
   fixes stability, similarity, speed and seed.
3. Put the key in `.env.local`.
4. Record.

## Verification before "done"

- `--list` on the rewritten script: A, D and E have no brackets, B and C have
  exactly one each; total characters printed. The script checks brackets and
  nothing else — no banned-word list, no config.
- By hand, line for line, and stated as such: every spoken line exists on the
  shoot card or is a bracket, no line carries a relative-time word (the list
  above; "on a Tuesday" in C is idiom, not a date, and stays), and no line
  carries a word from the undersell list at the foot of the VO script.
- The settings-lock render (shoot-day step 2), played back. Every later render
  uses the committed constants.
- `npm run gate` before the PR (prod, read-only).

## Out of scope this week

Voice picker, config file, stitching script, regenerating segments that are
fine, anything in the repo beyond the script, the VO script, and the docs above.

**Reusable seams for the next hackathon:** the VO script format and
`render-vo.mjs`. Both are already general. They get a README the day they move
to a second project, not before.

## Delivery

Branch `demo/generated-voiceover-0913`. Checkpoint commits, in order:

1. spec (done);
2. the two untracked files, `docs/voiceover.md` and the struck
   `docs/vo-script.md`, committed **as they are**, so the rewrite is a diff
   and the hackathon entry has a commit to point at;
3. script + gitignore;
4. VO script rewrite;
5. doc updates.

One PR; one concern. The PR opens after commit 5 and **stays open** until the
settings-lock commit (shoot-day step 2) lands on it, since committed constants
are the lock and a PR without them describes a pipeline that has not been
locked. The filled brackets (step 6) go on the same PR. Merge after the
video is assembled.
