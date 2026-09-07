// Run: npm test
//
// The reply is the artifact a person judges this product by, and it is the one
// place where a wording slip becomes a false claim. These check the promises
// the copy makes, not its prose.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtractedFinding } from "./extract.ts";
import {
  changeBody,
  failureBody,
  limitBody,
  replyBody,
  stoppedBody,
} from "./reply.ts";

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
  assert.match(watched.text, /re-read this page daily and email you/);

  // A forwarded attachment has no URL. The signed link expired minutes after it
  // arrived, so `watch:sweep` has no address to go back to and the promise
  // would be unkeepable. Assert on the promise itself, not on the word: the
  // sentence no longer contains "watch" anywhere, so matching that word alone
  // would pass even if the whole promise were wrongly included.
  const attachment = replyBody({
    ...base,
    watchable: false,
    findings: [answered],
  });
  for (const rendered of [attachment.text, attachment.html]) {
    assert.doesNotMatch(rendered, /re-read|daily|email you if/i);
    assert.doesNotMatch(rendered, /watch/i);
  }
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

// H2's two gates. The thing worth testing is not the wording but that the two
// refusals stay distinguishable from each other and from a failure: a sender who
// hit the cap must not be told to try again, and a sender who hit the rate must
// not be told the system broke.
void test("a limit reply names the limit rather than claiming a failure", () => {
  const cap = limitBody({ kind: "cap", cap: 25 });
  assert.match(cap.text, /25 documents/);
  assert.doesNotMatch(cap.text, /could not read|failure/i);
  // "Try again" is the rate-limit sentence. At the cap there is nothing to
  // come back to, and telling them otherwise sends them into it again.
  assert.doesNotMatch(cap.text, /again/i);

  const burst = limitBody({ kind: "burst", retryAfterMs: 90_000 });
  assert.match(burst.text, /again in about 2 minutes/);
  assert.doesNotMatch(burst.text, /could not read|failure/i);
});

