# Generated Voiceover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace live narration with generated narration for the demo video: one VO script derived from the shoot card, one render script that turns it into per-segment mp3s, and every document that describes how a beat is shot brought into line.

**Architecture:** `docs/vo-script.md` is the single source of the spoken words, human-readable and machine-parsed, with no second copy. `scripts/render-vo.mjs` parses it, derives segment ids from the beat headings, and posts each segment to ElevenLabs using constants committed in the file. Audio lands in a gitignored `vo/`. No config, no dependencies, no test framework.

**Tech Stack:** Node 22 (built-in `fetch`, `--env-file`), ElevenLabs text-to-speech, Clipchamp for assembly.

**Spec:** [`docs/superpowers/specs/2026-09-13-generated-voiceover-design.md`](../specs/2026-09-13-generated-voiceover-design.md)

---

## File Structure

| File | Responsibility |
|---|---|
| `docs/vo-script.md` | The spoken words. Source of truth for narration; parsed by the renderer. |
| `scripts/render-vo.mjs` | Parse, select, check, render. Holds the locked voice constants. |
| `vo/` (gitignored) | Build output, one mp3 per segment. |
| `docs/voiceover.md` | The runbook: decisions plus the shoot-day order. |
| `docs/shoot-card.md` | What goes next to the camera. Lines become "what this shot carries". |
| `docs/video-script.md` | Reasoning record plus five shoot-mechanics sections. |
| `CLAUDE.md`, `AGENTS.md` | Project rules; the section count and the fixture-edit sentence. |
| `docs/rehearsal.md`, `hackathon.md` | Dated notes. |

## What was run, not predicted (2026-09-13)

Every number in this plan came from executing the code below, not from reading it.

- The key in `.env.local` works; `git check-ignore` confirms the file is ignored.
- `GET /v1/models` returns **401** for a Text-to-Speech-scoped key, so there is no model-list step.
- One five-character POST to voice `bIHbv24MWmeRgasZH58o` with `model_id: eleven_multilingual_v2`, `seed`, and `voice_settings.similarity_boost` returned **HTTP 200, 13,836 bytes, MPEG layer III 128 kbps 44.1 kHz mono**.
- The parser on the **current struck** `docs/vo-script.md`: 21 segments, 1,917 characters, `C3` the only unfilled one.
- The parser on the **rewritten** script in Task 3: 23 segments, **2,529 characters**, `B3` and `C3` unfilled.
- The pre-shoot subset `A D E`: 11 segments, **1,326 characters**, and render mode proceeds past the bracket check.
- Beat terminator proven with a fixture: blockquotes under a `## Delivery notes` heading produce no segments.

---

### Task 1: Commit the two untracked files unchanged

Gives the rewrite a diff to be read against. Do not edit them in this task.

**Files:** commit as-is `docs/voiceover.md`, `docs/vo-script.md`

- [ ] **Step 1: Confirm both are untracked**

Run: `git status --short docs/voiceover.md docs/vo-script.md`

Expected: two lines, each starting `??`.

- [ ] **Step 2: Commit**

Message: `docs: the voiceover decision and its first script, as drafted`

Body: the script does not match the shoot card and is rewritten in a later commit; it is committed first so the rewrite reads as a diff.

---

### Task 2: The render script

**Files:**
- Create: `scripts/render-vo.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Add `vo/` to `.gitignore`**

Append a `vo/` line after the existing `.env.local` entry (currently line 5).

- [ ] **Step 2: Write the script**

Create `scripts/render-vo.mjs` with exactly this content. It has been run against both the current and the rewritten script; do not "improve" the parser without re-running both.

```js
// Renders docs/vo-script.md to one mp3 per segment.
// Usage:  node --env-file=.env.local scripts/render-vo.mjs [--list] [id...]
//   render-vo.mjs --list        every segment, no calls
//   render-vo.mjs D1            just that segment
//   render-vo.mjs A D E         every segment of those beats
// Locked 2026-09-13. Changing a constant below renders audio that will not
// sit next to audio already cut into the timeline. The join clicks.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const VOICE_ID = "bIHbv24MWmeRgasZH58o";
const MODEL_ID = "eleven_multilingual_v2";
const SEED = 42;
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  speed: 1.0,
  use_speaker_boost: true,
};

const SCRIPT = "docs/vo-script.md";
const OUT = "vo";
const HEADING = /^##\s+([A-E])\s+—/;

