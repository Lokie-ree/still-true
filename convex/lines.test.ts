// Run: npm test
//
// The reflow is the only non-obvious logic in the ingest path and every quote
// in the product is an index into its output, so it gets the one check.
import assert from "node:assert/strict";
import { test } from "node:test";
import { toLines } from "./lines.ts";

void test("rejoins a clause a PDF hard-wrapped at the visual column", () => {
  const lines = toLines(
    "Landlord shall return the security deposit, less any lawful\ndeductions, within thirty (30) days after termination.",
  );
  assert.equal(lines.length, 1);
  assert.match(lines[0], /lawful deductions, within thirty/);
});

void test("never joins across markdown structure", () => {
  // The first line ends in a comma and the second starts lowercase, so only
  // the leading "|" stops these from being welded into one row.
  assert.equal(toLines("Fees, charges,\n| rent | monthly |").length, 2);
});

void test("drops table-of-contents dot leaders", () => {
  const lines = toLines("Section 4 — Termination .......... 14\nReal clause here.");
  assert.deepEqual(lines, ["Real clause here."]);
});

void test("line numbers survive blank lines, because the model cites indices", () => {
  const lines = toLines("First.\n\nSecond.");
  assert.deepEqual(lines, ["First.", "", "Second."]);
});

void test("renders the document's words, not the converter's typesetting", () => {
  // The parser emits the page's superscript and underline as markup. Stripped
  // before numbering, so the prompt, the stored quote and the receipt all see
  // the same text — and a model copying a clause verbatim can actually match it.
  const lines = toLines(
    "payments made after the 5<sup>th</sup> day incur a <u>$25.00</u> late fee.",
  );
  assert.deepEqual(lines, ["payments made after the 5th day incur a $25.00 late fee."]);
});

void test("markup never blocks the reflow it hides", () => {
  // A line ending "</u>" fails reflow's ends-mid-clause test, so the markup was
  // also suppressing the join that exists to repair a PDF's hard wrap.
  assert.deepEqual(toLines("charges for <u>repair,</u>\nand for damage."), [
    "charges for repair, and for damage.",
  ]);
});

void test("a link keeps its words and loses its address", () => {
  // AT&T's real cancellation receipt. `att.com/howtocancel` IS the answer; the
  // href beside it is the same string a second time.
  assert.deepEqual(
    toLines(
      "See [att.com/howtocancel](https://www.att.com/howtocancel) for details on how to cancel.",
    ),
    ["See att.com/howtocancel for details on how to cancel."],
  );
});

void test("a bare url is an anchor with nothing to say, and goes", () => {
  // Every Summary of Benefits and Coverage quote carried two of these
  // mid-clause: the glossary hyperlinks on "plan" and "specialist" surface as
  // bare hrefs while the words themselves stay in the prose.
  assert.deepEqual(
    toLines(
      "This plan will pay some or all of the costs but only if https://www.healthcare.gov/sbc-glossary/#plan https://www.healthcare.gov/sbc-glossary/#specialist you have a referral.",
    ),
    ["This plan will pay some or all of the costs but only if you have a referral."],
  );
});

void test("the link pass runs first, which is what makes the url pass safe", () => {
  // Reversing these would strip the href out of the markdown link, leave the
  // brackets behind, and publish "See [att.com/howtocancel]()".
  const [line] = toLines("Visit [our page](https://x.test/a) or https://x.test/b now.");
  assert.equal(line, "Visit our page or now.");
  assert.doesNotMatch(line, /\[|\]|\(|\)/);
});

void test("html entities decode to the character the document meant", () => {
  // Firecrawl emitted &#x27; for the apostrophe in a real SBC quote.
  assert.deepEqual(toLines("If you don&#x27;t get preauthorization &amp; pay."), [
    "If you don't get preauthorization & pay.",
  ]);
});

void test("a document that really says &lt; keeps its angle bracket", () => {
  // Decoding runs after the tag strip, or this would be eaten as markup.
  assert.deepEqual(toLines("Deductible &lt; $500 applies."), [
    "Deductible < $500 applies.",
  ]);
});

void test("a table row loses its delimiters and keeps its cells", () => {
  // The outer pipes are the parser showing through. The inner ones are real
  // boundaries: welding the cells together would invent a sentence.
  assert.deepEqual(toLines("| Specialist visit | $50 copay/visit |"), [
    "Specialist visit | $50 copay/visit",
  ]);
});

void test("pipes are trimmed after reflow, so the join guard still holds", () => {
  // Reflow refuses to join a line starting with "|". Trimming any earlier
  // would weld this table row onto the prose above it.
  assert.deepEqual(toLines("Fees, charges,\n| rent | monthly |"), [
    "Fees, charges,",
    "rent | monthly",
  ]);
});