// A retry time is a promise about a clock, so the rounding is the test: an
// already-expired delay walks the sender straight back into the limit.
void test("a retry delay never rounds down to now", () => {
  assert.match(limitBody({ kind: "burst", retryAfterMs: 1 }).text, /1 minute\b/);
  assert.match(limitBody({ kind: "burst", retryAfterMs: 0 }).text, /1 minute\b/);
  assert.match(
    limitBody({ kind: "burst", retryAfterMs: 3 * 3_600_000 }).text,
    /3 hours/,
  );
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

// ── the watch's email ────────────────────────────────────────────────────────
// It arrives unasked, weeks later, about a document the reader half remembers.
// So the tests here are about what it must NOT do as much as what it says.

const moved = {
  kind: "moved" as const,
  questionKey: "L1",
  previousAnswer: "You must give 30 days' notice.",
  previousQuote: "TENANT shall give thirty (30) days written notice",
  previousLineNo: 100,
  answer: "You must give 60 days' notice.",
  quote: "TENANT shall give sixty (60) days written notice",
  lineNo: 104,
};

void test("a change notice carries both quotes and both line numbers", () => {
  const { text, html } = changeBody({
    title: "Livonia Housing Authority lease",
    kind: "lease",
    lineCount: 418,
    changes: [moved],
    checkedAt: Date.UTC(2026, 8, 14),
  });
  for (const out of [text, html]) {
    assert.match(out, /thirty \(30\) days written notice/);
    assert.match(out, /sixty \(60\) days written notice/);
    assert.match(out, /line 100/);
    assert.match(out, /line 104/);
  }
});

void test("the headline verb agrees with the number of changes", () => {
  // "2 things I had quoted for you no longer reads the same way" is what the
  // first change notice this system ever sent actually said.
  const one = changeBody({ title: "t", kind: "lease", lineCount: 418, changes: [moved], checkedAt: CHECKED });
  assert.match(one.text, /1 thing I had quoted for you no longer reads the same way/);

  const two = changeBody({
    title: "t",
    kind: "lease",
    lineCount: 418,
    changes: [moved, { ...moved, questionKey: "L2" }],
    checkedAt: CHECKED,
  });
  assert.match(two.text, /2 things I had quoted for you no longer read the same way/);
});

void test("a change notice never grades the change", () => {
  // "Significant", "important", "you should review this" are all judgments this
  // system has no basis for. It compared two texts; that is the whole claim.
  const { text, html } = changeBody({
    title: "terms",
    kind: "tos",
    lineCount: 1225,
    changes: [moved],
    checkedAt: Date.UTC(2026, 8, 14),
  });
  for (const out of [text, html]) {
    // "worse" is deliberately absent from this list: the notice uses it once,
    // to say it is NOT making that judgment, and the following test pins that
    // sentence in place.
    assert.doesNotMatch(out, /significant|important|serious|urgent|review this|you should/i);
  }
});

void test("a clause that disappeared reports the refusal, not an empty quote", () => {
  const { text } = changeBody({
    title: "lease",
    kind: "lease",
    lineCount: 418,
    changes: [
      {
        kind: "gone",
        questionKey: "L1",
        previousAnswer: "Deposit returned in 30 days.",
        previousQuote: "shall be returned within 30 days",
        previousLineNo: 88,
      },
    ],
    checkedAt: Date.UTC(2026, 8, 14),
  });
  assert.match(text, /shall be returned within 30 days/);
  assert.match(text, /Searched all 418 lines\. This document does not state it\./);
});

// The "a clause appeared" case used to be tested here. It no longer exists:
// `diff` refuses to report a clause as new, because with no old quote to search
// for it cannot tell a genuinely added term from this run finding what the last
// run missed. See convex/change.ts.

void test("the notice says how it knows, because that is the only reason to believe it", () => {
  const { text } = changeBody({
    title: "terms",
    kind: "tos",
    lineCount: 1225,
    changes: [moved],
    checkedAt: Date.UTC(2026, 8, 14),
  });
  assert.match(text, /compared the text of the page against the copy I read last time/);
  assert.match(text, /not a judgment that something got worse/);
});

// ── M4, the way out ──────────────────────────────────────────────────────────
//
// The watch takes no opt-in, deliberately, so the offer to stop has to travel
// with the mail it stops. These guard the two places it must appear and the one
// claim the confirmation must not make.

void test("a watched answer names the word that stops it", () => {
  const { text, html } = replyBody({ ...base, findings: [answered] });
  // Not "mentions STOP somewhere" — the paragraph that PROMISES the daily mail
  // is the paragraph that has to carry the way out of it. It used to end "You
  // don't need to do anything", which was the whole of docs/READINESS.md M4.
  assert.match(text, /Reply STOP and I'll stop/);
  assert.match(html, /Reply STOP and I&#39;ll stop|Reply STOP and I'll stop/);
  assert.doesNotMatch(text, /You don't need to do anything\./);
});

void test("the change notice carries the way out, because nobody asked for it", () => {
  // The one unsolicited mail this system sends, and after P5 it reaches
  // everyone cc'd on a forwarded thread — none of whom wrote to this address.
  const notice = changeBody({
    title: "Livonia Housing Authority Public Housing Dwelling Lease",
    kind: "lease",
    lineCount: 418,
    changes: [
      {
        kind: "moved",
        questionKey: "L3a",
        previousAnswer: "The late fee is $50.00.",
        previousQuote: "a late charge of Fifty and 00/100 Dollars ($50.00)",
        previousLineNo: 24,
        answer: "The late fee is $75.00.",
        quote: "a late charge of Seventy-Five and 00/100 Dollars ($75.00)",
        lineNo: 24,
      },
    ],
    checkedAt: Date.parse("2026-09-07T11:17:00Z"),
  });
  assert.match(notice.text, /Reply STOP and I'll stop/);
  assert.match(notice.html, /Reply STOP/);
});

void test("the stop confirmation counts documents and withdraws nothing", () => {
  const { text } = stoppedBody(3);
  assert.match(text, /3 documents/);
  // An unsubscribe that quietly deleted somebody's answers would be a surprise
  // in the other direction, and this system does not withdraw a published
  // receipt because someone asked for silence.
  assert.match(text, /still stand/);
  assert.doesNotMatch(text, /deleted your|removed your|withdrawn your/i);
});

void test("one document stopped is not '1 documents'", () => {
  assert.match(stoppedBody(1).text, /1 document\b/);
  assert.match(stoppedBody(0).text, /0 documents\b/);
});
