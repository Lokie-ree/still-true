// Run: npm test
//
// verify() is the gate between what the model said and what this product
// publishes as a quote. Everything else in extract.ts is a fetch call; this is
// the logic that makes fabrication structurally impossible, so it is the thing
// that gets a check. Each test below is a way the model could put a wrong
// sentence in front of a reader, and the assertion is that it cannot.
import assert from "node:assert/strict";
import { test } from "node:test";
import { verify } from "./extract.ts";
import type { Question } from "./questions.ts";

const QUESTIONS: Question[] = [{ key: "L1", ask: "Deposit return window?" }];

const LINES = [
  "RESIDENTIAL LEASE",
  "",
  "Landlord shall return the deposit within thirty (30) days of surrender.",
  "",
  "Tenant shall keep the premises clean.",
];

const answered = (support: unknown, answer = "Thirty days.") => ({
  findings: [
    { question_key: "L1", verdict: "answered", answer, support_line: support },
  ],
});

void test("the quote comes from the document, not from the model", () => {
  const [finding] = verify(answered(3), QUESTIONS, LINES);
  assert.equal(finding.verdict, "answered");
  assert.ok(finding.verdict === "answered");
  // The model wrote "Thirty days." and never wrote this sentence.
  assert.equal(finding.quote, LINES[2]);
  assert.equal(finding.lineNo, 3);
  assert.equal(finding.linesSearched, 5);
});

void test("a model-supplied quote cannot reach the reader", () => {
  // The one that matters. The model claims line 3 while writing a sentence
  // that is nowhere in the document; the published quote is still line 3.
  const parsed = {
    findings: [
      {
        question_key: "L1",
        verdict: "answered",
        answer: "Landlord must return the deposit within fourteen (14) days.",
        support_line: 3,
      },
    ],
  };
  const [finding] = verify(parsed, QUESTIONS, LINES);
  assert.ok(finding.verdict === "answered");
  assert.match(finding.quote, /thirty \(30\) days/);
  assert.doesNotMatch(finding.quote, /fourteen/);
});

void test("an out-of-range line number is a refusal, not a crash", () => {
  assert.equal(verify(answered(99), QUESTIONS, LINES)[0].verdict, "not_stated");
  assert.equal(verify(answered(0), QUESTIONS, LINES)[0].verdict, "not_stated");
  assert.equal(verify(answered(-1), QUESTIONS, LINES)[0].verdict, "not_stated");
});

void test("a citation landing on a blank line is a refusal", () => {
  // Line 2 is real and in range and says nothing. Publishing an empty quote
  // would be a finding with no receipt.
  assert.equal(verify(answered(2), QUESTIONS, LINES)[0].verdict, "not_stated");
});

void test("a non-integer or missing index is a refusal", () => {
  assert.equal(verify(answered("3"), QUESTIONS, LINES)[0].verdict, "not_stated");
  assert.equal(verify(answered(3.5), QUESTIONS, LINES)[0].verdict, "not_stated");
  assert.equal(verify(answered(undefined), QUESTIONS, LINES)[0].verdict, "not_stated");
});

void test("support_line 0 is how the model refuses, and it lands as one", () => {
  // The prompt tells the model to send 0 when no single line carries the whole
  // answer. 0 is out of range, so it refuses through the same rule as any other
  // bad index rather than needing a case of its own.
  const parsed = {
    findings: [
      { question_key: "L1", verdict: "answered", answer: "Thirty days.", support_line: 0 },
    ],
  };
  assert.equal(verify(parsed, QUESTIONS, LINES)[0].verdict, "not_stated");
});

void test("answered with an empty answer is a refusal", () => {
  assert.equal(verify(answered(3, "  "), QUESTIONS, LINES)[0].verdict, "not_stated");
});

void test("every predeclared question gets a verdict, even ones the model skipped", () => {
  const questions: Question[] = [
    { key: "L1", ask: "a" },
    { key: "L2", ask: "b" },
    { key: "L3", ask: "c" },
  ];
  const findings = verify(answered(3), questions, LINES);
  assert.deepEqual(
    findings.map((f) => [f.questionKey, f.verdict]),
    [
      ["L1", "answered"],
      ["L2", "not_stated"],
      ["L3", "not_stated"],
    ],
  );
  // A refusal has to be countable: "searched 5 lines and it is not there".
  assert.equal(findings[1].linesSearched, 5);
});

void test("junk from the model is refusals, not exceptions", () => {
  for (const junk of [null, {}, { findings: "nope" }, { findings: [null] }]) {
    assert.equal(verify(junk, QUESTIONS, LINES)[0].verdict, "not_stated");
  }
});

void test("context skips the blank lines PDF markdown is full of", () => {
  const [finding] = verify(answered(3), QUESTIONS, LINES);
  assert.ok(finding.verdict === "answered");
  assert.equal(finding.contextBefore, "RESIDENTIAL LEASE");
  assert.equal(finding.contextAfter, "Tenant shall keep the premises clean.");
});

void test("context at the edges of the document is empty, not undefined", () => {
  const [finding] = verify(answered(1), [{ key: "L1", ask: "a" }], ["Only line."]);
  assert.ok(finding.verdict === "answered");
  assert.equal(finding.contextBefore, "");
  assert.equal(finding.contextAfter, "");
});
