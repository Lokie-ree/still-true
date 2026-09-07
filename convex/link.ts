// The document a mail carries as a link, and the wrapper the mail client puts
// in front of it.
//
// Production's first inbound mail failed here, four seconds after the webhook
// went live. Gmail rewrites every link in a sent body to
// `https://www.google.com/url?q=<the real one>`, so what arrived in the text
// part was the wrapper; Firecrawl scraped Google's redirect page and returned
// 498 characters, and the short-document guard correctly refused it. The
// document was never the problem — the address was.
//
// The unwrap is `searchParams`, and it fires only on hosts known to wrap.
// A page may legitimately carry `?url=`, and a `google.com/search?q=` link is
// not a wrapped document either, so the inner value has to look like an
// address before it is trusted.
const WRAPPERS: Record<string, string> = {
  "www.google.com": "q",
  "google.com": "q",
  // Outlook does the same thing under a different parameter. Not observed here
  // yet; it is one map entry, and the failure mode it prevents is the one we
  // just paid for.
  "safelinks.protection.outlook.com": "url",
  "nam01.safelinks.protection.outlook.com": "url",
};

function unwrap(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const param = WRAPPERS[parsed.hostname];
  if (param === undefined) return url;
  const inner = parsed.searchParams.get(param);
  return inner !== null && /^https?:\/\//.test(inner) ? inner : url;
}

// First link in the body wins, as before. Signatures live below the message and
// a person forwarding a document puts it above their own footer.
export function documentUrl(text: string): string | null {
  const found = text.match(/https?:\/\/[^\s<>()"'\]]+/)?.[0] ?? null;
  return found === null ? null : unwrap(found);
}

// A reader asking to be left alone.
//
// M4. Enrolment in the watch is automatic and by design — a person forwarding a
// lease is asking what it requires of them, and that it stopped requiring it is
// the same question answered later. Removal did not exist, which was defensible
// only while there was nothing a reader could do about it. `reply.ts`'s WATCH
// paragraph now names this word, so the sentence and the code have to agree.
//
// The FIRST non-empty line, and that line alone. A reply carries the quoted
// original beneath it, so anything that searched the whole body would read
// "STOP" out of the document it is being asked to stop watching. And the line
// must be ONLY the keyword: a forwarded message whose prose happens to open
// "Stop by the office before Friday" is a document, not an unsubscribe.
export function isStop(text: string): boolean {
  const first = text.split("\n").find((line) => line.trim() !== "") ?? "";
  return /^\W*(stop|unsubscribe)\W*$/i.test(first.trim());
}
