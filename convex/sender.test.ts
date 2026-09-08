import assert from "node:assert/strict";
import { test } from "node:test";
import { senderAddress } from "./sender.ts";

// H4. Every case below is either a real row out of a deployment or a header a
// sender can write on purpose. The parser is a dependency; what is tested here
// is the contract this project puts on top of it — one mailbox, lowercased, or
// an honest null.

void test("the real production row: a quoted display name containing a comma", () => {
  // The exact string `threads.fromEmail` held after the 2026-09-08 round trip.
  assert.equal(
    senderAddress('"Randall LaPoint, Jr." <rplapointjr@gmail.com>'),
    "rplapointjr@gmail.com",
  );
});

void test("the two dev rows that were one mailbox and two identities", () => {
  // This pair IS the flag: same person, two clients, two rows, and a STOP on
  // one that did not reach the other.
  assert.equal(
    senderAddress("Randall <randall@example.com>"),
    "randall@example.com",
  );
  assert.equal(senderAddress("randall@example.com"), "randall@example.com");
});

void test("a display name is never the identity", () => {
  const one = senderAddress("Randall <randall@example.com>");
  const two = senderAddress('"Someone Else Entirely" <randall@example.com>');
  const three = senderAddress("randall@example.com");
  assert.equal(one, two);
  assert.equal(two, three);
});

void test("case is normalised, so Randall@ and randall@ are one sender", () => {
  assert.equal(senderAddress("RANDALL@EXAMPLE.COM"), "randall@example.com");
  assert.equal(
    senderAddress("Name <Randall@Example.COM>"),
    "randall@example.com",
  );
});

void test("a comment carrying a second address does not win", () => {
  // The case that kills "take the last angle brackets". This header is from
  // a@x.com; the naive rule reads it as b@evil.com.
  assert.equal(
    senderAddress("Name <a@x.com> (note <b@evil.com>)"),
    "a@x.com",
  );
});

void test("an address hidden in a quoted display name does not win", () => {
  assert.equal(
    senderAddress('"spoof <fake@evil.com>" <real@good.com>'),
    "real@good.com",
  );
});

void test("a header naming two mailboxes is refused, not resolved to the first", () => {
  // Taking the first would charge a victim's quota and let the attacker's STOP
  // silence the victim's threads. Refusing is the only safe answer.
  assert.equal(senderAddress("A <a@x.com>, B <b@y.com>"), null);
});

void test("a group parses successfully and still yields no sender", () => {
  // `undisclosed-recipients:;` comes back as one node whose `address` is
  // undefined. Truthiness would have been enough here; the type check is what
  // makes it enough on purpose.
  assert.equal(senderAddress("undisclosed-recipients:;"), null);
});

void test("garbage and emptiness are null rather than a shared bucket", () => {
  // The old code fell back to "", which put every unidentifiable sender in ONE
  // bucket — harmless for cost and catastrophic for STOP, since one stranger's
  // unsubscribe would have silenced all of them.
  assert.equal(senderAddress(""), null);
  assert.equal(senderAddress("not an address"), null);
  assert.equal(senderAddress("   "), null);
});

void test("plus tags are deliberately NOT merged", () => {
  // Recorded as a test so the decision cannot be reversed silently. The reason
  // is in the comment block at the bottom of sender.ts: the local part is
  // opaque per RFC 5321, and this key gates an unsubscribe.
  assert.equal(
    senderAddress("me+lease@gmail.com"),
    "me+lease@gmail.com",
  );
  assert.notEqual(
    senderAddress("me+lease@gmail.com"),
    senderAddress("me@gmail.com"),
  );
});

void test("normalising twice is normalising once", () => {
  // The backfill re-runs over rows it has already migrated, so this has to hold
  // or a second run corrupts the first.
  const once = senderAddress('"Randall LaPoint, Jr." <rplapointjr@gmail.com>');
  assert.notEqual(once, null);
  assert.equal(senderAddress(once as string), once);
});
