import { v } from "convex/values";
import { query } from "./_generated/server";
import schema from "./schema";

// Reads only. Every write into this schema is internal — the crawl, the
// extraction and the mail handler are the only things allowed to publish a
// finding, because a finding is a claim about what a document says and nothing
// reachable from the open internet should be able to assert one.
//
// The previous schema shipped a public `publish` mutation that let any caller
// write arbitrary answers, URLs and owner emails into production. That is why
// this file has no mutation in it.

export const recent = query({
  args: {},
  returns: v.array(schema.doc("documents")),
  handler: async (ctx) => {
    // ponytail: bounded take, not collect. Paginate when the list outgrows it.
    return await ctx.db.query("documents").order("desc").take(50);
  },
});

export const findingsFor = query({
  args: { documentId: v.id("documents") },
  returns: v.array(schema.doc("findings")),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .take(50);
  },
});
