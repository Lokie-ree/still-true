import { AgentMail, toSendPayload } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { diff, type Change } from "./change";
import { requireEnv } from "./env";
import { classify, extract } from "./extract";
import { documentUrl } from "./link";
import { fingerprint, toLines } from "./lines";
import { CHECKLISTS } from "./questions";
import { changeBody, failureBody, noDocumentBody, replyBody } from "./reply";
import { documentKind, extractedFinding } from "./schema";

// Inbound mail. Every function here is internal; the only thing reaching them
// from outside is the component's verified webhook, because a document row is
// the subject of a claim and nothing on the open internet gets to assert one.
//
// The component owns Svix verification, `event_id` dedupe, and the workpool
// that dispatches this callback, all in its own sandboxed tables. It does NOT
// send: on Convex 1.44 its sandbox cannot see AGENTMAIL_API_KEY, so outbound
// is `send` below. See the note there for the proof.
type OnMessageReceived = NonNullable<
  NonNullable<ConstructorParameters<typeof AgentMail>[1]>["onMessageReceived"]
>;

export const agentmail = new AgentMail(components.agentmail, {
  // ponytail: 0.1.0 declares `thread` required on this callback and then omits
  // it at runtime whenever AgentMail returned no thread metadata. The handler
  // below takes it optional, which is what actually arrives; this cast is the
  // cost of that disagreement. Delete it when the component's type matches
  // what it sends.
  onMessageReceived: internal.mail.received as unknown as OnMessageReceived,
});

// The component hands the message across as `unknown`, and it arrived from the
// internet, so every field is still narrowed here before use.
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown, key: string): string | null => {
  const field = asRecord(value)[key];
  return typeof field === "string" ? field : null;
};

const readStrings = (value: unknown, key: string): string[] => {
  const field = asRecord(value)[key];
  return Array.isArray(field) ? field.filter((x) => typeof x === "string") : [];
};

// One place that starts a reply, so nothing anywhere else has to know how mail
// leaves. Scheduling is part of this transaction, so a reply cannot be queued
// for findings that did not commit, and findings cannot commit with no reply
// behind them — without the send itself being able to roll them back.
//
// A row with no `inboxId` predates that field (the P1 test rows) and is not
// replyable; a row already sent is left alone.
async function reply(
  ctx: MutationCtx,
  threadRowId: Id<"threads">,
  body: { text: string; html: string },
): Promise<void> {
  const thread = await ctx.db.get("threads", threadRowId);
  if (thread === null) return;
  if (thread.inboxId === undefined || thread.repliedAt !== null) return;

  await ctx.scheduler.runAfter(0, internal.mail.send, {
    threadRowId,
    inboxId: thread.inboxId,
    parentMessageId: thread.messageId,
    // forward → back to the sender. cc → into the thread, in front of everyone
    // already arguing about it. P5 is where that second door gets exercised;
    // hardcoding `false` here would simply be wrong for a row already marked.
    replyAll: thread.mode === "cc",
    ...body,
  });
}

// The watch's door out, and the one place `repliedAt` is deliberately not
// consulted. That flag means "this message has been answered", which is exactly
// right for the reply and exactly wrong here: a change notice is a SECOND thing
// to say about a message that was already answered weeks ago, and the guard
// that stops a double reply would swallow every one of them.
//
// What stops a duplicate instead is upstream: a change is only ever computed
// when Firecrawl reports the source text moved, and the next check compares
// against the text we just read. Nothing here needs a second opinion about it.
async function notify(
  ctx: MutationCtx,
  threadRowId: Id<"threads">,
  body: { text: string; html: string },
): Promise<void> {
  const thread = await ctx.db.get("threads", threadRowId);
  if (thread === null || thread.inboxId === undefined) return;
  // Never mail a thread whose own first reply never made it out. They were told
  // nothing about this document; a change notice would be the first they hear
  // of it, and it would reference an answer they never received.
  if (thread.repliedAt === null) return;

  await ctx.scheduler.runAfter(0, internal.mail.send, {
    threadRowId,
    inboxId: thread.inboxId,
    parentMessageId: thread.messageId,
    replyAll: thread.mode === "cc",
    ...body,
  });
}

