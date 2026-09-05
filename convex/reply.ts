// The reply. This is the product — not the board.
//
// Everything upstream exists to make four seconds of reading trustworthy: a
// claim, the sentence from your own document that carries it, and the line
// number so you can go look. The board exists so that line number is
// clickable; the email is what a person actually receives.
//
// Pure functions, so the wording is checked by `npm test` rather than by
// forwarding a document and squinting at Gmail.

import type { Change } from "./change.ts";
import type { ExtractedFinding } from "./extract.ts";
import { questionFor, type DocumentKind } from "./questions.ts";

// "read Sep 4". UTC, because the alternative is a receipt whose date depends
// on which machine rendered it.
const shortDate = (at: number) =>
  new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const plural = (n: number, one: string) =>
  `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

export type ReplyInput = {
  title: string;
  kind: DocumentKind;
  lineCount: number;
  findings: ExtractedFinding[];
  // A forwarded attachment has no URL, so there is nothing to re-fetch and
  // nothing to watch. Offering `watch` on one would be a promise this system
  // cannot keep, so the offer is conditional on the document, not on the copy.
  watchable: boolean;
  checkedAt: number;
};

// A refusal is a SEARCH RESULT, not a verdict, and the difference is the whole
// reason this half of the reply is defensible. The gate can verify an answer by
// opening its citation; it cannot verify a refusal, because there is no
// citation to open. So the sentence claims only what the system actually did —
// it read N lines and did not find this — and never that the fact is absent
// from the world, or from any document but this one.
//
// The plan's mockup read "it defers to Michigan statute without naming one."
// That clause was written by hand for the mockup and CANNOT be generated: a
// `not_stated` finding stores a question key and a line count and nothing else.
// Publishing it would be the product asserting something it did not read.
const refusalLine = (linesSearched: number) =>
  `Searched all ${plural(linesSearched, "line")}. This document does not state it.`;

// Splitting the compound questions was right for the engine contract, but it
// left two findings citing one line with one 600-character quote printed twice
// in a row, which reads as a bug. Two answers, one receipt: group by the line
// they cite, preserving order of first appearance.
type Cited = { answers: string[]; quote: string; lineNo: number };

function groupByLine(
  answered: Extract<ExtractedFinding, { verdict: "answered" }>[],
): Cited[] {
  const byLine = new Map<number, Cited>();
  for (const f of answered) {
    const seen = byLine.get(f.lineNo);
    if (seen === undefined) {
      byLine.set(f.lineNo, {
        answers: [f.answer],
        quote: f.quote,
        lineNo: f.lineNo,
      });
    } else if (!seen.answers.includes(f.answer)) {
      seen.answers.push(f.answer);
    }
  }
  return [...byLine.values()];
}

const FOOTER =
  "Every quote above is a numbered line of your document. I did not write any " +
  "of them — I returned one line number per question and the sentences were " +
  "pulled out by index, so I cannot show you a sentence that is not in your " +
  "document.";

// No opt-in, deliberately. A person who forwards a lease is asking what it
// requires of them; that it stopped requiring it is the same question answered
// later, and making them reply a magic word to hear the answer would be a
// second thing to get wrong for no gain. The threads table IS the subscription
// list — see the schema note on it — so there is nothing to enrol in.
const WATCH =
  "I'll re-read this page daily and email you if any of the clauses above " +
  "stops saying what it says today. You don't need to do anything.";

// Not legal advice, and not a summary. Stated in the artifact a person actually
// reads rather than only in the README.
const DISCLAIMER =
  "This quotes and counts. It does not interpret or advise, and it is not legal advice.";

export function replyBody(input: ReplyInput): { text: string; html: string } {
  const cited = groupByLine(
    input.findings.filter((f) => f.verdict === "answered"),
  );
  const missing = input.findings.filter((f) => f.verdict === "not_stated");
  const read = shortDate(input.checkedAt);

  const opening = `I read ${input.title} — ${plural(input.lineCount, "line")}.`;

  // ── plain text ────────────────────────────────────────────────────────────
  const t: string[] = [opening, ""];

  if (cited.length > 0) {
    t.push("WHAT IT REQUIRES OF YOU", "");
    for (const c of cited) {
      t.push(
        ...c.answers,
        `  "${c.quote}"`,
        `  line ${c.lineNo} · read ${read}`,
        "",
      );
    }
  }

  if (missing.length > 0) {
    t.push("WHAT IT NEVER SAYS", "");
    for (const f of missing) {
      t.push(
        questionFor(input.kind, f.questionKey),
        `  ${refusalLine(f.linesSearched)}`,
        `  not stated · searched ${read}`,
        "",
      );
    }
  }

  if (cited.length === 0 && missing.length === 0) {
    t.push(
      "I could read it, but none of my questions for this kind of document " +
        "were answered in it — and none were clearly absent either. That is a " +
        "result I would rather report than dress up.",
      "",
    );
  }

  t.push(FOOTER);
  if (input.watchable) t.push("", WATCH);
  t.push("", DISCLAIMER);

  // ── html ──────────────────────────────────────────────────────────────────
  // Inline styles only: an email client strips <style> blocks, and a receipt
  // that renders as an unformatted wall is a receipt nobody checks.
  const h: string[] = [
    `<div style="font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171b1a;max-width:640px">`,
    `<p style="margin:0 0 18px">I read <b>${escape(input.title)}</b> — ${plural(input.lineCount, "line")}.</p>`,
  ];

  const label = (text: string, color: string) =>
    `<p style="font:600 11px/1 -apple-system,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:${color};margin:22px 0 10px">${text}</p>`;

  if (cited.length > 0) {
    h.push(label("What it requires of you", "#1b6b57"));
    for (const c of cited) {
      h.push(
        `<div style="margin:0 0 16px;padding-left:14px;border-left:2px solid #dce1db">`,
        ...c.answers.map(
          (a) => `<b style="display:block;margin-bottom:4px">${escape(a)}</b>`,
        ),
        `<i style="color:#67726e">“${escape(c.quote)}”</i>`,
        `<span style="display:block;margin-top:5px;font:11px ui-monospace,Menlo,monospace;color:#8b948f">line ${c.lineNo} · read ${read}</span>`,
        `</div>`,
      );
    }
  }

  if (missing.length > 0) {
    h.push(label("What it never says", "#8a6414"));
    for (const f of missing) {
      h.push(
        `<div style="margin:0 0 16px;padding-left:14px;border-left:2px solid #dce1db">`,
        `<b style="display:block;margin-bottom:4px">${escape(questionFor(input.kind, f.questionKey))}</b>`,
        `<i style="color:#67726e">${escape(refusalLine(f.linesSearched))}</i>`,
        `<span style="display:block;margin-top:5px;font:11px ui-monospace,Menlo,monospace;color:#8b948f">not stated · searched ${read}</span>`,
        `</div>`,
      );
    }
  }

  if (cited.length === 0 && missing.length === 0) {
    h.push(
      `<p style="margin:0 0 16px">I could read it, but none of my questions for this kind of document were answered in it — and none were clearly absent either. That is a result I would rather report than dress up.</p>`,
    );
  }

  h.push(
    `<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #dce1db;font-size:13px;color:#67726e">${FOOTER}</p>`,
  );
  if (input.watchable) {
    h.push(
      `<p style="margin:10px 0 0;font-size:13px;color:#67726e">${WATCH}</p>`,
    );
  }
  h.push(
    `<p style="margin:10px 0 0;font-size:12px;color:#8b948f">${DISCLAIMER}</p>`,
    `</div>`,
  );

  return { text: t.join("\n"), html: h.join("") };
}

