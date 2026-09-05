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

void test("a reworded answer over the same clause is not a change", () => {
  // Development said one thing, production said another, about a document that
  // had not moved. This is that case, and it must produce no email.
  const before = [answered("L1", "You must give 30 days' notice.", "TENANT shall give thirty (30) days written notice.")];
  const after = [answered("L1", "Thirty days' written notice is required.", "TENANT shall give thirty (30) days written notice.")];
  assert.deepEqual(diff(before, after), []);
});

void test("a moved clause reports both receipts", () => {
  const before = [answered("L1", "30 days' notice.", "give thirty (30) days written notice", 100)];
  const after = [answered("L1", "60 days' notice.", "give sixty (60) days written notice", 104)];
  assert.deepEqual(diff(before, after), [
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
  assert.deepEqual(diff(before, after), [
    {
      kind: "gone",
      questionKey: "L2",
      previousAnswer: "Deposit returned in 30 days.",
      previousQuote: "shall be returned within 30 days",
      previousLineNo: 88,
    },
  ]);
});

void test("a clause that appeared where the document was silent is reported", () => {
  const before = [silent("T4")];
  const after = [answered("T4", "Data is shared with partners.", "we share your data with third parties", 323)];
  assert.deepEqual(diff(before, after), [
    {
      kind: "appeared",
      questionKey: "T4",
      answer: "Data is shared with partners.",
      quote: "we share your data with third parties",
      lineNo: 323,
    },
  ]);
});

void test("silence on both readings says nothing", () => {
  assert.deepEqual(diff([silent("L2")], [silent("L2")]), []);
});

void test("a line number moving under an identical clause is not a change", () => {
  // Stripping converter markup moved Livonia 421 lines to 418 with no word of
  // the lease changing. A watch keyed on position would have emailed everyone.
  const quote = "TENANT shall give thirty (30) days written notice.";
  assert.deepEqual(
    diff([answered("L1", "30 days.", quote, 300)], [answered("L1", "30 days.", quote, 297)]),
    [],
  );
});

void test("a question the previous reading never asked is a first answer, not a change", () => {
  // The classifier moved the document to another checklist. Nothing about the
  // document changed for a question nobody had asked of it before.
  assert.deepEqual(diff([answered("L1", "a", "q")], [answered("T1", "b", "r")]), []);
});
