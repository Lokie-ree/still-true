import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // A document someone sent us. `url` is null for an emailed attachment: a
  // forwarded lease PDF is a fixed artifact with nothing to re-fetch, so only
  // url-backed documents are ever re-checked.
  //
  // The parsed markdown is deliberately NOT stored. Handbooks and consumer
  // agreements run 50-370 KB and would press against the 1 MB document limit;
  // Firecrawl holds previous page state for changeTracking, and the evidence a
  // reader actually needs lives on the finding as a quote.
  documents: defineTable({
    url: v.union(v.string(), v.null()),
    title: v.string(),
    kind: v.union(
      v.literal("lease"),
      v.literal("tos"),
      v.literal("notice"),
      v.literal("other"),
    ),
    lineCount: v.number(),
    fetchedAt: v.number(),
    lastCheckedAt: v.union(v.number(), v.null()),
  }).index("by_url", ["url"]),

  // One answer to one predeclared question about one document.
  //
  // A union rather than a wide row with nullable columns, so that an `answered`
  // finding CANNOT exist without its quote. That is the product's whole
  // invariant — no answer without a receipt — and this makes the illegal state
  // unrepresentable rather than merely discouraged.
  //
  // `linesSearched` is on both arms because a refusal has to be countable:
  // "searched 3,505 lines and it is not there" is the claim, not "I don't know".
  findings: defineTable(
    v.union(
      v.object({
        documentId: v.id("documents"),
        questionKey: v.string(),
        verdict: v.literal("answered"),
        answer: v.string(),
        quote: v.string(),
        lineNo: v.number(),
        contextBefore: v.string(),
        contextAfter: v.string(),
        linesSearched: v.number(),
        verifiedAt: v.number(),
        // Set when a re-check moved this answer. The pair is the diff a
        // subscriber is told about.
        previousAnswer: v.union(v.string(), v.null()),
        changedAt: v.union(v.number(), v.null()),
      }),
      v.object({
        documentId: v.id("documents"),
        questionKey: v.string(),
        verdict: v.literal("not_stated"),
        linesSearched: v.number(),
        verifiedAt: v.number(),
      }),
    ),
  )
    .index("by_documentId", ["documentId"])
    .index("by_documentId_and_questionKey", ["documentId", "questionKey"]),

  // Inbound mail. `messageId` is indexed for webhook idempotency — AgentMail
  // can deliver the same event twice and we must not reply twice.
  //
  // This also carries the watch: anyone with a thread against a url-backed
  // document is told when a finding on it moves, so there is no separate
  // subscriptions table to keep in sync.
  threads: defineTable({
    documentId: v.union(v.id("documents"), v.null()),
    fromEmail: v.string(),
    messageId: v.string(),
    threadId: v.string(),
    // forward → reply to the sender. cc → reply into the thread.
    mode: v.union(v.literal("forward"), v.literal("cc")),
    receivedAt: v.number(),
    repliedAt: v.union(v.number(), v.null()),
  })
    .index("by_messageId", ["messageId"])
    .index("by_threadId", ["threadId"])
    .index("by_documentId", ["documentId"]),
});