// The watch's email — the one this whole project is named for.
//
// A change notice is held to a harder standard than a first reading, because it
// arrives unasked, weeks later, about a document the reader has half forgotten.
// So it says exactly three things and nothing else: what the document used to
// say, in the document's own words; what it says now, in the document's own
// words; and that a machine compared the two texts rather than its own opinions
// of them. No "significant", no "you may want to review", no severity score.
export type ChangeInput = {
  title: string;
  kind: DocumentKind;
  lineCount: number;
  changes: Change[];
  checkedAt: number;
};

// The sentence that stops this being a scary email about nothing. It names the
// method, because the method is the only reason to believe the notice at all.
const HOW =
  "I compared the text of the page against the copy I read last time. This is " +
  "not a judgment that something got worse — it is that these words are not " +
  "the words that were there before.";

export function changeBody(input: ChangeInput): { text: string; html: string } {
  const read = shortDate(input.checkedAt);
  // "2 things ... no longer READS the same way" shipped once, in the first
  // change notice this system ever sent. The subject is plural; so is the verb.
  const n = input.changes.length;
  const headline = `${plural(n, "thing")} I had quoted for you no longer ${
    n === 1 ? "reads" : "read"
  } the same way.`;

  const t: string[] = [`${input.title} changed. ${headline}`, ""];

  const h: string[] = [
    `<div style="font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171b1a;max-width:640px">`,
    `<p style="margin:0 0 18px"><b>${escape(input.title)}</b> changed. ${escape(headline)}</p>`,
  ];

  for (const c of input.changes) {
    const ask = questionFor(input.kind, c.questionKey);
    t.push(ask, "");
    h.push(
      `<div style="margin:0 0 22px;padding-left:14px;border-left:2px solid #dce1db">`,
      `<b style="display:block;margin-bottom:8px">${escape(ask)}</b>`,
    );

    // Every change has a WAS half. A clause that merely APPEARED is not
    // reported at all — see convex/change.ts for why — so there is no branch
    // here for one without a previous receipt.
    t.push(
      `  WAS: "${c.previousQuote}"`,
      `  line ${c.previousLineNo} · ${c.previousAnswer}`,
    );
    h.push(
      `<p style="margin:0 0 2px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#8b948f">Was</p>`,
      `<i style="color:#67726e;text-decoration:line-through">“${escape(c.previousQuote)}”</i>`,
      `<span style="display:block;margin:3px 0 12px;font:11px ui-monospace,Menlo,monospace;color:#8b948f">line ${c.previousLineNo} · ${escape(c.previousAnswer)}</span>`,
    );

    if (c.kind === "gone") {
      // The refusal, arriving as news. It is the same claim the first reading
      // could make about a silent document — that we searched the whole thing
      // and it is not there — and it is worth more here than anywhere else.
      t.push(`  NOW: ${refusalLine(input.lineCount)}`, "");
      h.push(
        `<p style="margin:0 0 2px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#8a6414">Now</p>`,
        `<i style="color:#67726e">${escape(refusalLine(input.lineCount))}</i>`,
      );
    } else {
      t.push(`  NOW: "${c.quote}"`, `  line ${c.lineNo} · ${c.answer}`, "");
      h.push(
        `<p style="margin:0 0 2px;font:600 11px/1 -apple-system,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#1b6b57">Now</p>`,
        `<i style="color:#171b1a">“${escape(c.quote)}”</i>`,
        `<span style="display:block;margin-top:3px;font:11px ui-monospace,Menlo,monospace;color:#8b948f">line ${c.lineNo} · ${escape(c.answer)} · read ${read}</span>`,
      );
    }
    h.push(`</div>`);
  }

  t.push(HOW, "", DISCLAIMER);
  h.push(
    `<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #dce1db;font-size:13px;color:#67726e">${HOW}</p>`,
    `<p style="margin:10px 0 0;font-size:12px;color:#8b948f">${DISCLAIMER}</p>`,
    `</div>`,
  );

  return { text: t.join("\n"), html: h.join("") };
}

