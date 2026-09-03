import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { requireEnv } from "./env";
import { toLines } from "./lines";

// Inbound mail. Every function here is internal: the only thing that reaches
// them from outside is a signature-verified webhook in `http.ts`, because a
// document row is the subject of a claim and nothing on the open internet gets
// to assert one.

// Record the message, then start reading whatever it carried.
//
// AgentMail retries, and it can deliver the same event twice. `by_messageId`
// is what makes the second delivery a no-op instead of a second document and a
// second reply — this is the exit test for P1.
export const receive = internalMutation({
  args: {
    messageId: v.string(),
    threadId: v.string(),
    fromEmail: v.string(),
    inboxId: v.string(),
    mode: v.union(v.literal("forward"), v.literal("cc")),
    title: v.string(),
    attachmentId: v.union(v.string(), v.null()),
    url: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("threads")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (seen !== null) return null;

    const threadRowId = await ctx.db.insert("threads", {
      documentId: null,
      fromEmail: args.fromEmail,
      messageId: args.messageId,
      threadId: args.threadId,
      mode: args.mode,
      receivedAt: Date.now(),
      repliedAt: null,
    });

    // Mail with neither an attachment nor a link is still recorded — P3 replies
    // to it saying so — but there is nothing to fetch.
    if (args.attachmentId === null && args.url === null) return null;

    await ctx.scheduler.runAfter(0, internal.mail.ingest, {
      threadRowId,
      inboxId: args.inboxId,
      messageId: args.messageId,
      attachmentId: args.attachmentId,
      url: args.url,
      title: args.title,
    });
    return null;
  },
});

// An attachment has no URL of its own, but AgentMail hands out a short-lived
// signed one. So Firecrawl fetches the PDF directly and this system never holds
// a copy of somebody's lease — which is the answer to "people will forward
// private documents", not a paragraph in the terms.
async function attachmentUrl(
  inboxId: string,
  messageId: string,
  attachmentId: string,
): Promise<string> {
  const path = [inboxId, "messages", messageId, "attachments", attachmentId]
    .map(encodeURIComponent)
    .join("/");
  const res = await fetch(`https://api.agentmail.to/v0/inboxes/${path}`, {
    headers: { Authorization: `Bearer ${requireEnv("AGENTMAIL_API_KEY")}` },
  });
  if (!res.ok) {
    throw new Error(`AgentMail attachment ${res.status}: ${await res.text()}`);
  }
  const body: unknown = await res.json();
  const downloadUrl = (body as { download_url?: unknown }).download_url;
  if (typeof downloadUrl !== "string") {
    throw new Error("AgentMail attachment response carried no download_url");
  }
  return downloadUrl;
}

async function scrape(url: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("FIRECRAWL_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      // Defaults to true, which strips "boilerplate" — in a consumer agreement
      // the boilerplate IS the document. Never turn this on here.
      onlyMainContent: false,
      parsers: [{ type: "pdf", mode: "auto", maxPages: 200 }],
      timeout: 120_000,
    }),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status}: ${await res.text()}`);
  }
  const body: unknown = await res.json();
  const markdown = (body as { data?: { markdown?: unknown } }).data?.markdown;
  if (typeof markdown !== "string") {
    throw new Error("Firecrawl returned no markdown");
  }
  // Probe v3 run 1 coded two JS-rendered pages as findings when Firecrawl had
  // actually returned ~370 chars of nothing. Fail loudly here instead.
  if (markdown.length < 6_000) {
    throw new Error(
      `Firecrawl returned ${markdown.length} chars for ${url} — too short to be the document`,
    );
  }
  return markdown;
}

export const ingest = internalAction({
  args: {
    threadRowId: v.id("threads"),
    inboxId: v.string(),
    messageId: v.string(),
    attachmentId: v.union(v.string(), v.null()),
    url: v.union(v.string(), v.null()),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const attachmentId = args.attachmentId;
    const source =
      attachmentId !== null
        ? await attachmentUrl(args.inboxId, args.messageId, attachmentId)
        : args.url;
    if (source === null) throw new Error("ingest scheduled with nothing to read");

    const lines = toLines(await scrape(source));
    await ctx.runMutation(internal.mail.attach, {
      threadRowId: args.threadRowId,
      // The signed attachment URL is deliberately not stored: it expires, and a
      // forwarded PDF is a fixed artifact with nothing to re-check. Only
      // url-backed documents are ever watched.
      url: args.url,
      title: args.title,
      lineCount: lines.length,
    });
    return null;
  },
});

export const attach = internalMutation({
  args: {
    threadRowId: v.id("threads"),
    url: v.union(v.string(), v.null()),
    title: v.string(),
    lineCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const url = args.url;
    // Two people forwarding the same terms page are asking about one document.
    // They share the row, and therefore the watch.
    const existing =
      url === null
        ? null
        : await ctx.db
            .query("documents")
            .withIndex("by_url", (q) => q.eq("url", url))
            .first();

    let documentId;
    if (existing === null) {
      documentId = await ctx.db.insert("documents", {
        url,
        title: args.title,
        // ponytail: P2's extractor is already reading the whole document and
        // can set this properly. Guessing from a filename now would be a
        // second, worse classifier.
        kind: "other",
        lineCount: args.lineCount,
        fetchedAt: now,
        lastCheckedAt: null,
      });
    } else {
      documentId = existing._id;
      await ctx.db.patch("documents", documentId, {
        lineCount: args.lineCount,
        fetchedAt: now,
      });
    }

    await ctx.db.patch("threads", args.threadRowId, { documentId });
    return null;
  },
});
