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
