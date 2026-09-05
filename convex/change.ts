// What moved between two readings of the same document.
//
// Pure, so the rule that decides whether a person gets an email is checked by
// `npm test` rather than by editing a live page and waiting for the cron.
//
// The whole design rests on one measurement. On 2026-09-04 the same six
// documents were read on two deployments hours apart: development answered 36
// of 47 checklist cells, production answered 34, and AT&T answered 7 where
// development answered 8. Nothing about those documents changed — the model is
// not deterministic. So a watch that diffs ANSWERS emails people that their
// lease changed when it did not, which is worse than no watch at all.
//
// Therefore: `diff()` is never consulted unless the document's stored hash
// already differs from what it reads as now. This function decides WHAT to say
// about a change; it never decides THAT one happened.

import type { ExtractedFinding } from "./extract.ts";

// A stored finding, narrowed to the fields a diff reads. Deliberately not the
// full row type: this function must stay callable from a test with a literal.
export type PriorFinding =
  | {
      questionKey: string;
      verdict: "answered";
      answer: string;
      quote: string;
      lineNo: number;
    }
  | { questionKey: string; verdict: "not_stated" };

export type Change =
  // The document still answers the question, and says something different.
  | {
      kind: "moved";
      questionKey: string;
      previousAnswer: string;
      previousQuote: string;
      previousLineNo: number;
      answer: string;
      quote: string;
      lineNo: number;
    }
  // It used to answer and now does not. The alarming one, and the reason a
  // refusal has to be a first-class verdict rather than an absence.
  | {
      kind: "gone";
      questionKey: string;
      previousAnswer: string;
      previousQuote: string;
      previousLineNo: number;
    };

// The second gate, and the reason this function needs the document text.
//
// The hash proves the PAGE moved. It does not prove that any particular
// finding moved, and on 2026-09-05 the difference showed up in one
// run: the fixture was re-read after an edit that touched only a disclosure
// paragraph, and question U2 went from "a late charge of Fifty and 00/100
// Dollars ($50.00)" at line 24 to not_stated — with that sentence still sitting
// in the document, untouched. On a page that had genuinely changed elsewhere,
// that drift would have mailed somebody that their late-fee clause had been
// deleted.
//
// So: a clause is only reported as changed if the clause it used to quote is no
// longer IN the document. That is a string search over the text we just read —
// deterministic, no model, no second opinion. If the old sentence is still
// there, the document still says it, whatever this run's extraction decided.
const flatten = (s: string) => s.replace(/\s+/g, " ").trim();

// Whitespace only. The quote was sliced out of these very lines, so anything
// fancier would be guessing at a mismatch that cannot happen.
const stillSays = (lines: readonly string[], quote: string) =>
  flatten(lines.join(" ")).includes(flatten(quote));

// The QUOTE is the identity of an answer, not the prose around it.
//
// `answer` is the model's sentence and drifts between runs even on identical
// text; `quote` is a slice of the document, pulled out by line index, and
// changes only when the document does. Comparing quotes is what keeps a
// re-worded answer from being reported as a changed clause.
//
// Line numbers are deliberately NOT part of the comparison. Stripping converter
// markup on 09-04 moved Livonia 421 lines to 418 and AT&T 2,059 to 2,007 with
// no word of either document changing: a reflow shifts every line at once, and
// a watch keyed on position would have declared all six documents rewritten.
export function diff(
  before: readonly PriorFinding[],
  after: readonly ExtractedFinding[],
  // The document as it reads now. The caller has it in memory; it is
  // deliberately never stored.
  now: readonly string[],
): Change[] {
  const prior = new Map(before.map((f) => [f.questionKey, f]));
  const changes: Change[] = [];

  for (const found of after) {
    const was = prior.get(found.questionKey);
    // A question that was never asked before is not a change — it is a first
    // answer. This happens when the classifier moves a document to a different
    // checklist, and reporting it as "the document changed" would be false.
    if (was === undefined) continue;

    // Same receipt, same clause. The answer's prose may have been reworded by
    // this run; the document has not moved.
    if (
      found.verdict === "answered" &&
      was.verdict === "answered" &&
      found.quote === was.quote
    ) {
      continue;
    }

    // Nothing below this line is reported while the old clause is still in the
    // document. Every branch that follows depends on it having gone.
    if (was.verdict === "answered" && stillSays(now, was.quote)) continue;

    if (found.verdict === "answered" && was.verdict === "answered") {
      changes.push({
        kind: "moved",
        questionKey: found.questionKey,
        previousAnswer: was.answer,
        previousQuote: was.quote,
        previousLineNo: was.lineNo,
        answer: found.answer,
        quote: found.quote,
        lineNo: found.lineNo,
      });
    } else if (found.verdict === "not_stated" && was.verdict === "answered") {
      changes.push({
        kind: "gone",
        questionKey: found.questionKey,
        previousAnswer: was.answer,
        previousQuote: was.quote,
        previousLineNo: was.lineNo,
      });
    }
    // was not_stated, now answered — a clause that appeared — is deliberately
    // NOT reported. There is no old quote to search for, so the check above
    // cannot run on it, and it is exactly as likely to be this run's extraction
    // finding what the last run missed as it is to be a new clause. Telling
    // somebody a term was added to their lease when it was there all along is
    // the same lie as telling them one was removed.
    //
    // Restoring it needs the previous TEXT, which this system deliberately does
    // not store — or the added lines out of Firecrawl's git-diff, which the
    // scrape already requests and nothing yet reads. That is where to start.
    //
    // not_stated → not_stated is silence twice. Nothing to report either.
  }

  return changes;
}