const clean = (s) =>
  s
    .replace(/\*\([^)]*\)\*/g, " ")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function parse(md) {
  const segments = [];
  let beat = null;
  let n = 0;
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const text = clean(buf.join(" "));
    buf = [];
    if (beat && text) segments.push({ id: `${beat}${++n}`, text });
  };
  for (const line of md.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      flush();
      const m = HEADING.exec(line);
      beat = m ? m[1] : null;
      n = 0;
      continue;
    }
    if (!beat) continue;
    if (line.startsWith(">")) {
      const body = line.slice(1).trim();
      if (body) buf.push(body);
      else flush();
    } else {
      flush();
    }
  }
  flush();
  return segments;
}

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const want = args.filter((a) => !a.startsWith("--"));

const all = parse(readFileSync(SCRIPT, "utf8"));
if (!all.length) {
  console.error(`no segments parsed from ${SCRIPT}`);
  process.exit(1);
}

const segments = want.length
  ? all.filter((s) => want.some((w) => s.id === w || s.id.startsWith(w)))
  : all;
if (!segments.length) {
  console.error(`nothing matches ${want.join(" ")} (parsed ${all.length})`);
  process.exit(1);
}

let total = 0;
for (const s of segments) {
  total += s.text.length;
  const mark = s.text.includes("[") ? "  <- unfilled" : "";
  console.log(`${s.id.padEnd(4)} ${String(s.text.length).padStart(4)}${mark}`);
}
console.log(`${segments.length} segments, ${total} characters`);

if (listOnly) process.exit(0);

const unfilled = segments.filter((s) => s.text.includes("["));
if (unfilled.length) {
  console.error(
    `unfilled brackets: ${unfilled.map((s) => s.id).join(", ")}\n` +
      `fill them from the footage, or name the beats you can render (e.g. A D E)`,
  );
  process.exit(1);
}

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY not set (use --env-file=.env.local)");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
for (const s of segments) {
  const file = `${OUT}/${s.id}.mp3`;
  if (existsSync(file)) {
    console.log(`${s.id} skip (exists)`);
    continue;
  }
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: s.text,
        model_id: MODEL_ID,
        seed: SEED,
        voice_settings: VOICE_SETTINGS,
      }),
    },
  );
  if (!res.ok) {
    console.error(`${s.id} HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${s.id} wrote ${file}`);
}
```

Two details that look incidental and are not:

- **The heading regex holds a literal em dash (U+2014)**, the character the beat headings already use. Retype it and you may get an en dash, and every segment silently disappears.
- **Any `## ` heading that is not a beat clears the beat.** Without that line, blockquotes under *Delivery notes* parse as `E4`, `E5`, and because they carry no bracket they render and bill without complaint. This was found by running a fixture, not by reading the code.

- [ ] **Step 3: Run the parser against the file that exists now**

Run: `node scripts/render-vo.mjs --list`

Expected exactly: **21 segments, 1,917 characters**, ids `A1`-`A4`, `B1`-`B5`, `C1`-`C5`, `D1`-`D4`, `E1`-`E3`, with `C3` the only line marked unfilled. No network call. The stage direction in B about holding on the round trip produces no segment.

- [ ] **Step 4: Confirm it refuses to spend on an unfilled bracket**

Run: `node --env-file=.env.local scripts/render-vo.mjs`

Expected: the same table, then `unfilled brackets: C3`, then **exit 1**. No audio written, no request made. Check the exit code directly; do not pipe the output through `tail`, which masks it.

- [ ] **Step 5: Confirm a subset renders while brackets remain**

Run: `node scripts/render-vo.mjs --list A D E`

Expected: **11 segments, 1,061 characters** against the current file, none unfilled. This is the mechanism the whole pre-shoot render depends on.

- [ ] **Step 6: Lint**

Run: `npm run lint`

Expected: clean. ESLint's rules are scoped to `**/*.{ts,tsx}`, so this file lints with no rules applied. Do not widen the config to cover it.

- [ ] **Step 7: Commit**

Message: `feat: render the voiceover from the script that is read, not a copy of it`

Body: ids are derived from the beat headings so no id is typed twice; an unfilled bracket aborts before the first API call, so a number nobody read off the footage cannot reach the renderer; naming beats renders a subset, which is what lets A, D and E go before the shoot.

---

### Task 3: Rewrite the VO script from the shoot card