// Outbound mail, sent by us rather than by the component — the one place this
// project does not use `@agentmail/convex` for what it is for.
//
// `@agentmail/convex` 0.1.0 reads `process.env.AGENTMAIL_API_KEY` inside its
// own sandbox (component/utils.ts), and Convex 1.44 populates a component's
// environment only from what the parent binds through
// `app.use(child, { env })`. The component declares no env vars, so there is
// nothing to bind and the key is invisible to it. Proven rather than reasoned:
// at 19:31:51 on 2026-09-04, on one deployment, `attachmentUrl` below fetched a
// PDF with `requireEnv("AGENTMAIL_API_KEY")` while the component threw
// "AGENTMAIL_API_KEY is not set on this Convex deployment" — same key, same
// second, one side sees it and the other does not.
//
// 0.1.0 is the latest published version and `convex env set` has no component
// flag, so this is not a configuration mistake to correct. The component keeps
// the half it does well and we could not do better: Svix verification, event
// dedupe and the dispatch workpool. What we take back is one HTTP POST.
//
// ponytail: no retry. The component gave five attempts over a 30s backoff; a
// failure here writes to `threads.error` and is visible, which is the property
// that actually matters. Add `ctx.scheduler.runAfter` with a backoff if real
// sends start failing transiently.
export const send = internalAction({
  args: {
    threadRowId: v.id("threads"),
    inboxId: v.string(),
    parentMessageId: v.string(),
    replyAll: v.boolean(),
    text: v.string(),
    html: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const path = [args.inboxId, "messages", args.parentMessageId]
      .map(encodeURIComponent)
      .join("/");
    const res = await fetch(
      `https://api.agentmail.to/v0/inboxes/${path}/${args.replyAll ? "reply-all" : "reply"}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("AGENTMAIL_API_KEY")}`,
          "Content-Type": "application/json",
        },
        // The component's own converter, which owns the camelCase → snake_case
        // mapping and is unit-tested upstream. Borrowing it is cheaper than
        // re-deriving the wire format and cannot drift from it.
        body: JSON.stringify(
          toSendPayload({ text: args.text, html: args.html }),
        ),
      },
    );

    const detail = res.ok ? null : `AgentMail reply ${res.status}: ${await res.text()}`;
    await ctx.runMutation(internal.mail.recordSend, {
      threadRowId: args.threadRowId,
      error: detail,
    });
    // Rethrow so a failed send is a failed function in the logs, not a silent
    // row nobody reads. The record above has already landed.
    if (detail !== null) throw new Error(detail);
    return null;
  },
});

// `repliedAt` means SENT. It meant "enqueued" for exactly one day, and on that
// day it recorded a reply for a message AgentMail never accepted — the row said
// replied while the sender's inbox stayed empty. A timestamp that can be true
// while the thing it names did not happen is worse than no timestamp.
export const recordSend = internalMutation({
  args: {
    threadRowId: v.id("threads"),
    error: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(
      "threads",
      args.threadRowId,
      args.error === null
        ? { repliedAt: Date.now() }
        : { error: args.error },
    );
    return null;
  },
});

