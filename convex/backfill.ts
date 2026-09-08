// H4's other half, and the half that is easy to skip.
//
// Parsing the header correctly from now on fixes nothing for the rows already
// in the table. Those hold display-name strings, so a thread created before the
// fix stops matching its own owner's normalised address — and a STOP after the
// fix would silently miss everything sent before it. Same defect, new costume,
// and now with a promise already delivered to a real inbox attached to it.
//
// Run once per deployment:
//
//   npx convex run backfill:senderIdentities --prod
//
// SAFE TO RE-RUN. `senderAddress` of an already-normalised address is that same
// address, so a second pass patches nothing — there is a test for exactly that
// in convex/sender.test.ts, because a backfill whose second run corrupts its
// first is worse than no backfill.
//
// ponytail: one transaction, `take(500)`. Nineteen rows exist across both
// deployments and a mutation's document limits are far above that. If `threads`
// ever outgrows one transaction this wants the batched-continuation pattern —
// patch a page, then `ctx.scheduler.runAfter(0, ...)` with a cursor — not a
// bigger take.

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { senderAddress } from "./sender";

export const senderIdentities = internalMutation({
  args: {},
  returns: v.object({
    scanned: v.number(),
    rewritten: v.number(),
    alreadyBare: v.number(),
    // Rows whose `From` header names no single mailbox. Left exactly as they
    // are — there is nothing better to write — and reported by name so the run
    // can say whether any resolved ambiguously rather than implying none did.
    unidentifiable: v.array(v.string()),
    // The point of the whole exercise: which stored strings turned out to be
    // one mailbox. An entry with more than one `wasStoredAs` is a merge, and a
    // merge is a STOP that used to cover some of somebody's threads.
    identities: v.array(
      v.object({
        address: v.string(),
        rows: v.number(),
        wasStoredAs: v.array(v.string()),
      }),
    ),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db.query("threads").take(500);

    const byAddress = new Map<string, { rows: number; headers: Set<string> }>();
    const unidentifiable = new Set<string>();
    let rewritten = 0;
    let alreadyBare = 0;

    for (const row of rows) {
      const stored = row.fromEmail;
      const address = senderAddress(stored);

      if (address === null) {
        unidentifiable.add(stored);
        continue;
      }

      const seen = byAddress.get(address) ?? { rows: 0, headers: new Set() };
      seen.rows += 1;
      seen.headers.add(stored);
      byAddress.set(address, seen);

      if (address === stored) {
        alreadyBare += 1;
        continue;
      }
      await ctx.db.patch("threads", row._id, { fromEmail: address });
      rewritten += 1;
    }

    return {
      scanned: rows.length,
      rewritten,
      alreadyBare,
      unidentifiable: [...unidentifiable],
      identities: [...byAddress.entries()]
        .map(([address, seen]) => ({
          address,
          rows: seen.rows,
          wasStoredAs: [...seen.headers],
        }))
        // Merges first — they are the finding, and a long tail of one-row
        // identities should not push them off the end of a terminal.
        .sort((a, b) => b.wasStoredAs.length - a.wasStoredAs.length),
    };
  },
});