**The rule:** every spoken line exists on `docs/shoot-card.md` or is a bracket. The lines below are already derived from the card. Use them. Do not re-derive from memory, which is the defect this whole branch exists to correct.

**Files:**
- Rewrite: `docs/vo-script.md`
- Read: `docs/shoot-card.md` (Task 5 edits it; this task does not)

- [ ] **Step 1: Replace the file**

Beats in video order A to E. **The five heading lines must be exactly these**, because the parser keys on them and on the em dash in particular:

```
## A — what it never says
## B — why you can believe it
## C — the change nobody asked for
## D — what it does when it is wrong
## E — the stack
```

Under each heading put one bold **On screen:** line, then the spoken lines as blockquote paragraphs separated by a bare `>`. Keep a *Delivery notes* section and the undersell word list at the foot, both as plain headings with **no blockquotes** under them. The old file's "all six segments" line is wrong twice over and goes; it is 23 segments.

Add near the top:

> **Every line below exists on `docs/shoot-card.md` or is a bracket.** Two brackets, both filled from footage: `[N]` in B and `[timestamp]` in C. A, D and E carry no bracket and render before the shoot. No relative-time word appears anywhere, because A, D and E are rendered under locked settings and have to stay true on whatever day you record.

The spoken lines:

**A.** On screen: the health plan card, four refusals, no scrolling.

> You can read a document once. You can't notice what it doesn't say, there's nothing there to notice.
>
> This is the government's model health plan summary. The form every insurer fills in.
>
> No single line of it tells you how to cancel your coverage.
>
> Something read every line to be able to say that. I opened the source PDF and checked it by hand.

**B.** On screen: the forward, the reply landing, then the quote checked against the lease with Ctrl+F.

> Here's the same thing, live, on a document you can go read yourself.
>
> No app. No upload. No account. I sent it to an email address.
>
> That took [N] seconds.
>
> Every claim comes back with a sentence from the document and the line it's on.
>
> The plain sentence is the model's summary. The quote under it isn't.
>
> The model returns a line number. The server cuts that sentence out of your document by index, after the model is done talking.
>
> So it can't show you a sentence that isn't in your document.

**C.** On screen: the fixture as it now reads, then the notice in the inbox with its timestamp.

> This page is a fixture I control. I changed it, on purpose, before the watch's next run, and I'm telling you so the next part means something.
>
> I asked one question about this page. Once, and then left it alone.
>
> That arrived at [timestamp]. I didn't run it. It's a daily job, and it found this while nobody was looking.
>
> Two things I'd quoted don't read the same way. It's not telling me the lease got worse, it isn't qualified to judge that. It's telling me these aren't the words that were there.
>
> It won't email you because a model answered differently on a Tuesday. A change is reported when the hash of the text moved and the exact clause it quoted is gone. Both gates are string comparisons. Neither asks the model again.

**D.** On screen: the no-document reply, then the health plan refusal.

> When it can't do the job it says so. It doesn't invent a document to talk about.
>
> This used to say "this document does not state it." A test document proved that can be false, a fact split across two lines is in the document and on no single line of it.
>
> So now it says what it actually knows: no single line states it. That's weaker than what I shipped, and it's the version that's true.
>
> Everything currently wrong with this is in the repo, scored, with the fixed ones still on the page so nobody rediscovers them.

**E.** On screen: the reply. Not a logo.

> Convex is the whole backend. One deployment: the schema, the documents and findings, the daily cron, the reactive queries behind that page, the workpool that retries a failed re-check, the HTTP action the mail webhook hits, and the site itself. No server. No separate host. No queue.
>
> AgentMail is the inbox. Firecrawl parses the PDFs.
>
> There's no app. The interface is your mail client. One question, forwarded once, answered with receipts, and watched until it stops being true.

**Three of these lines differ from the card on purpose** — C1, C2 and D2 drop `yesterday`, `days ago` and `Two days ago`. Task 5 Step 2 makes the matching edit on the card. Until that task lands, the by-hand check in Step 3 will flag them, which is correct.

- [ ] **Step 2: Verify the parse**

Run: `node scripts/render-vo.mjs --list`

Expected exactly: **23 segments, 2,529 characters**, ids `A1`-`A4`, `B1`-`B7`, `C1`-`C5`, `D1`-`D4`, `E1`-`E3`, with exactly two marked unfilled, `B3` and `C3`. If any other id appears, a blockquote has leaked under a non-beat heading.

