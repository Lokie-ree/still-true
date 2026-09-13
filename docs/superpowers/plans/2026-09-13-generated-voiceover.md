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
| `scripts/render-vo.mjs` | Parse, check, render. Holds the locked voice constants. |
| `vo/` (gitignored) | Build output, one mp3 per segment. |
| `docs/voiceover.md` | The runbook: decisions plus the shoot-day order. |
| `docs/shoot-card.md` | What goes next to the camera. Lines become "what this shot carries". |
| `docs/video-script.md` | Reasoning record plus five shoot-mechanics sections. |
| `CLAUDE.md`, `AGENTS.md` | Project rules; the section count and the fixture-edit sentence. |
| `docs/rehearsal.md`, `hackathon.md` | Dated notes. |

**Verified before this plan was written** (2026-09-13, real calls):

- The key in `.env.local` works, and `git check-ignore` confirms the file is ignored.
- `GET /v1/models` returns **401** for a Text-to-Speech-scoped key, so there is no model-list step in this plan.
- One five-character POST to voice `bIHbv24MWmeRgasZH58o` with `model_id: eleven_multilingual_v2`, `seed`, and `voice_settings.similarity_boost` returned **HTTP 200, 13,836 bytes, MPEG layer III 128 kbps 44.1 kHz mono**. The constants below are the ones that returned audio.

---

### Task 1: Commit the two untracked files unchanged

Gives the rewrite a diff to be read against. Do not edit them in this task.

**Files:**
- Commit as-is: `docs/voiceover.md`, `docs/vo-script.md`

- [ ] **Step 1: Confirm both are untracked**

Run: `git status --short docs/voiceover.md docs/vo-script.md`

Expected: two lines, each starting `??`.

- [ ] **Step 2: Commit**

Message: `docs: the voiceover decision and its first script, as drafted`

Body should say the script does not match the shoot card and is rewritten in a later commit, and that it is committed first so the rewrite reads as a diff.

---

### Task 2: The render script