// Record the message, then start reading whatever it carried.
//
// The component already drops a redelivered `event_id`. This second guard is on
// `messageId`, which is what actually must not happen twice: one message, one
// document, and in P3 one reply — even if the same mail arrives as a fresh
// event. That is the exit test for P1.
export const received = internalMutation({
  // `thread` is optional against the component's own type, which declares it
  // required: 0.1.0 omits it entirely when AgentMail returned no thread
  // metadata, and an absent field fails a v.any() validator.
  args: { message: v.any(), thread: v.optional(v.any()), eventId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message: unknown = args.message;
    const messageId = readString(message, "message_id");
    const threadId = readString(message, "thread_id");
    const inboxId = readString(message, "inbox_id");
    if (messageId === null || threadId === null || inboxId === null) {
      console.error("unrecognized message payload", args.eventId);
      return null;
    }

    const seen = await ctx.db
      .query("threads")
      .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
      .unique();
    if (seen !== null) return null;

    // First real attachment wins. Inline parts are signatures and logos.
    const attachments = asRecord(message).attachments;
    const attachment = (Array.isArray(attachments) ? attachments : [])
      .map(asRecord)
      .find((a) => a.inline !== true && typeof a.attachment_id === "string");
    const attachmentId =
      attachment === undefined ? null : String(attachment.attachment_id);
    const filename =
      attachment !== undefined && typeof attachment.filename === "string"
        ? attachment.filename
        : null;

    // No attachment? The document may be a link in the body instead — and the
    // sender's mail client may have rewritten that link on the way out.
    const url =
      attachmentId !== null
        ? null
        : documentUrl(readString(message, "text") ?? "");

    // AgentMail's inbox_id is the address itself ("still-true@agentmail.to"),
    // so which header carries it tells forward from cc with no extra config.
    const isOurs = (address: string) => address.includes(inboxId);
    const mode =
      !readStrings(message, "to").some(isOurs) &&
      readStrings(message, "cc").some(isOurs)
        ? "cc"
        : "forward";

    const threadRowId = await ctx.db.insert("threads", {
      documentId: null,
      // Real AgentMail messages carry a scalar `from` ("Name <addr>"), not
      // the `from_` array the docs example shows. Checked against a live
      // message rather than the docs.
      fromEmail: readString(message, "from") ?? "",
      messageId,
      threadId,
      mode,
      receivedAt: Date.now(),
      repliedAt: null,
      // The door the mail came in is the door the reply goes back out.
      inboxId,
    });

    // Mail with neither an attachment nor a link is still recorded, and now
    // answered: a stranger who writes to this address and hears nothing back
    // learns only that it is broken.
    if (attachmentId === null && url === null) {
      await reply(ctx, threadRowId, noDocumentBody());
      return null;
    }

    await ctx.scheduler.runAfter(0, internal.mail.ingest, {
      threadRowId,
      inboxId,
      messageId,
      attachmentId,
      url,
      title: filename ?? readString(message, "subject") ?? "(no subject)",
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

// What Firecrawl says about this URL since the last time OUR team scraped it.
// `new` on a first read, `same` when the page is byte-identical to our previous
// scrape, `changed` when it is not. This is the watch's whole gate: it is
// computed by Firecrawl from the two texts, so it is deterministic — unlike
// asking the model twice and diffing the answers, which the 09-04 deploy
// measured drifting on 2 of 47 cells with the documents standing still.
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
      // The 08-30 readiness finding, closed. Firecrawl serves a cached scrape
      // up to two days old by default, so without this a watch could re-read a
      // page every morning and be handed Monday's copy all week — and a person
      // forwarding a document today would be told what it said on Saturday.
      maxAge: 0,
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
  const markdown = asRecord(asRecord(body).data).markdown;
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

    // M1. Every throw below this line used to be silent to everyone: the thread
    // row sat at `repliedAt: null` forever, scheduled actions do not retry, and
    // the sender was left waiting on a reply that was never coming. Tell them,
    // record why, and then rethrow so the failure still shows in the logs.
    try {
      return await readAndPublish(ctx, {
        source,
        // The signed attachment URL is deliberately not stored: it expires, and
        // a forwarded PDF is a fixed artifact with nothing to re-check. Only
        // url-backed documents are ever watched.
        url: args.url,
        title: args.title,
        threadRowId: args.threadRowId,
        recheckOf: null,
      });
    } catch (thrown) {
      await ctx.runMutation(internal.mail.failed, {
        threadRowId: args.threadRowId,
        title: args.title,
        error: thrown instanceof Error ? thrown.message : String(thrown),
      });
      throw thrown;
    }
  },
});

// The dead letter. The sender gets a plain apology naming nothing about the
// document, because we did not read it; the reason goes on the row, where it is
// ours to read and cannot leak a signed URL into somebody's inbox.
export const failed = internalMutation({
  args: {
    threadRowId: v.id("threads"),
    title: v.string(),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await reply(ctx, args.threadRowId, failureBody(args.title));
    await ctx.db.patch("threads", args.threadRowId, { error: args.error });
    return null;
  },
});

// A re-check that found the page identical. Nothing about the document or its
// findings changed, so the only thing to write is that we looked — which is a
// claim the board is entitled to make and a person is entitled to check.
//
// "Checked 6 hours ago, unchanged" is the watch's normal day, and saying it out
// loud is the difference between a system that is watching and one that merely
// promised to.
// What this document read as, last time it was read properly. Null when the row
// predates the watch, which every caller treats as "read it again".
export const hashOf = internalQuery({
  args: { documentId: v.id("documents") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);
    return document?.contentHash ?? null;
  },
});

export const checked = internalMutation({
  args: { documentId: v.id("documents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("documents", args.documentId, {
      lastCheckedAt: Date.now(),
    });
    return null;
  },
});

