import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { requireEnv } from "./env";

// The only route open to the internet. It verifies, narrows, and hands off —
// nothing here touches the database directly.

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

const decodeBase64 = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const encodeBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

// Comparing MACs with === leaks the length of the matching prefix through
// timing. Cheap to avoid, so avoid it.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// AgentMail signs with Svix: HMAC-SHA256 over `id.timestamp.body`, keyed by the
// base64 body of the `whsec_` secret, compared against a space-delimited list
// of `v1,<base64>` candidates (a list, because secrets can be rotated).
//
// Verified against the RAW body. Re-serializing parsed JSON changes the bytes
// and every signature fails.
async function isSigned(req: Request, raw: string): Promise<boolean> {
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatures = req.headers.get("svix-signature");
  if (id === null || timestamp === null || signatures === null) return false;

  const sentAt = Number(timestamp) * 1000;
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(Date.now() - sentAt) > REPLAY_WINDOW_MS) return false;

  const secret = requireEnv("AGENTMAIL_WEBHOOK_SECRET").replace(/^whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    decodeBase64(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${raw}`),
  );
  const expected = encodeBase64(new Uint8Array(mac));

  return signatures
    .split(" ")
    .some((s) => s.startsWith("v1,") && timingSafeEqual(s.slice(3), expected));
}

// `await req.json()` is `unknown` and this one arrives from the internet, so
// every field is narrowed before use and a payload that fails is a 400.
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

const http = httpRouter();

http.route({
  path: "/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.text();
    if (!(await isSigned(req, raw))) {
      return new Response("bad signature", { status: 401 });
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response("malformed json", { status: 400 });
    }

    // Subscribing to more event types than we handle is normal; acknowledge
    // the rest so AgentMail does not retry them forever.
    if (readString(body, "event_type") !== "message.received") {
      return new Response(null, { status: 200 });
    }

    const message = asRecord(body).message;
    const messageId = readString(message, "message_id");
    const threadId = readString(message, "thread_id");
    const inboxId = readString(message, "inbox_id");
    if (messageId === null || threadId === null || inboxId === null) {
      return new Response("unrecognized message payload", { status: 400 });
    }

    // First real attachment wins. Inline parts are signatures and logos.
    const attachment = (
      Array.isArray(asRecord(message).attachments)
        ? (asRecord(message).attachments as unknown[])
        : []
    )
      .map(asRecord)
      .find((a) => a.inline !== true && typeof a.attachment_id === "string");

    const attachmentId =
      attachment === undefined ? null : String(attachment.attachment_id);

    // No attachment? The document may be a link in the body instead.
    const link =
      attachmentId !== null
        ? null
        : ((readString(message, "text") ?? "").match(
            /https?:\/\/[^\s<>()"'\]]+/,
          )?.[0] ?? null);

    const subject = readString(message, "subject") ?? "(no subject)";
    const filename =
      attachment === undefined || typeof attachment.filename !== "string"
        ? null
        : attachment.filename;

    // AgentMail's inbox_id is the address itself ("still-true@agentmail.to"),
    // so which header carries it tells forward from cc with no extra config.
    const isOurs = (address: string) => address.includes(inboxId);
    const mode =
      !readStrings(message, "to").some(isOurs) &&
      readStrings(message, "cc").some(isOurs)
        ? "cc"
        : "forward";

    await ctx.runMutation(internal.mail.receive, {
      messageId,
      threadId,
      inboxId,
      fromEmail: readStrings(message, "from_")[0] ?? "",
      mode,
      title: filename ?? subject,
      attachmentId,
      url: link,
    });

    return new Response(null, { status: 200 });
  }),
});

export default http;
