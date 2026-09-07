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

// M3's field is stripped here, in the validator AND in the rows.
//
// `recent` answers the open internet with whole document rows, which is a habit
// worth naming: every field added to `documents` is published by default, and
// the one time that was not noticed is why `isPublic` exists. `watchError`
// carries our stack's error text — a Firecrawl response body, an OpenAI
// message — and belongs to whoever runs `npm run gate`, not to a stranger.
const publicDocument = schema.doc("documents").omit("watchError");

export const recent = query({
  args: {},
  returns: v.array(publicDocument),
  handler: async (ctx) => {
    // The PUBLIC corpus only. This query is unauthenticated and the app has no
    // auth foundation, so anything it returns is returned to the open
    // internet — and a forwarded document is somebody's lease, titled with
    // their own subject line. The index is the gate rather than a `.filter()`,
    // so a private row is never read at all.
    //
    // ponytail: bounded take, not collect. Paginate when the corpus outgrows it.
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);

    // Dropped from the row, not just from the validator. A return validator
    // that merely disagrees with the data is a runtime error waiting for the
    // first failed re-check on a public document, which is exactly the moment
    // this must not break.
    return documents.map(({ watchError: _private, ...visible }) => visible);
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