**Files:**
- Create: `scripts/render-vo.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Add `vo/` to `.gitignore`**

Append a `vo/` line after the existing `.env.local` entry.

- [ ] **Step 2: Write the script**

Create `scripts/render-vo.mjs` with exactly this content:

```js
// Renders docs/vo-script.md to one mp3 per segment.
// Usage:  node --env-file=.env.local scripts/render-vo.mjs [--list]
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
    if (text) segments.push({ id: `${beat}${++n}`, text });
  };
  for (const line of md.split(/\r?\n/)) {
    const m = HEADING.exec(line);
    if (m) {
      flush();
      beat = m[1];
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

const segments = parse(readFileSync(SCRIPT, "utf8"));
if (!segments.length) {
  console.error(`no segments parsed from ${SCRIPT}`);
  process.exit(1);
}

let total = 0;
for (const s of segments) {
  total += s.text.length;
  const mark = s.text.includes("[") ? "  <- unfilled" : "";
  console.log(`${s.id.padEnd(4)} ${String(s.text.length).padStart(4)}${mark}`);
}
console.log(`${segments.length} segments, ${total} characters`);

if (process.argv.includes("--list")) process.exit(0);

const unfilled = segments.filter((s) => s.text.includes("["));
if (unfilled.length) {
  console.error(`unfilled brackets: ${unfilled.map((s) => s.id).join(", ")}`);
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

Note on the heading regex: `—` is the em dash the beat headings already use. Written as an escape so the file has no ambiguity about which dash character is meant.

- [ ] **Step 3: Run the parser against the file that exists now**

The struck `docs/vo-script.md` uses the same heading and blockquote shape, so it exercises the parser before the rewrite lands.

Run: `node scripts/render-vo.mjs --list`

Expected: segment ids grouped in A, B, C, D, E runs, a character count on each line, and a total. No network call is made. The stage direction in B about holding on the round trip must NOT appear as its own segment.

- [ ] **Step 4: Confirm it refuses to spend on unfilled brackets**

The struck script has bracketed placeholders in C.

Run: `node --env-file=.env.local scripts/render-vo.mjs`

Expected: the same table, then a line naming the unfilled segments, then exit 1. No audio written and no request made.

- [ ] **Step 5: Lint**

Run: `npm run lint`

Expected: clean. If ESLint's config does not reach `scripts/`, that is the existing arrangement. Do not widen it.

- [ ] **Step 6: Commit**

Message: `feat: render the voiceover from the script that is read, not a copy of it`

Body should say that segment ids are derived from the beat headings so no id is typed twice, and that an unfilled bracket aborts before the first API call, so a number nobody read off the footage cannot reach the renderer.

---

### Task 3: Rewrite the VO script from the shoot card

**The rule:** every spoken line exists on `docs/shoot-card.md` or is a bracket. The lines below are already derived from the card. Use them. Do not re-derive from memory, which is the defect this whole branch exists to correct.

**Files:**
- Rewrite: `docs/vo-script.md`
- Read, do not edit: `docs/shoot-card.md`

- [ ] **Step 1: Replace the file**

Beats in video order A to E. Keep an on-screen line per beat, the delivery notes, and the undersell word list at the foot. Add near the top:

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

- [ ] **Step 2: Verify the parse**

Run: `node scripts/render-vo.mjs --list`

Expected: 23 segments, ids `A1`-`A4`, `B1`-`B7`, `C1`-`C5`, `D1`-`D4`, `E1`-`E3`. Exactly two lines marked unfilled, `B3` and `C3`. Record the printed character total for the runbook.

- [ ] **Step 3: The by-hand check, and say you did it**

Read all 23 lines against `docs/shoot-card.md`. Confirm and state the result:

1. every line appears on the card or is a bracket;
2. no line carries a relative-time word: `yesterday`, `overnight`, `days ago`, `two days ago`, `Friday`, `Saturday`, `this morning`. "On a Tuesday" in C5 is idiom, not a date, and stays;
3. no line carries an undersell word from the foot of the script: `just`, `simple`, `only`, `a little`, `kind of`, `sort of`, `hopefully`, `I'm still learning`, `two years in`.

- [ ] **Step 4: Commit**

Message: `docs: the VO script says what the shoot card says`

Body should name what the first draft got wrong, the struck opening and the four numbers, and state that every line here is on the card or is a bracket.

---

### Task 4: The runbook

**Files:**
- Modify: `docs/voiceover.md`

- [ ] **Step 1: Correct the sentences the decisions made false**

| Find | Replace with |
|---|---|
| "the refusal count in A" | drop it, A carries no number |
| "A, B and C get written after" | only B and C are written after |
| the example ids `A.mp3`, `B1.mp3` | ids are derived: `A1.mp3`, `B1.mp3` |
| every `docs/vo-script.txt` reference | `docs/vo-script.md` |
| the `wc -c` block | `node scripts/render-vo.mjs --list` |
| "the renderer stays four lines" | drop |

- [ ] **Step 2: Replace the credit budget with the checked numbers**

Free is 10,000 credits a month. Starter is $6 a month and 30,000 credits, and lists a Commercial License that Free does not. At one credit per character, a full render is roughly a fifteenth of the month. Say plainly that the reason not to re-render the whole script is that the joins click, not that credits are scarce. That replaces the old scarcity framing, which was built on the wrong allowance.

- [ ] **Step 3: Add the shoot-day order and the script's usage**

The seven steps from the spec's shoot-day order, plus both commands:

```
node scripts/render-vo.mjs --list
node --env-file=.env.local scripts/render-vo.mjs
```

Say that the constants in `scripts/render-vo.mjs` are the lock, that re-rendering one line means deleting that one file, and that the models-list check was tried and returns 401 on a Text-to-Speech-scoped key, so the settings-lock render is the confirmation.

- [ ] **Step 4: Commit**

Message: `docs: the runbook matches the pipeline that exists`

---

### Task 5: The shoot card

**Files:**
- Modify: `docs/shoot-card.md`

- [ ] **Step 1: Reframe the spoken bullets**

Under each beat, the bullets stop being lines to say and become what this shot has to carry, with a pointer to `docs/vo-script.md` for the words. Do not reword the bullets themselves. Task 3 derived the narration from them and the two must keep matching.

- [ ] **Step 2: Correct the dated and spoken-era lines**

| Find | Replace with |
|---|---|
| under *Order*, "The fixture edit went out Friday; the cron found it at 11:17 UTC." | the edit went out 2026-09-11 and the cron found it the next morning; the notice in the thread is the receipt on any later day |
| in beat C, "happened yesterday and overnight" | happened before this shoot |
| in beat C, "That arrived at 11:17 UTC" | "That arrived at [local time from the inbox]", filled at shoot-day step 6 |
| the `IF THIS HAPPENS` row "Fluffed a line" | delete, there is no line to fluff |
| the row label "Cron mailed nothing overnight" | "Cron mailed nothing" |

- [ ] **Step 3: Add one `IF THIS HAPPENS` row**

Bracket still unfilled: the renderer stopped and named the segment. Open the footage, read the number off the screen, fill it, run again. Never type a number you did not see.

- [ ] **Step 4: Sharpen the one rule**

The rule stays: read the reply before you keep the take. Add that it matters more now, because the narration is written hours later against footage, and the failure mode is narrating a claim the footage does not support.

- [ ] **Step 5: Commit**

Message: `docs: the card is a shot list now, not a script`

---

### Task 6: The video script's five mechanics sections

`CLAUDE.md` says four. There are five. All five move. The narration beats A to E do not.

**Files:**
- Modify: `docs/video-script.md`

- [ ] **Step 1: The order it has to be shot in, step 2**

"The day before the shoot, deploy the fixture edit ... The 11:17 UTC cron finds it overnight" becomes: the edit went out 2026-09-11, the cron found it the next morning, and that notice is the receipt. No edit precedes this shoot. Keep "No deploy happens on shoot day."

- [ ] **Step 2: Beat C's mechanics subsection**

- The subsection title "The change happens the day before, and that is the point" becomes "The change happened before the shoot, and that is the point". Update the cross-reference to it under the beat C heading.
- "So: edit and deploy on Friday, let the 11:17 UTC cron find it Saturday morning, shoot Saturday afternoon" becomes the dated version: deployed 2026-09-11, found 2026-09-12, shoot any later day.
- "the narration says out loud that the change was made deliberately, the day before" becomes: says it was made deliberately, without a day.
- Leave the quoted narration block alone, including "I changed it yesterday" and "11:17 UTC". Add one line under it: the spoken version is in `docs/vo-script.md`, and this block is the reasoning record.

- [ ] **Step 3: The recording checklist**

- "The fixture edit deployed the day before, and not touched since" becomes "deployed 2026-09-11, and not touched since".
- "The overnight change notice is in the thread" becomes "The 2026-09-12 change notice is in the thread".
- Delete the mic test item. There is no live audio.
- Add an item: the settings-lock render is done and `vo/` holds A, D and E.

- [ ] **Step 4: The things that will go wrong**

- "Cut the number from the narration and let the reply show whatever it shows" stays. Still true, and now mechanical.
- "forward again rather than talking around it" becomes "rather than writing around it".
- "The flip now resolves overnight" and "the edit goes out the day before" become dated.
- "Saturday's is the one with 11:17 UTC on" keeps its days as history and gains the inbox's local time in a bracket, filled at shoot-day step 6. Do not convert the UTC stamp yourself. An earlier draft of the spec did exactly that and wrote a time nobody had seen.

- [ ] **Step 5: How to actually record it**

- Delete the mic test from the ten-minute list.
- "Rehearse once with recording OFF ... Read the script aloud while clicking through" becomes: walk the clicks silently and watch the hands. The paragraph about lines that will not fit your mouth moves to the VO script's delivery notes, or goes.
- The B bullet's "the wait is real, 25 to 30 seconds, and the narration is what fills it" becomes: the wait is real and is filled in the edit.
- The B bullet's "Fluffed a line? Forward again" becomes: re-forward only for a bad answer (H6) or a bad shot.
- The A bullet's "screen and voice only" becomes "screen only".
- The C bullet's "the only shot with a real cost, because deploying the edit changes the page for good. Shoot A and B first" goes. No edit precedes this shoot, nothing on camera is live, and C is now among the cheapest shots.
- Its recovery line "edit the clause again, $600 to $700, deploy, sweep" becomes `bash scripts/recheck-fixture.sh`, which the card already uses and which `CLAUDE.md` requires over `watch:sweep`.
- The Clipchamp subsection gains the audio track: segments under their shots, silence cut in for C, and the unedited-duration caption on B if the round trip is trimmed. "No music and no transitions" stays.

- [ ] **Step 6: Confirm nothing was missed**

Run a case-insensitive search of `docs/video-script.md` for: day before, overnight, aloud, mic, fluff, and "narration is what fills".

Expected: every remaining hit sits inside a narration beat A to E, or is a dated historical statement.

- [ ] **Step 7: Commit**

Message: `docs: all five shoot-mechanics sections, not the four we counted`

---

### Task 7: Project rules, rehearsal note, build log

**Files:**
- Modify: `CLAUDE.md`, `AGENTS.md` (twins, identical edits), `docs/rehearsal.md`, `hackathon.md`

- [ ] **Step 1: `CLAUDE.md` and `AGENTS.md`**

- "It has four sections that describe shoot mechanics" becomes five, and "How to actually record it" joins the parenthetical list.
- "The fixture edit goes out the day before and the 11:17 UTC cron finds it" becomes: the edit went out 2026-09-11 and the cron found it the next morning; the notice is the receipt on any later day.
- Add `docs/vo-script.md` to the shoot-file list with one line: it holds the spoken words, derived from the card, and a change to a card line reaches it.

- [ ] **Step 2: Verify the twins stayed identical**

Diff the shoot section of both files, from the "The shoot, until it is shot" heading to end of file.

Expected: no output.

- [ ] **Step 3: `docs/rehearsal.md`**

One dated note at the top: the 09-10 to 09-12 schedule was written for live narration and a same-week shoot; narration is now generated, and the shoot happens on a later day against the 2026-09-12 notice. Point at `docs/voiceover.md`. Leave the schedule below intact as the record.

- [ ] **Step 4: `hackathon.md`**

A dated 2026-09-13 entry covering four things: the switch to generated narration and why; that the first VO script was the struck first draft, and how it got there, written from memory instead of from the card; the checked ElevenLabs numbers and the two corrections, $6 not $5 and 30,000 credits not 10,000; and the models-list step that a correctly-scoped key could not perform, deleted rather than widening the key.

- [ ] **Step 5: Commit**

Message: `docs: the rules, the rehearsal note and the log catch up`

---

### Task 8: Gate and open the PR

- [ ] **Step 1: Run the gate**

Run: `npm run gate`

Expected: lint clean, tests pass, seven production checks pass. Name the deployment the checks ran against when reporting the result.

- [ ] **Step 2: Push and open the PR**

Push the branch, then open the PR against `main` with an explicit base. Write the body to a file first and pass it with `--body-file` rather than inlining a long body.

The body covers: the pipeline's three stages; that the first VO script did not match the card, and why; the checked vendor facts; the deleted models-list step; and that the PR stays open until the settings-lock constants and the filled brackets land on it.

- [ ] **Step 3: Do not merge**

The PR is not complete until Task 9. Merging here would publish a claim that the pipeline is locked when its constants have not been listened to.

---

### Task 9: Shoot day

Randall does the shooting; the agent assists. Not executable ahead of time. It closes the PR opened in Task 8.

- [ ] **Step 1: Pre-flight.** The card's `kind` check, Do Not Disturb, three tabs, Gmail filtered.
- [ ] **Step 2: Settings lock.** Render one D segment and play it on laptop speakers. If it is right, the constants are locked. If not, change them, delete that one file, repeat. Commit the constants.
- [ ] **Step 3: Render A, D and E.** Everything without a bracket.
- [ ] **Step 4: Throwaway run** of all five. Delete it.
- [ ] **Step 5: Record B, A, C, D, E, silent.** Read every reply against its source between takes. H6 is open.
- [ ] **Step 6: Fill the two brackets** from the footage, `[N]` in B and `[timestamp]` in C, read off the screen, plus the local-time parenthetical in `docs/video-script.md`. Then list, proofread, render. Commit.
- [ ] **Step 7: Assemble** in Clipchamp. Export 1080p.
- [ ] **Step 8: Merge the PR.**
