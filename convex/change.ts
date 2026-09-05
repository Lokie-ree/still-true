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
// Therefore: `diff()` is never consulted unless Firecrawl has already reported
// `changeStatus: "changed"` on the source text. This function decides WHAT to
// say about a change; it never decides THAT one happened.

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
    }
  // It was silent and now speaks. A clause that was not there before.
  | {
      kind: "appeared";
      questionKey: string;
      answer: string;
      quote: string;
      lineNo: number;
    };

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
): Change[] {
  const prior = new Map(before.map((f) => [f.questionKey, f]));
  const changes: Change[] = [];

  for (const now of after) {
    const was = prior.get(now.questionKey);
    // A question that was never asked before is not a change — it is a first
    // answer. This happens when the classifier moves a document to a different
    // checklist, and reporting it as "the document changed" would be false.
    if (was === undefined) continue;

    if (now.verdict === "answered" && was.verdict === "answered") {
      if (now.quote === was.quote) continue;
      changes.push({
        kind: "moved",
        questionKey: now.questionKey,
        previousAnswer: was.answer,
        previousQuote: was.quote,
        previousLineNo: was.lineNo,
        answer: now.answer,
        quote: now.quote,
        lineNo: now.lineNo,
      });
    } else if (now.verdict === "not_stated" && was.verdict === "answered") {
      changes.push({
        kind: "gone",
        questionKey: now.questionKey,
        previousAnswer: was.answer,
        previousQuote: was.quote,
        previousLineNo: was.lineNo,
      });
    } else if (now.verdict === "answered" && was.verdict === "not_stated") {
      changes.push({
        kind: "appeared",
        questionKey: now.questionKey,
        answer: now.answer,
        quote: now.quote,
        lineNo: now.lineNo,
      });
    }
    // not_stated → not_stated is silence twice. Nothing to report.
  }

  return changes;
}
