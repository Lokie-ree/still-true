import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // A page we watch. contentHash is what staleness compares against.
  sources: defineTable({
    url: v.string(),
    ownerEmail: v.string(),
    contentHash: v.string(),
    lastCheckedAt: v.number(),
  }).index("by_url", ["url"]),

  // A published answer, pinned to the source it came from.
  answers: defineTable({
    question: v.string(),
    answer: v.string(),
    sourceId: v.id("sources"),
    verifiedAt: v.number(),
    status: v.union(v.literal("fresh"), v.literal("stale")),
  })
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"]),

  // An inbound question. answerId null means we refused to guess and routed it.
  questions: defineTable({
    fromEmail: v.string(),
    text: v.string(),
    answerId: v.union(v.id("answers"), v.null()),
    routedTo: v.union(v.string(), v.null()),
  }),
});
