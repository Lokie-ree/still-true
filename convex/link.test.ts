// Run: npm test
//
// The address a forwarded mail actually points at. The first of these is the
// message that failed in production; the rest are the ways an unwrap can go
// wrong in the other direction, by rewriting a link that was already right.
import assert from "node:assert/strict";
import { test } from "node:test";
import { documentUrl, isStop } from "./link.ts";

void test("a Gmail wrapper resolves to the document it wraps", () => {
  const body =
    "Can you read this one for me?\n\n" +
    "https://www.google.com/url?q=https://www.spotify.com/us/legal/end-user-agreement/&source=gmail&ust=1788647933074000&sa=E\n\nThanks.";
  assert.equal(
    documentUrl(body),
    "https://www.spotify.com/us/legal/end-user-agreement/",
  );
});

void test("a percent-encoded wrapper resolves too", () => {
  assert.equal(
    documentUrl(
      "https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Flease.pdf&sa=E",
    ),
    "https://example.com/lease.pdf",
  );
});

void test("an unwrapped link is left exactly as it arrived", () => {
  const url = "https://www.att.com/legal/terms.consumerServiceAgreement.html";
  assert.equal(documentUrl(`please read ${url} thanks`), url);
});

void test("a google link that is not a wrapper is left alone", () => {
  const url = "https://www.google.com/search?q=security+deposit+michigan";
  assert.equal(documentUrl(url), url);
});

void test("a document whose own address carries ?url= is left alone", () => {
  const url = "https://docs.example.com/view?url=lease.pdf";
  assert.equal(documentUrl(url), url);
});

void test("mail with no link at all reports none", () => {
  assert.equal(documentUrl("did it work?"), null);
});

// M4. The word has to win against a real reply — which carries the quoted
// original underneath it — and lose against prose that merely starts with it.
void test("a bare STOP is an unsubscribe", () => {
  assert.equal(isStop("STOP"), true);
  assert.equal(isStop("stop"), true);
  assert.equal(isStop("Unsubscribe"), true);
  assert.equal(isStop("STOP."), true);
  assert.equal(isStop("  stop  \n"), true);
});

void test("a reply's quoted original does not un-stop it", () => {
  const body =
    "STOP\n\nOn Sun, Sep 6, 2026 at 4:45 PM still-true wrote:\n" +
    "> I read Pandora TOS — 243 lines.\n> Reply STOP and I will stop.\n";
  assert.equal(isStop(body), true);
});

void test("a document is never read as an unsubscribe", () => {
  assert.equal(isStop("Stop by the office before Friday to sign it."), false);
  assert.equal(isStop("Please stop the auto-renewal — see attached."), false);
  assert.equal(
    isStop("Can you read this?\n\nSTOP\n\nhttps://example.com/lease"),
    false,
  );
});

// ── P5: the document a cc arrives beside ─────────────────────────────────────
//
// Being cc'd on a reply means the link is usually in the quoted original rather
// than in what the person just typed. Nothing had to be built for that — the
// scan already reads the whole body — but nothing covered it either, and "it
// happens to work" is not the same claim as "it works".

void test("a link in the quoted original is still the document", () => {
  const body =
    "Looping in still-true to check this.\n\n" +
    "On Sun, Sep 6, 2026 at 2:10 PM Landlord <landlord@example.com> wrote:\n" +
    "> Here is the lease we discussed:\n" +
    "> https://example.com/watch-test/lease.html\n" +
    "> Let me know if you have questions.\n";
  assert.equal(documentUrl(body), "https://example.com/watch-test/lease.html");
});

void test("what the cc'er typed wins over what the thread quoted", () => {
  // First link in the body, as everywhere else. The person adding this address
  // is the one asking, so the document they put above the quote is the one they
  // mean — and the thread's older link sits below it.
  const body =
    "This is the one I actually need read: https://example.com/addendum.pdf\n\n" +
    "> the original lease is at https://example.com/lease.pdf\n";
  assert.equal(documentUrl(body), "https://example.com/addendum.pdf");
});
