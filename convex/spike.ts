// Block 0 spike: crawl a source page, notice it changed, email its owner.
// Deliberately ugly and hardcoded — this exists to answer one gate question,
// not to be the shipped architecture.
import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const INBOX = "still-true@agentmail.to";

// Explicit, because the action below calls this from the same file and TypeScript
// cannot infer through that cycle.
type CrawlResult =
  | { changed: false }
  | { changed: true; ownerEmail: string; questions: string[] };

type CheckResult = {
  changed: boolean;
  hash: string;
  emailed?: string;
  stale?: number;
};

async function sha256(text: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// One transaction: compare the hash, flip answers, report what the caller
// needs to write the email. Split into two calls and a re-crawl could race it.
export const recordCrawl = internalMutation({
  args: { url: v.string(), hash: v.string() },
  handler: async (ctx, args): Promise<CrawlResult> => {
    const source = await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .unique();
    if (!source) throw new Error(`no source row for ${args.url} — seed it first`);

    const now = Date.now();
    if (source.contentHash === args.hash) {
      await ctx.db.patch(source._id, { lastCheckedAt: now });
      return { changed: false };
    }

    await ctx.db.patch(source._id, { contentHash: args.hash, lastCheckedAt: now });

    // First crawl of a new source establishes the baseline; nothing went stale.
    if (source.contentHash === "") return { changed: false };

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_source", (q) => q.eq("sourceId", source._id))
      .take(100);
    for (const a of answers) {
      await ctx.db.patch(a._id, { status: "stale" });
    }

    return {
      changed: true,
      ownerEmail: source.ownerEmail,
      questions: answers.map((a) => a.question),
    };
  },
});

export const check = internalAction({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<CheckResult> => {
    // maxAge: 0 forces a live fetch. Firecrawl v2 serves cached content by
    // default, which would silently make every re-crawl look unchanged.
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: args.url,
        formats: ["markdown"],
        maxAge: 0,
      }),
    });
    if (!res.ok) throw new Error(`firecrawl ${res.status}: ${await res.text()}`);
    const markdown: string = (await res.json()).data?.markdown ?? "";
    if (!markdown) throw new Error("firecrawl returned no markdown");

    const hash = await sha256(markdown);
    const result = await ctx.runMutation(internal.spike.recordCrawl, {
      url: args.url,
      hash,
    });
    if (!result.changed) return { changed: false, hash };

    const mail = await fetch(
      `https://api.agentmail.to/v0/inboxes/${INBOX}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AGENT_MAIL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [result.ownerEmail],
          subject: `Source page changed — ${result.questions.length} answer(s) now stale`,
          text:
            `${args.url} changed since the last check.\n\n` +
            `Marked stale:\n` +
            result.questions.map((q) => `  - ${q}`).join("\n") +
            `\n\nRe-verify the page and republish.`,
        }),
      },
    );
    if (!mail.ok) throw new Error(`agentmail ${mail.status}: ${await mail.text()}`);

    return { changed: true, hash, emailed: result.ownerEmail, stale: result.questions.length };
  },
});

// Seed rows are disposable and get re-created constantly during the build.
// Internal: nothing public should be able to delete a source.
export const dropSource = internalMutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .unique();
    if (!source) return { dropped: 0 };

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_source", (q) => q.eq("sourceId", source._id))
      .take(100);
    for (const a of answers) {
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(source._id);
    return { dropped: answers.length };
  },
});
