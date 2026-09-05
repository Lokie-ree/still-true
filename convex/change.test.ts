// Run: npm test
//
// The rule that decides whether somebody's phone buzzes. The first test is the
// one that matters: the model rewording an answer on identical text must be
// silence, because that is the failure this whole design was chosen to avoid.
import assert from "node:assert/strict";
import { test } from "node:test";
import { diff, type PriorFinding } from "./change.ts";
import type { ExtractedFinding } from "./extract.ts";

const answered = (
  questionKey: string,
  answer: string,
  quote: string,
  lineNo = 100,
): ExtractedFinding & PriorFinding => ({
  questionKey,
  verdict: "answered",
  answer,
  quote,
  lineNo,
  contextBefore: "",
  contextAfter: "",
  linesSearched: 418,
});

const silent = (questionKey: string): ExtractedFinding & PriorFinding => ({
  questionKey,
  verdict: "not_stated",
  linesSearched: 418,
});

// The document as it now reads. `diff` searches this for the clause a finding
// used to quote, and refuses to report a change while that clause is still in
// the document — the second gate, added after a live run proved the first one
// insufficient.
const NOW = [
  "TENANT shall give thirty (30) days written notice.",
  "shall pay a late charge of Fifty and 00/100 Dollars ($50.00)",
  "we share your data with third parties",
];

void test("a reworded answer over the same clause is not a change", () => {
  // Development said one thing, production said another, about a document that
  // had not moved. This is that case, and it must produce no email.
  const before = [answered("L1", "You must give 30 days' notice.", "TENANT shall give thirty (30) days written notice.")];
  const after = [answered("L1", "Thirty days' written notice is required.", "TENANT shall give thirty (30) days written notice.")];
  assert.deepEqual(diff(before, after, NOW), []);
});

void test("a clause the model stopped finding is not a clause that was removed", () => {
  // Measured live on 2026-09-05. The watch fixture was re-read after an edit
  // that touched only a disclosure paragraph, and U2 went from quoting the
  // $50.00 late charge to not_stated — with that sentence still in the
  // document. Reporting it would have told somebody a term of their lease had
  // been deleted while they could open the page and read it.
  const before = [
    answered("U2", "A delinquent payment costs $50.", "shall pay a late charge of Fifty and 00/100 Dollars ($50.00)"),
  ];
  assert.deepEqual(diff(before, [silent("U2")], NOW), []);
});

void test("a clause is only reported gone once it is actually gone from the text", () => {
  const before = [
    answered("U2", "A delinquent payment costs $50.", "shall pay a late charge of Fifty and 00/100 Dollars ($50.00)"),
  ];
  const rewritten = ["TENANT shall give thirty (30) days written notice."];
  assert.deepEqual(diff(before, [silent("U2")], rewritten), [
    {
      kind: "gone",
      questionKey: "U2",
      previousAnswer: "A delinquent payment costs $50.",
      previousQuote: "shall pay a late charge of Fifty and 00/100 Dollars ($50.00)",
      previousLineNo: 100,
    },
  ]);
});

void test("the model citing a different clause is not the document changing", () => {
  // Relevance drift: both sentences are in the document, the model simply chose
  // the other one this time. The old clause is still there, so nothing moved.
  const before = [answered("T4", "Data is shared.", "we share your data with third parties")];
  const after = [answered("T4", "Notice is 30 days.", "TENANT shall give thirty (30) days written notice.")];
  assert.deepEqual(diff(before, after, NOW), []);
});

void test("a moved clause reports both receipts", () => {
  const before = [answered("L1", "30 days' notice.", "give thirty (30) days written notice", 100)];
  const after = [answered("L1", "60 days' notice.", "give sixty (60) days written notice", 104)];
  // The old clause is genuinely absent from the new text — that is what makes
  // this a change rather than the model looking elsewhere.
  assert.deepEqual(diff(before, after, ["give sixty (60) days written notice"]), [
    {
      kind: "moved",
      questionKey: "L1",
      previousAnswer: "30 days' notice.",
      previousQuote: "give thirty (30) days written notice",
      previousLineNo: 100,
      answer: "60 days' notice.",
      quote: "give sixty (60) days written notice",
      lineNo: 104,
    },
  ]);
});

void test("a clause that disappeared is reported with what it used to say", () => {
  const before = [answered("L2", "Deposit returned in 30 days.", "shall be returned within 30 days", 88)];
  const after = [silent("L2")];
  assert.deepEqual(diff(before, after, ["the deposit provisions have been struck"]), [
    {
      kind: "gone",
      questionKey: "L2",
      previousAnswer: "Deposit returned in 30 days.",
      previousQuote: "shall be returned within 30 days",
      previousLineNo: 88,
    },
  ]);
});

void test("a clause that appeared is deliberately not reported", () => {
  // There is no old quote to search for, so the gate above cannot run on it,
  // and it is exactly as likely to be this run finding what the last run missed
  // as it is to be a new clause. Telling somebody a term was added to their
  // lease when it was there all along is the same lie as the reverse.
  const before = [silent("T4")];
  const after = [answered("T4", "Data is shared with partners.", "we share your data with third parties", 323)];
  assert.deepEqual(diff(before, after, NOW), []);
});

void test("silence on both readings says nothing", () => {
  assert.deepEqual(diff([silent("L2")], [silent("L2")], NOW), []);
});

void test("a line number moving under an identical clause is not a change", () => {
  // Stripping converter markup moved Livonia 421 lines to 418 with no word of
  // the lease changing. A watch keyed on position would have emailed everyone.
  const quote = "TENANT shall give thirty (30) days written notice.";
  assert.deepEqual(
    diff([answered("L1", "30 days.", quote, 300)], [answered("L1", "30 days.", quote, 297)], NOW),
    [],
  );
});

void test("a question the previous reading never asked is a first answer, not a change", () => {
  // The classifier moved the document to another checklist. Nothing about the
  // document changed for a question nobody had asked of it before.
  assert.deepEqual(diff([answered("L1", "a", "q")], [answered("T1", "b", "r")], NOW), []);
});