Also run: `node scripts/render-vo.mjs --list A D E`

Expected: **11 segments, 1,326 characters**, none unfilled. This is the pre-shoot set.

- [ ] **Step 3: The by-hand check, and say you did it**

Read all 23 lines against `docs/shoot-card.md`. Confirm and state the result:

1. every line appears on the card, is one of the three deliberate rewordings above, or is a bracket;
2. no line carries a relative-time word: `yesterday`, `overnight`, `days ago`, `two days ago`, `Friday`, `Saturday`, `this morning`. "On a Tuesday" in C5 is idiom, not a date, and stays;
3. no line carries an undersell word from the foot of the script: `just`, `simple`, `only`, `a little`, `kind of`, `sort of`, `hopefully`, `I'm still learning`, `two years in`.

- [ ] **Step 4: Commit**

Message: `docs: the VO script says what the shoot card says`

Body: name what the first draft got wrong, the struck opening and the four numbers, and state that every line is on the card, a named rewording, or a bracket.

---

### Task 4: The runbook

**Files:** modify `docs/voiceover.md`

- [ ] **Step 1: Correct the sentences the decisions made false**

| Find | Replace with |
|---|---|
| "the refusal count in A" | drop it; A carries no number |
| "A, B and C get written after" | only B and C are written after |
| the example ids `A.mp3`, `B1.mp3` | ids are derived: `A1.mp3`, `B1.mp3` |
| every `docs/vo-script.txt` reference | `docs/vo-script.md` |
| the `wc -c` block | `node scripts/render-vo.mjs --list` |
| "the renderer stays four lines" | drop |
| "`voice_settings` (stability, **similarity**, speed)" | `similarity_boost` — the wrong name is accepted and silently ignored |

- [ ] **Step 2: Replace the credit budget with the measured numbers**

Free is 10,000 credits a month. Starter is **$6** a month and **30,000** credits, and lists a Commercial License that Free does not. The rewritten script measures **2,529 characters**, so a full render is about **a twelfth of the month, roughly eleven full renders**. The pre-shoot set is 1,326.

Say plainly that the reason not to re-render the whole script is that the joins click, not that credits are scarce. That replaces the old scarcity framing, which was built on the wrong allowance and on the struck script's 1,917 characters.

- [ ] **Step 3: Add the shoot-day order and the script's usage**

The seven steps from the spec's shoot-day order, plus all three invocations:

```
node scripts/render-vo.mjs --list
node --env-file=.env.local scripts/render-vo.mjs D1
node --env-file=.env.local scripts/render-vo.mjs A D E
```

Say that the constants in `scripts/render-vo.mjs` are the lock; that re-rendering one line means deleting that one file; that naming beats is what makes the pre-shoot render possible while B and C still hold brackets; and that the models-list check was tried and returns 401 on a Text-to-Speech-scoped key, so the settings-lock render is the confirmation.

- [ ] **Step 4: Commit**

Message: `docs: the runbook matches the pipeline that exists`

---

### Task 5: The shoot card

**Files:** modify `docs/shoot-card.md`

- [ ] **Step 1: Reframe the spoken bullets**

Under each beat, the bullets stop being lines to say and become what this shot has to carry, with a pointer to `docs/vo-script.md` for the words. Reword a bullet only where Step 2 says to. The card and the VO script have to keep matching in both directions.

- [ ] **Step 2: Correct the dated and spoken-era lines**

The first three rows are the rewordings Task 3 already made in the VO script. Without them the card and the script disagree and Task 3's by-hand check fails.

| Find | Replace with |
|---|---|
| beat C: "I changed it **yesterday**, on purpose" | "I changed it, on purpose, before the watch's next run" |
| beat C: "Once, **days ago**. Then I went to bed." | "Once, and then left it alone." |
| beat D: "**Two days ago** a test document proved" | "A test document proved" |
| beat C: "happened yesterday and overnight" | happened before this shoot |
| beat C: "That arrived at 11:17 UTC" | "That arrived at [local time from the inbox]", filled at shoot-day step 6 |
| under *Order*: "The fixture edit went out Friday; the cron found it at 11:17 UTC." (wraps across two lines) | the edit went out 2026-09-11 and the cron found it the next morning; the notice in the thread is the receipt on any later day |
| `IF THIS HAPPENS` row "Fluffed a line" | delete; there is no line to fluff |
| the row label "Cron mailed nothing overnight" | "Cron mailed nothing" |

