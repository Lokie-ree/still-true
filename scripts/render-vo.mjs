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
// The dash below is a literal EM DASH (U+2014), matching the beat headings.
// Retype it as an en dash and every segment silently vanishes.
const HEADING = /^##\s+([A-E])\s+—/;

const clean = (s) =>
  s
    .replace(/\*\([^)]*\)\*/g, " ")
    .replace(/[*_`>]/g, "") // ">" too: a pasted quoted reply must not be spoken
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
    // Any "## " heading that is not a beat ends the current beat, so blockquotes
    // under Delivery notes are never billed as narration.
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
