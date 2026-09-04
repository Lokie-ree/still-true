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