- [ ] **Step 3: Add one `IF THIS HAPPENS` row**

Bracket still unfilled: the renderer stopped and named the segment. Open the footage, read the number off the screen, fill it, run again. Never type a number you did not see. To render everything else meanwhile, name the beats: `A D E`.

- [ ] **Step 4: Sharpen the one rule**

The rule stays: read the reply before you keep the take. Add that it matters more now, because the narration is written hours later against footage, and the failure mode is narrating a claim the footage does not support.

- [ ] **Step 5: Re-run the by-hand check from Task 3 Step 3**

With the card now edited, all three conditions must hold with no exceptions. State the result.

- [ ] **Step 6: Commit**

Message: `docs: the card is a shot list now, not a script`

---

### Task 6: The video script's five mechanics sections

`CLAUDE.md` says four. There are five. All five move. The narration beats A to E do not.

**Files:** modify `docs/video-script.md`

- [ ] **Step 1: The order it has to be shot in, step 2**

"The day before the shoot, deploy the fixture edit ... The 11:17 UTC cron finds it overnight" becomes: the edit went out 2026-09-11, the cron found it the next morning, and that notice is the receipt. No edit precedes this shoot. Keep "No deploy happens on shoot day."

- [ ] **Step 2: Beat C's mechanics subsection**

- The subsection title "The change happens the day before, and that is the point" becomes "The change happened before the shoot, and that is the point". Update the cross-reference to it under the beat C heading.
- "So: edit and deploy on Friday, let the 11:17 UTC cron find it Saturday morning, shoot Saturday afternoon" becomes the dated version: deployed 2026-09-11, found 2026-09-12, shoot any later day.
- "the narration says out loud that the change was made deliberately, the day before" becomes: says it was made deliberately, without a day.
- Leave the quoted narration block alone, including "I changed it yesterday" and "11:17 UTC". Add one line under it: the spoken version is in `docs/vo-script.md`, and this block is the reasoning record.

- [ ] **Step 3: The recording checklist**

- "The fixture edit deployed **the day before**, and not touched since" becomes "deployed **2026-09-11**, and not touched since". The bold markers sit inside the phrase, so a literal grep for the plain sentence will miss it.
- "The overnight change notice is in the thread" becomes "The 2026-09-12 change notice is in the thread".
- Add an item: the settings-lock render is done and `vo/` holds A, D and E.

There is no mic item in this checklist; the mic test is in the ten-minute list and Step 5 removes it.

- [ ] **Step 4: The things that will go wrong**

- "Cut the number from the narration and let the reply show whatever it shows" stays. Still true, and now mechanical.
- "forward again rather than talking around it" becomes "rather than writing around it".
- "The flip now resolves overnight" and "the edit goes out the day before" become dated.
- "Saturday's is the one with 11:17 UTC on" keeps its days as history and gains the inbox's local time in a bracket, filled at shoot-day step 6. Do not convert the UTC stamp yourself. An earlier draft of the spec did exactly that and wrote a time nobody had seen.

- [ ] **Step 5: How to actually record it**

- Delete the mic test, item 4 of the ten-minute list.
- "Rehearse once with recording OFF ... Read the script aloud while clicking through" becomes: walk the clicks silently and watch the hands. The paragraph about lines that will not fit your mouth moves to the VO script's delivery notes, or goes.
- The B bullet's "the wait is real, 25 to 30 seconds, and the narration is what fills it" becomes: the wait is real and is filled in the edit.
- The B bullet's "Fluffed a line? Forward again" becomes: re-forward only for a bad answer (H6) or a bad shot.
- The A bullet's "screen and voice only" becomes "screen only".
- The C bullet's "the only shot with a real cost, because deploying the edit changes the page for good. Shoot A and B first" goes. No edit precedes this shoot, nothing on camera is live, and C is now among the cheapest shots.
- Its recovery line "edit the clause again, $600 to $700, deploy, sweep" becomes `bash scripts/recheck-fixture.sh`, which the card already uses and which `CLAUDE.md` requires over `watch:sweep`.
- The Clipchamp subsection gains the audio track: segments under their shots, silence cut in for C, and the unedited-duration caption on B if the round trip is trimmed. "No music and no transitions" stays.

