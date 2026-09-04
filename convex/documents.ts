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
    // The PUBLIC corpus only. This query is unauthenticated and the app has no
    // auth foundation, so anything it returns is returned to the open
    // internet — and a forwarded document is somebody's lease, titled with
    // their own subject line. The index is the gate rather than a `.filter()`,
    // so a private row is never read at all.
    //
    // ponytail: bounded take, not collect. Paginate when the corpus outgrows it.
    return await ctx.db
      .query("documents")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);
  },
});

export const findingsFor = query({
  args: { documentId: v.id("documents") },
  returns: v.array(schema.doc("findings")),
  handler: async (ctx, args) => {
    // `documentId` is client-supplied, so the same gate has to stand here. A
    // finding carries a verbatim quote out of the document; leaving this
    // ungated would publish the contents of a private lease to anyone holding
    // an id, with the board merely declining to name it.
    const document = await ctx.db.get("documents", args.documentId);
    if (document?.isPublic !== true) return [];

    return await ctx.db
      .query("findings")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .take(50);
  },
});