// scrape → classify → extract → publish. The one path from something readable
// to a published finding set. `ingest` arrives here with a thread attached;
// `probe` arrives with none, and so does the watch's re-check.
export async function readAndPublish(
  ctx: ActionCtx,
  args: {
    source: string;
    url: string | null;
    title: string;
    threadRowId: Id<"threads"> | null;
    // Set only by the watch. Its presence says "this document already exists
    // and I am re-reading it", which buys the early exit below: an unchanged
    // page costs one scrape and no model call at all.
    recheckOf: Id<"documents"> | null;
  },
): Promise<null> {
  const lines = toLines(await scrape(args.source));
  const contentHash = await fingerprint(lines);

  // The gate that makes the watch honest AND affordable. The document reads
  // exactly as it read last time, so there is nothing a re-extraction could
  // truthfully report. Stop before the model runs: no tokens, no findings
  // rewritten, and above all no change email sent because the model happened to
  // word an answer differently on a Tuesday.
  //
  // A first reading has no stored hash to match, so this cannot fire on the
  // mail path however this document was read before.
  if (args.recheckOf !== null) {
    const known = await ctx.runQuery(internal.mail.hashOf, {
      documentId: args.recheckOf,
    });
    if (known !== null && known === contentHash) {
      await ctx.runMutation(internal.mail.checked, {
        documentId: args.recheckOf,
      });
      return null;
    }
  }

  // The document is only in memory here, and it is never written down — the
  // parsed markdown does not go in the database and the PDF never touches this
  // system at all. So classification and extraction both happen now, while the
  // lines exist, and what survives is the citation into them.
  const kind = await classify(args.title, lines);
  const findings = await extract(lines, CHECKLISTS[kind]);

  await ctx.runMutation(internal.mail.attach, {
    threadRowId: args.threadRowId,
    url: args.url,
    title: args.title,
    kind,
    lineCount: lines.length,
    findings,
    contentHash,
    // The text, passed and never stored. `diff` searches it for the clause a
    // finding used to quote and refuses to report a change while that clause is
    // still there. Sent always: `attach` is the only place that knows whether
    // this document has a previous reading to differ from.
    text: lines,
  });
  return null;
}

// The P2 gate, runnable by hand:
//
//   npx convex run mail:probe '{"url":"https://www.paypal.com/us/legalhub/useragreement-full"}'
//
// The same pipeline the mail path takes, minus the mail. It exists because the
// STOP gate is the most consequential measurement in this project, and running
// it through three forwarded emails would conflate a delivery failure with an
// extraction failure. Internal like everything else that can publish a claim —
// `convex run` reaches it with an admin key, the open internet does not.
export const probe = internalAction({
  args: { url: v.string(), title: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) =>
    await readAndPublish(ctx, {
      source: args.url,
      url: args.url,
      title: args.title ?? args.url,
      threadRowId: null,
      recheckOf: null,
    }),
});

