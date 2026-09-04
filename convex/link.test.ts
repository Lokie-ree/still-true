// Run: npm test
//
// The address a forwarded mail actually points at. The first of these is the
// message that failed in production; the rest are the ways an unwrap can go
// wrong in the other direction, by rewriting a link that was already right.
import assert from "node:assert/strict";
import { test } from "node:test";
import { documentUrl } from "./link.ts";

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
