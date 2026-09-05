import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// A finding as the extractor produces it, before the database has anything to
// say about it. `mail.attach` takes an array of these and the `findings` table
// below extends them with `documentId` and the timestamps, so the extractor's
// output is checked against the stored shape by the compiler rather than by
// hand. See convex/extract.ts, which returns exactly this.
export const answeredFinding = v.object({
  questionKey: v.string(),
  verdict: v.literal("answered"),
  answer: v.string(),
  quote: v.string(),
  lineNo: v.number(),
  contextBefore: v.string(),
  contextAfter: v.string(),
  linesSearched: v.number(),
});

export const notStatedFinding = v.object({
  questionKey: v.string(),
  verdict: v.literal("not_stated"),
  linesSearched: v.number(),
});

export const extractedFinding = v.union(answeredFinding, notStatedFinding);

// Which predeclared checklist a document gets. Shared with `mail.attach` so
// that the classifier's return type in convex/questions.ts is checked against
// the stored column by the compiler — a kind added to one and not the other
// fails `tsc`, rather than failing at insert time in front of a judge.
export const documentKind = v.union(
  v.literal("lease"),
  v.literal("tos"),
  v.literal("notice"),
  v.literal("other"),
);

export default defineSchema({
  // A document someone sent us. `url` is null for an emailed attachment: a
  // forwarded lease PDF is a fixed artifact with nothing to re-fetch, so only
  // url-backed documents are ever re-checked.
  //
  // The parsed markdown is deliberately NOT stored. Handbooks and consumer
  // agreements run 50-370 KB and would press against the 1 MB document limit;
  // `contentHash` below is 64 characters and answers the only question the
  // watch asks of the old text, and the evidence a reader actually needs lives
  // on the finding as a quote.
  documents: defineTable({
    url: v.union(v.string(), v.null()),
    title: v.string(),
    kind: documentKind,
    lineCount: v.number(),
    fetchedAt: v.number(),
    lastCheckedAt: v.union(v.number(), v.null()),
    // Whether this document belongs to the PUBLIC corpus — the board a
    // stranger sees. Set once at insert from "did a person email this in?":
    // `mail:probe` seeds the corpus, inbound mail never does.
    //
    // The plan's one-line version of this was "filter to url !== null", and
    // the development database falsified it: a mailed LINK carries no
    // attachment, so `title` falls back to the sender's subject and a row
    // reading `Fwd: please read this before I sign` has a non-null url. The
    // sender's own words, on a public board, is the exact leak the filter
    // was for. Provenance is the thing being asked about, so store it.
    //
    // Optional so the rows that predate the field read as private without a
    // backfill — the safe direction for a field that gates disclosure.
    isPublic: v.optional(v.boolean()),
    // SHA-256 of the lines as they last read. This is the watch's answer to
    // "did it change?", and it is ours rather than the scraper's on purpose.
    //
    // Firecrawl's `changeTracking.changeStatus` was the first design and a live
    // run killed it: the signal compares a scrape against the previous scrape
    // of the same URL by the same team, so reading it SPENDS it. A sweep on
    // 2026-09-05 scraped this project's own fixture after two clauses were
    // edited, failed after the fetch, and every read afterwards said `same` —
    // the new text against the new text. The retry meant to make the watch
    // reliable is what destroyed the evidence that anything had moved.
    //
    // Optional so rows written before the watch read as "no previous reading",
    // which is treated as unchanged: the safe direction for a field that
    // decides whether a stranger gets an unsolicited email.
    contentHash: v.optional(v.string()),
  })
    .index("by_url", ["url"])
    .index("by_isPublic", ["isPublic"]),

  // One answer to one predeclared question about one document.
  //
  // A union rather than a wide row with nullable columns, so that an `answered`
  // finding CANNOT exist without its quote. That is the product's whole
  // invariant — no answer without a receipt — and this makes the illegal state
  // unrepresentable rather than merely discouraged.
  //
  // `linesSearched` is on both arms because a refusal has to be countable:
  // "searched 3,505 lines and it is not there" is the claim, not "I don't know".
  //
  // The two arms are extended from what the extractor produces (below), so the
  // shape verify() returns and the shape stored here cannot drift apart.
  findings: defineTable(
    v.union(
      answeredFinding.extend({
        documentId: v.id("documents"),
        verifiedAt: v.number(),
        // Set when a re-check moved this answer. The pair is the diff a
        // subscriber is told about.
        //
        // Set ONLY when the document's stored hash differs from what it
        // reads as now — never from a diff of two model runs. The 09-04 deploy
        // measured two runs disagreeing on 2 of 47 cells with the documents
        // standing still, so an answer-diff would report a lease "changed"
        // because the model reworded a sentence on a Tuesday. That is the one
        // lie this system exists not to tell.
        previousAnswer: v.union(v.string(), v.null()),
        changedAt: v.union(v.number(), v.null()),
        // The old QUOTE, not just the old prose. An answer is a claim; the
        // quote is the receipt for it, and a change notice with no receipt for
        // what it used to say is exactly the unfalsifiable summary this
        // project refuses to produce. Optional so rows written before the
        // watch existed read as "no previous receipt" without a backfill.
        previousQuote: v.optional(v.string()),
        previousLineNo: v.optional(v.number()),
      }),
      notStatedFinding.extend({
        documentId: v.id("documents"),
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
    // Set when AgentMail ACCEPTED the reply, by the send action, never by the
    // mutation that queued it. It meant "enqueued" for one day and recorded a
    // reply for a message that was never sent; a timestamp that can be true
    // while the thing it names did not happen is worse than no timestamp.
    repliedAt: v.union(v.number(), v.null()),
    // The inbox the mail actually arrived at, so the reply goes back out the
    // same door. Optional only because the P1 test rows predate it; a row
    // without it is not replyable, which is the safe direction.
    inboxId: v.optional(v.string()),
    // M1: `readAndPublish` throws on a Firecrawl non-200, the 6,000-char guard
    // or a model refusal, and scheduled actions do not retry. Without this the
    // row sat at `repliedAt: null` forever and the failure was silent to
    // everyone, including us. The sender gets a plain apology; the reason
    // stays here, because it is our stack's error text and can carry a signed
    // URL.
    error: v.optional(v.string()),
  })
    .index("by_messageId", ["messageId"])
    .index("by_threadId", ["threadId"])
    .index("by_documentId", ["documentId"]),
});