- [ ] **Step 6: Confirm nothing was missed**

Search `docs/video-script.md`, case-insensitively, for: day before, overnight, aloud, mic, fluff, and "narration is what fills". Expect every remaining hit to sit inside a narration beat A to E, or to be a dated historical statement. Bold markers break literal matches, so search for short fragments rather than whole sentences.

- [ ] **Step 7: Commit**

Message: `docs: all five shoot-mechanics sections, not the four we counted`

---

### Task 7: Project rules, rehearsal note, build log

**Files:** modify `CLAUDE.md`, `AGENTS.md` (twins, identical edits), `docs/rehearsal.md`, `hackathon.md`

- [ ] **Step 1: `CLAUDE.md` and `AGENTS.md`**

- "It has four sections that describe shoot mechanics" becomes five, and "How to actually record it" joins the parenthetical list.
- "The fixture edit goes out the day before and the 11:17 UTC cron finds it" becomes: the edit went out 2026-09-11 and the cron found it the next morning; the notice is the receipt on any later day.
- Add `docs/vo-script.md` to the shoot-file list with one line: it holds the spoken words, derived from the card, and a change to a card line reaches it.

- [ ] **Step 2: Verify the twins stayed identical**

Diff the shoot section of both files, from the "The shoot, until it is shot" heading to end of file. Expected: no output. They are byte-identical today, so any difference is this task's.

- [ ] **Step 3: `docs/rehearsal.md`**

One dated note at the top: the 09-10 to 09-12 schedule was written for live narration and a same-week shoot; narration is now generated, and the shoot happens on a later day against the 2026-09-12 notice. Point at `docs/voiceover.md`. Leave the schedule below intact as the record.

- [ ] **Step 4: `hackathon.md`**

A dated 2026-09-13 entry covering five things:

1. the switch to generated narration and why;
2. the first VO script was the struck first draft, and how it got there, written from memory instead of from the card;
3. the checked ElevenLabs numbers and the two corrections, $6 not $5 and 30,000 credits not 10,000;
4. the models-list step that a correctly-scoped key could not perform, deleted rather than widening the key;
5. the two parser defects a review caught by running the code rather than reading it: a whole-file bracket abort that would have made every pre-shoot render impossible, and a missing beat terminator that would have billed for the delivery notes.

- [ ] **Step 5: Commit**

Message: `docs: the rules, the rehearsal note and the log catch up`

---

### Task 8: Gate and open the PR

- [ ] **Step 1: Run the gate**

Run: `npm run gate`

Expected: lint clean, tests pass, seven production checks pass. Name the deployment the checks ran against when reporting the result.

- [ ] **Step 2: Push and open the PR**

Push the branch, then open the PR against `main` with an explicit `--base main`. Write the body to a file first and pass it with `--body-file`.

The body covers: the pipeline's three stages; that the first VO script did not match the card, and why; the checked vendor facts; the deleted models-list step; the two parser defects found by execution; and that the PR stays open until the settings-lock constants and the filled brackets land on it.

- [ ] **Step 3: Do not merge**

The PR is not complete until Task 9. Merging here publishes a claim that the pipeline is locked when its constants have not been listened to.

---

### Task 9: Shoot day

Randall shoots; the agent assists. Not executable ahead of time. It closes the PR opened in Task 8.

- [ ] **Step 1: Pre-flight.** The card's `kind` check, Do Not Disturb, three tabs, Gmail filtered.
- [ ] **Step 2: Settings lock.** `render-vo.mjs D1`, then play `vo/D1.mp3` on laptop speakers. Right means the constants are locked. Wrong means change them, delete that one file, repeat. Commit the constants.
- [ ] **Step 3: Render the pre-shoot set.** `render-vo.mjs A D E` — 11 segments, 1,326 characters. `D1` is skipped as already present.
- [ ] **Step 4: Throwaway run** of all five beats on camera. Delete it.
- [ ] **Step 5: Record B, A, C, D, E, silent.** Read every reply against its source between takes. H6 is open.
- [ ] **Step 6: Fill the two brackets** from the footage, `[N]` in B and `[timestamp]` in C, read off the screen, plus the local-time parenthetical in `docs/video-script.md`. Then `--list`, proofread, and run the renderer with no filter to pick up B and C. Commit.
- [ ] **Step 7: Assemble** in Clipchamp. Export 1080p.
- [ ] **Step 8: Merge the PR.**
