// Run: npm test
//
// verify() is the gate between what the model said and what this product
// publishes as a quote. Everything else in extract.ts is a fetch call; this is
// the logic that makes fabrication structurally impossible, so it is the thing
// that gets a check. Each test below is a way the model could put a wrong
// sentence in front of a reader, and the assertion is that it cannot.
import assert from "node:assert/strict";
import { test } from "node:test";
import { excerpt, verify } from "./extract.ts";
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

// ── the excerpt ─────────────────────────────────────────────────────────────
//
// Reflow correctly joins a hard-wrapped PDF paragraph into one line, so the
// unit of citation grew to 588 characters on the real Livonia lease with the
// answer buried 300 in. This is that line, verbatim, converter markup included.
//
// The model proposes the clause as text; the DOCUMENT decides whether it gets
// published. These are the ways a proposal can be wrong, and the assertion is
// that none of them can put words in front of a reader.
const LINE_42 =
  "Department of Human Services (DHS).  The acceptance of such third party " +
  "payments by the Management is neither a waiver of nor modification of the " +
  "monthly amount of rent nor the Residents obligation to pay rent due and " +
  "payable in advance on the FIRST of each month even if Management accepts " +
  "such third party payments subsequent to the actual due date.  Any monthly " +
  "rent payments made after the 5<sup>th</sup> day of each month will be " +
  "subject to a <u>$25.00</u> late fee.  A failure to pay the <u>$25.00</u> " +
  "late fee shall constitute just cause for the termination of the Lease " +
  "Agreement.";

void test("a verbatim clause is found and published as the receipt", () => {
  const got = excerpt(
    LINE_42,
    "Any monthly rent payments made after the 5<sup>th</sup> day of each month will be subject to a <u>$25.00</u> late fee.",
  );
  assert.match(got, /^Any monthly rent payments made after the 5/);
  assert.match(got, /late fee\.$/);
  assert.doesNotMatch(got, /Department of Human Services/);
  assert.ok(got.length < LINE_42.length / 3);
});

void test("whitespace is the only difference tolerated", () => {
  // A PDF leaves double spaces behind and the model normalises them. That must
  // not cost a good excerpt — but nothing else is forgiven.
  const got = excerpt(LINE_42, "actual due date. Any monthly rent payments");
  assert.match(got, /Any monthly rent payments/);
  assert.ok(got.length < LINE_42.length);
});

void test("an invented clause is refused and the whole line published", () => {
  // The grounding guarantee at the excerpt level. Every word here is plausible
  // and none of them are in the document.
  const invented = "Tenant shall pay a $50.00 late fee after the tenth day.";
  assert.equal(excerpt(LINE_42, invented), flatten(LINE_42));
});

void test("a paraphrase is refused, however true", () => {
  // True of the document, absent from it. The receipt is the document's words.
  assert.equal(
    excerpt(LINE_42, "rent is late after the fifth and costs $25"),
    flatten(LINE_42),
  );
});

void test("a technically true fragment is widened to its sentence", () => {
  // "$25.00" is really in the line. On its own it is not a receipt, so the
  // sentence containing it is published and no minimum length is invented.
  const got = excerpt(LINE_42, "<u>$25.00</u> late fee");
  assert.match(got, /^Any monthly rent payments/);
  assert.match(got, /late fee\.$/);
});

void test("whatever is published is always text out of the line", () => {
  for (const proposed of [
    "Any monthly rent",
    "not in this document at all",
    "",
    undefined,
    42,
    "Agreement.",
  ]) {
    assert.ok(flatten(LINE_42).includes(excerpt(LINE_42, proposed)));
  }
});

void test("a missing or unusable proposal falls back to the whole line", () => {
  // Where this shipped before the excerpt existed, and still correct: the
  // line-level guarantee does not depend on any of it.
  const whole = flatten(LINE_42);
  assert.equal(excerpt(LINE_42, undefined), whole);
  assert.equal(excerpt(LINE_42, ""), whole);
  assert.equal(excerpt(LINE_42, "   "), whole);
  assert.equal(excerpt(LINE_42, 42), whole);
  assert.equal(excerpt(LINE_42, null), whole);
});

// The published quote has its whitespace collapsed, so comparisons against the
// fixture have to collapse it too.
function flatten(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
