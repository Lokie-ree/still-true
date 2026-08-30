import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// The board: every answer with the source it came from.
export const board = query({
  args: {},
  handler: async (ctx) => {
    // ponytail: unbounded — paginate once the board outgrows one screen.
    const answers = await ctx.db.query("answers").order("desc").take(100);
    return Promise.all(
      answers.map(async (a) => ({
        ...a,
        source: await ctx.db.get(a.sourceId),
      })),
    );
  },
});

// Seed helper until Firecrawl + the email door exist.
export const publish = mutation({
  args: {
    question: v.string(),
    answer: v.string(),
    url: v.string(),
    ownerEmail: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .unique();
    const sourceId =
      existing?._id ??
      (await ctx.db.insert("sources", {
        url: args.url,
        ownerEmail: args.ownerEmail,
        contentHash: args.contentHash,
        lastCheckedAt: now,
      }));
    return ctx.db.insert("answers", {
      question: args.question,
      answer: args.answer,
      sourceId,
      verifiedAt: now,
      status: "fresh",
    });
  },
});
