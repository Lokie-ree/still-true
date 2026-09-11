// The watch. "For documents that live at a URL it keeps watching, and tells you
// when the specific thing you asked about changes" is the sentence in the
// project description, and until this file existed it was the one claim the
// system could not back.
//
// The design is one decision, and it is not the obvious one. The obvious watch
// re-reads a document and compares the answers. That cannot work here: on
// 2026-09-04 the same six documents read on two deployments hours apart
// disagreed on 2 of 47 cells with nothing about the documents changing. So the
// question "did it change?" is answered by hashing the text, and the model is
// only asked "what does it say now?" once that answer is yes.
//
// Everything below is scheduling around that. The reading itself is
// `mail.readAndPublish` — the same path a forwarded email takes, deliberately,
// because a watch that read documents differently from the way it first read
// them would be comparing two things that were never alike.

import { Workpool } from "@convex-dev/workpool";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { readAndPublish } from "./mail";

// maxParallelism 2 is about Firecrawl and OpenAI, not about Convex. A sweep
// that fires every document at once turns a rate limit into a wall of failures
// that all retry together; two at a time finishes a six-document corpus in
// well under a minute and never looks like a stampede to anybody downstream.
//
// **That sentence is dated, and 2026-09-11 is the day it stopped being true.**
// The corpus is 14 url-backed documents now, three of them PDFs that cost
// Firecrawl more than one request each, and the 11:17 UTC sweep produced 11
// `Firecrawl 429` failures in 42 seconds. Two documents exhausted their retries
// and carried a `watchError` for a day.
//
// `maxParallelism` caps CONCURRENCY, not RATE: two at a time still puts the
// whole corpus through in seconds. The retry schedule is what turns a transient
// per-minute limit into a permanent failure — at 10s and base 2, all three
// attempts land at 0s, 10s and 30s, inside the same 60-second window that is
// already exhausted. Firecrawl said `retry after 40s, resets at 11:18:07` and
// we came back at 10s and 30s.
//
// So the backoff is longer than the window it is waiting out: attempts at 0s,
// 60s and 120s, each in a minute Firecrawl has reset. A daily job has all the
// time in the world; the thing it cannot afford is arriving three times during
// the one minute it is not welcome.
//
// ponytail: this makes the retries polite, not the sweep. The fan-out still
// grows with the corpus and a big enough one will exhaust the limit on first
// attempts alone. The fix for that is the rate limiter this deployment already
// installs for mail (`@convex-dev/rate-limiter`), gating Firecrawl calls to N
// per minute so the sweep paces itself instead of apologising afterwards. See
// **M10** in `docs/READINESS.md`; it is not a night-before-the-video change.
const pool = new Workpool(components.watchPool, {
  maxParallelism: 2,
  defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 60_000, base: 2 },
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

// M3. Why the last re-check failed, written where somebody can read it.
//
// Its own mutation rather than a field on `checked`, because it runs on the
// path where nothing else commits: the whole point is that a failed re-check
// used to write nothing at all.
export const failed = internalMutation({
  args: { documentId: v.id("documents"), error: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("documents", args.documentId, {
      // Truncated: a Firecrawl or OpenAI body can be enormous and the first
      // line is what says which of them failed. The full text is still in the
      // logs for anyone who can read them, which is the point — this is the
      // copy for everyone who cannot.
      watchError: args.error.slice(0, 500),
    });
    return null;
  },
});

// One document, re-read.
//
// The throw stays, and it has to: the workpool retries with backoff, and a
// re-check that swallowed its own failure would leave the old findings looking
// current. What changed is that the throw is no longer the ONLY record.
//
// The original argument here was that `ingest` catches because a person is
// waiting on a reply, while a re-check has nobody waiting — so a failed
// function in the logs was enough. That was M3, and it was wrong for a reason
// the code could not see: prod log reads are refused by the read-only MCP
// selector and dev retains zero failure entries, so the only surviving signal
// was a `lastCheckedAt` that quietly stopped advancing while reply.ts went on
// promising a daily re-read. Record it on the row, then rethrow, so the retry
// and the visibility are not a choice between two.
//
// The old findings still stay untouched until a complete new reading is ready
// to replace them in one transaction.
export const recheck = internalAction({
  args: {
    documentId: v.id("documents"),
    url: v.string(),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      return await readAndPublish(ctx, {
        source: args.url,
        url: args.url,
        title: args.title,
        // No thread: a re-check is not an answer to anybody's message. Whoever
        // needs telling is found from the document, in `mail.attach`, and only
        // if something actually moved.
        threadRowId: null,
        // The whole difference. This is what buys the early exit on an
        // unchanged page, and what keeps a first reading from ever taking it.
        recheckOf: args.documentId,
      });
    } catch (error) {
      // Every retry overwrites this with its own message and a success clears
      // it, so the field means "failing now", not "failed once". That is the
      // only reading that is worth putting in front of anybody.
      await ctx.runMutation(internal.watch.failed, {
        documentId: args.documentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});
