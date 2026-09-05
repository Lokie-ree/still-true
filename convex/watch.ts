// The watch. "For documents that live at a URL it keeps watching, and tells you
// when the specific thing you asked about changes" is the sentence in the
// project description, and until this file existed it was the one claim the
// system could not back.
//
// The design is one decision, and it is not the obvious one. The obvious watch
// re-reads a document and compares the answers. That cannot work here: on
// 2026-09-04 the same six documents read on two deployments hours apart
// disagreed on 2 of 47 cells with nothing about the documents changing. So the
// question "did it change?" is answered by Firecrawl comparing two texts, and
// the model is only asked "what does it say now?" once that answer is yes.
//
// Everything below is scheduling around that. The reading itself is
// `mail.readAndPublish` — the same path a forwarded email takes, deliberately,
// because a watch that read documents differently from the way it first read
// them would be comparing two things that were never alike.

import { Workpool } from "@convex-dev/workpool";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalQuery } from "./_generated/server";
import { readAndPublish } from "./mail";

// maxParallelism 2 is about Firecrawl and OpenAI, not about Convex. A sweep
// that fires every document at once turns a rate limit into a wall of failures
// that all retry together; two at a time finishes a six-document corpus in
// well under a minute and never looks like a stampede to anybody downstream.
const pool = new Workpool(components.watchPool, {
  maxParallelism: 2,
  defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 10_000, base: 2 },
  retryActionsByDefault: true,
});

type Watchable = { documentId: Id<"documents">; url: string; title: string };

// What is watchable: a document with an address to go back to. A forwarded PDF
// is a fixed artifact — the signed attachment URL expired minutes after it
// arrived, and re-reading the sender's own copy would tell nobody anything.
export const watchable = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      documentId: v.id("documents"),
      url: v.string(),
      title: v.string(),
    }),
  ),
  handler: async (ctx) => {
    // ponytail: bounded take over the whole table, not an index on `url`. The
    // corpus is six documents plus whatever strangers have forwarded; when that
    // stops fitting in one page this wants `by_url` with a range and a cursor,
    // and the sweep wants to page through it.
    const documents = await ctx.db.query("documents").take(200);
    return documents.flatMap((d) =>
      d.url === null
        ? []
        : [{ documentId: d._id, url: d.url, title: d.title }],
    );
  },
});

// The cron's entry point, and runnable by hand:
//
//   npx convex run watch:sweep
//
// It enqueues rather than reads, so one tick cannot exceed an action's time
// budget however large the corpus grows, and a document whose fetch fails is
// retried on its own without holding up the rest.
export const sweep = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Annotated because this module's own API is referenced from inside it, and
    // TypeScript will not infer a type that depends on the thing being defined.
    const documents: Watchable[] = await ctx.runQuery(
      internal.watch.watchable,
      {},
    );
    for (const d of documents) {
      await pool.enqueueAction(ctx, internal.watch.recheck, d);
    }
    return documents.length;
  },
});

// One document, re-read.
//
// No try/catch and no dead letter here, which is the opposite of `mail.ingest`
// and correct for the same reason. `ingest` catches because a person is waiting
// on a reply and silence is the worst outcome; a re-check has nobody waiting,
// so a throw is exactly right — the workpool retries it with backoff, and if it
// still fails the failure is a failed function in the logs rather than a
// half-updated document. The old findings stay untouched until a complete new
// reading is ready to replace them in one transaction.
export const recheck = internalAction({
  args: {
    documentId: v.id("documents"),
    url: v.string(),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) =>
    await readAndPublish(ctx, {
      source: args.url,
      url: args.url,
      title: args.title,
      // No thread: a re-check is not an answer to anybody's message. Whoever
      // needs telling is found from the document, in `mail.attach`, and only
      // if something actually moved.
      threadRowId: null,
      // The whole difference. This is what buys the early exit on an unchanged
      // page, and what keeps a first reading from ever taking it.
      recheckOf: args.documentId,
    }),
});