// The M1 path: `readAndPublish` throws on a Firecrawl non-200, the 6,000-char
// guard, or a model refusal, and scheduled actions do not retry. Before this
// existed the thread row simply sat at `repliedAt: null` forever and the sender
// heard nothing — the failure was silent to everyone, including us.
//
// The reason is deliberately not forwarded to the sender: it is our stack's
// error text, it can carry a signed URL, and "Firecrawl 502" is not a sentence
// that helps anybody. It goes on the thread row instead, where it is readable.
export function failureBody(title: string): { text: string; html: string } {
  const said =
    `I could not read ${title}.\n\n` +
    `That is my failure, not yours — the document either would not fetch, came ` +
    `back too short to be the real thing, or could not be parsed. Nothing was ` +
    `published about it, because I would rather tell you I could not read it ` +
    `than tell you what it says on a guess.\n\n` +
    `If it came as a link, try forwarding the file itself. If it came as a ` +
    `file, a link to the same document usually works.`;
  return {
    text: said,
    html:
      `<div style="font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171b1a;max-width:640px">` +
      said
        .split("\n\n")
        .map((p) => `<p style="margin:0 0 14px">${escape(p)}</p>`)
        .join("") +
      `</div>`,
  };
}

// Mail that carried no document at all. Recorded like any other message, and
// answered, because a stranger who emails this address and hears nothing back
// learns only that it is broken.
export function noDocumentBody(): { text: string; html: string } {
  const said =
    "I did not find a document in that message.\n\n" +
    "Forward me the file as an attachment, or paste a link to it in the body, " +
    "and I will tell you what it requires of you — every claim quoted from your " +
    "own document with the line it came from, and an honest list of what it " +
    "never says.";
  return {
    text: said,
    html:
      `<div style="font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171b1a;max-width:640px">` +
      said
        .split("\n\n")
        .map((p) => `<p style="margin:0 0 14px">${p}</p>`)
        .join("") +
      `</div>`,
  };
}