// The document and its findings land in one transaction, so a document is
// never visible with half of its answers published.
export const attach = internalMutation({
  args: {
    threadRowId: v.union(v.id("threads"), v.null()),
    url: v.union(v.string(), v.null()),
    title: v.string(),
    kind: documentKind,
    lineCount: v.number(),
    findings: v.array(extractedFinding),
    // SHA-256 of the lines. The watch's whole "did it change?" answer, computed
    // by us rather than read off a vendor's session state — see the note on
    // `fingerprint` in convex/lines.ts for the live run that forced that.
    contentHash: v.string(),
    // The document as it reads now. Passed, never stored: `diff` searches it
    // for the clause a finding used to quote, and refuses to report a change
    // while that clause is still in the document.
    text: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const url = args.url;
    let changes: Change[] = [];
    // The stored row, not the extractor's shape: it carries the change stamp
    // that has to survive a reading which did not move anything.
    const priorByKey = new Map<
      string,
      Doc<"findings"> & { verdict: "answered" }
    >();
    // Two people forwarding the same terms page are asking about one document.
    // They share the row, and therefore the watch.
    const existing =
      url === null
        ? null
        : await ctx.db
            .query("documents")
            .withIndex("by_url", (q) => q.eq("url", url))
            .first();

    let documentId: Id<"documents">;
    if (existing === null) {
      documentId = await ctx.db.insert("documents", {
        url,
        title: args.title,
        kind: args.kind,
        lineCount: args.lineCount,
        fetchedAt: now,
        lastCheckedAt: null,
        contentHash: args.contentHash,
        // The probe seeds the public corpus; inbound mail never does. Set once,
        // here, and deliberately NOT re-derived on the existing-row path below:
        // a stranger emailing a URL that is already on the board must not be
        // able to pull it off the board, and a public document must not become
        // private mid-demo because somebody forwarded it.
        isPublic: args.threadRowId === null,
      });
    } else {
      documentId = existing._id;
      await ctx.db.patch("documents", documentId, {
        kind: args.kind,
        lineCount: args.lineCount,
        fetchedAt: now,
        lastCheckedAt: now,
        contentHash: args.contentHash,
      });

      // Read the old answers BEFORE they go. A checklist is five rows, so the
      // bounded read covers it many times over.
      const before = await ctx.db
        .query("findings")
        .withIndex("by_documentId", (q) => q.eq("documentId", documentId))
        .take(50);

      // Only when Firecrawl says the text moved. On a re-forward of an
      // unchanged page this stays empty, so two people forwarding the same
      // terms page a week apart never mail each other a change that did not
      // happen.
      // The comparison happens HERE, inside the transaction that replaces the
      // findings, against the hash stored beside them. A retry recomputes the
      // same hash and reaches the same verdict; nothing about it is spent by
      // being read. A row with no stored hash predates the watch and is treated
      // as unchanged — the safe direction for a field that decides who gets
      // mailed.
      changes =
        existing.contentHash !== undefined &&
        existing.contentHash !== args.contentHash
          ? diff(before, args.findings, args.text)
          : [];

      // What each question used to say, carried across the delete so the row
      // that replaces it can still show its own history.
      for (const stale of before) {
        if (stale.verdict === "answered") priorByKey.set(stale.questionKey, stale);
        await ctx.db.delete("findings", stale._id);
      }
    }

    const moved = new Set(
      changes.filter((c) => c.kind === "moved").map((c) => c.questionKey),
    );

    for (const finding of args.findings) {
      if (finding.verdict !== "answered") {
        await ctx.db.insert("findings", {
          ...finding,
          documentId,
          verifiedAt: now,
        });
        continue;
      }

      // A change stamp survives later readings that did not move it, so the
      // board goes on saying "changed Sep 14" until the day it changes again.
      // Wiping it on every clean re-check would erase the only durable record
      // that anything ever happened.
      const prior = priorByKey.get(finding.questionKey);
      const stamp = moved.has(finding.questionKey)
        ? {
            previousAnswer: prior?.answer ?? null,
            previousQuote: prior?.quote,
            previousLineNo: prior?.lineNo,
            changedAt: now,
          }
        : {
            previousAnswer: prior?.previousAnswer ?? null,
            previousQuote: prior?.previousQuote,
            previousLineNo: prior?.previousLineNo,
            changedAt: prior?.changedAt ?? null,
          };

      await ctx.db.insert("findings", {
        ...finding,
        documentId,
        verifiedAt: now,
        ...stamp,
      });
    }

    // Everyone who ever asked about this document hears that it moved. The
    // threads table IS the subscription list — a person who forwarded a lease
    // asked to know what it requires of them, and that it stopped requiring it
    // is the same question answered later.
    if (changes.length > 0) {
      for (const thread of await ctx.db
        .query("threads")
        .withIndex("by_documentId", (q) => q.eq("documentId", documentId))
        .take(100)) {
        await notify(
          ctx,
          thread._id,
          changeBody({
            title: args.title,
            kind: args.kind,
            lineCount: args.lineCount,
            changes,
            checkedAt: now,
          }),
        );
      }
    }

    // The probe publishes with no thread, and P4's re-check will too. A
    // document is a document whether or not somebody emailed about it.
    if (args.threadRowId !== null) {
      await ctx.db.patch("threads", args.threadRowId, { documentId });

      // The reply is enqueued in the same transaction that publishes the
      // findings, so the sender can never be told an answer that did not
      // commit, and a commit can never happen with no reply queued behind it.
      await reply(
        ctx,
        args.threadRowId,
        replyBody({
          title: args.title,
          kind: args.kind,
          lineCount: args.lineCount,
          findings: args.findings,
          // A forwarded attachment has no URL, so there is nothing to
          // re-fetch and nothing to watch. Everything else is watched, with no
          // action from the sender — `convex/crons.ts` re-reads it daily.
          //
          // This was hardcoded false for one day, between production going
          // live and the watch existing, because the sentence it controls was
          // a promise nothing could keep. It is true again now.
          watchable: url !== null,
          checkedAt: now,
        }),
      );
    }
    return null;
  },
});
