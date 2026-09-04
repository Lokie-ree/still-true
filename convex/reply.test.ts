// Run: npm test
//
// The reply is the artifact a person judges this product by, and it is the one
// place where a wording slip becomes a false claim. These check the promises
// the copy makes, not its prose.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtractedFinding } from "./extract.ts";
import { failureBody, replyBody } from "./reply.ts";

const CHECKED = Date.parse("2026-09-04T12:00:00Z");

const answered: ExtractedFinding = {
  questionKey: "L2",
  verdict: "answered",
  answer: "They must give you 48 hours before entering.",
  quote:
    "Entry may be made only during reasonable hours after advance notice in writing.",
  lineNo: 268,
  contextBefore: "",
  contextAfter: "",
  linesSearched: 421,
};

const refused: ExtractedFinding = {
  questionKey: "L1",
  verdict: "not_stated",
  linesSearched: 421,
};

const base = {
  title: "Livonia Housing Authority dwelling lease",
  kind: "lease" as const,
  lineCount: 421,
  watchable: true,
  checkedAt: CHECKED,
};

void test("an answer never appears without the quote that carries it", () => {
  const { text, html } = replyBody({ ...base, findings: [answered] });
  for (const rendered of [text, html]) {
    assert.ok(rendered.includes(answered.answer));
    assert.ok(rendered.includes("Entry may be made only during reasonable"));
    assert.match(rendered, /line 268/);
  }
});

void test("a refusal is countable and reads as a search, not a verdict", () => {
  const { text } = replyBody({ ...base, findings: [refused] });
  // The claim is what we searched, not what exists in the world.
  assert.match(text, /Searched all 421 lines/);
  assert.match(text, /not stated · searched Sep 4/);
  // The question is restated, because a refusal to an unnamed question is noise.
  assert.match(text, /How many days after move-out/);
});

void test("a refusal never asserts anything the finding does not store", () => {
  // The plan's mockup said the lease "defers to Michigan statute without
  // naming one". A not_stated finding holds a question key and a line count,
  // so any such clause would be invented. Guard the class, not the sentence.
  const { text, html } = replyBody({ ...base, findings: [refused] });
  for (const rendered of [text, html]) {
    assert.doesNotMatch(rendered, /statute|Michigan|defers/i);
  }
});

void test("watch is offered only on a document that can actually be watched", () => {
  const watched = replyBody({ ...base, findings: [answered] });
  assert.match(watched.text, /Reply `watch`/);

  // A forwarded attachment has no URL. Offering to watch it would be a promise
  // the system cannot keep, and P4 will never re-fetch it.
  const attachment = replyBody({
    ...base,
    watchable: false,
    findings: [answered],
  });
  assert.doesNotMatch(attachment.text, /watch/i);
  assert.doesNotMatch(attachment.html, /watch/i);
});

void test("both halves render together, refusal included", () => {
  const { text } = replyBody({ ...base, findings: [answered, refused] });
  assert.match(text, /WHAT IT REQUIRES OF YOU/);
  assert.match(text, /WHAT IT NEVER SAYS/);
  assert.ok(text.indexOf("WHAT IT REQUIRES") < text.indexOf("WHAT IT NEVER"));
});

void test("a document that answered nothing still gets an honest reply", () => {
  const { text } = replyBody({ ...base, findings: [] });
  assert.doesNotMatch(text, /WHAT IT REQUIRES OF YOU/);
  assert.match(text, /none of my questions/);
});

void test("html escapes document text rather than trusting it", () => {
  // The title is the sender's own filename or subject line, and a quote is
  // whatever the document said. Both reach an email client.
  const { html } = replyBody({
    ...base,
    title: '<script>alert("x")</script>',
    findings: [],
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

void test("a failure reply says nothing about the document's contents", () => {
  const { text } = failureBody("lease.pdf");
  assert.match(text, /could not read/i);
  assert.match(text, /Nothing was published/);
  // Our stack's error text never reaches the sender: it can carry a signed URL
  // and "Firecrawl 502" helps nobody.
  assert.doesNotMatch(text, /Firecrawl|OpenAI|AgentMail|http/i);
});

// Stripping the converter's markup used to live here. It moved into
// convex/lines.ts, before numbering, so the prompt, the stored quote, the
// receipt and P4's re-check all read the same text — see lines.test.ts. The
// reply renders the quote it is given and changes nothing about it.

void test("two answers citing one line print that line once", () => {
  // The compound-question split was right for the engine contract, but L3a and
  // L3b both land on line 42 and printing its 600-character quote twice in a
  // row reads as a bug.
  const { text } = replyBody({
    ...base,
    findings: [
      { ...answered, questionKey: "L3a", answer: "The late fee is $25.00." },
      {
        ...answered,
        questionKey: "L3b",
        answer: "It applies after the fifth day.",
      },
    ],
  });
  assert.match(text, /The late fee is \$25\.00\./);
  assert.match(text, /It applies after the fifth day\./);
  assert.equal(text.split("Entry may be made only").length - 1, 1);
  assert.equal(text.split("line 268").length - 1, 1);
});
