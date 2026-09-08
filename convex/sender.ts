// Who sent this, as one string that means one mailbox.
//
// H4. `threads.fromEmail` used to be the raw `From` header, and the round trip
// on 2026-09-08 put `"Randall LaPoint, Jr." <rplapointjr@gmail.com>` in the
// table — a display name, a comma, quotes, and an address. Three things key on
// that string: the burst limiter, the 25-document standing cap, and `stopFor`'s
// promise that a STOP covers "every other thread from your address".
//
// So the identity of a sender was a string the sender formats. Editing a
// display name minted fresh quota, which defeats H2 by changing a preference;
// and the same person mailing from a phone and a laptop was two people, so a
// STOP silently covered some of their threads and not others. The dev table
// already held the proof before anyone went looking: `Randall
// <randall@example.com>` and a bare `randall@example.com`, two rows, one
// mailbox.
//
// The unsubscribe half is the one that made this urgent. The cost half needs an
// attacker; the STOP half fails on its own, for someone who did nothing but
// own two mail clients — and the sentence it breaks has already been delivered.

import emailAddresses from "email-addresses";

// A REAL parser, and not because a regex is inelegant.
//
// The obvious rule is "take what is inside the last angle brackets", which
// survives the quoted comma our own row carries. It loses to a comment:
//
//   Name <a@x.com> (note <b@evil.com>)
//
// is a valid header from a@x.com, and the last-brackets rule reads it as
// b@evil.com. A header is a grammar, not a shape, and the thing keying an
// unsubscribe should not be decided by which bracket came last.
//
// `email-addresses` implements the RFC 5322 grammar, has no dependencies, and
// is one file of plain JavaScript, so it costs the V8 bundle almost nothing.

// Lowercased, whole. The domain is case-insensitive by RFC 1035 and that half
// is uncontroversial. The LOCAL part is case-sensitive by RFC 5321 §2.4 and is
// lowercased here anyway, deliberately: no mainstream provider distinguishes
// `Randall@` from `randall@`, and treating them as two senders is the exact
// defect this file exists to close. A provider that genuinely cared would be
// merging two of its own users' quotas, not two strangers'.
//
// What is NOT normalised, and why, is the `+tag` decision below.
const normalise = (address: string) => address.toLowerCase();

/**
 * The single mailbox a `From` header names, lowercased — or `null` when the
 * header does not name exactly one.
 *
 * `null` means "cannot identify this sender", not "no sender". The caller
 * decides what to do with that; see `mail.received`, which keeps the raw header
 * so real mail is never dropped on a parser edge case, and `scripts/gate.mjs`,
 * which goes red when a stored row is not a bare address.
 */
export function senderAddress(header: string): string | null {
  // `parseAddressList` rather than `parseOneAddress` so the multi-mailbox case
  // is visible here instead of collapsing into the same `null` as garbage.
  const parsed = emailAddresses.parseAddressList(header);
  if (parsed === null || parsed.length !== 1) {
    // Exactly one, and a header naming two mailboxes is refused rather than
    // resolved to the first. `From: victim@x, attacker@y` is a header an
    // attacker can write, and taking the first would charge the victim's quota
    // and — far worse — let the attacker's STOP silence the victim's threads.
    // A real mail client sends one; anything else is anomalous and says so.
    return null;
  }

  // A GROUP parses successfully and carries no address: `undisclosed-recipients:;`
  // comes back as one node whose `address` is `undefined`. Checking the type
  // rather than truthiness, because this is the boundary where a wrong answer
  // becomes somebody's identity.
  const address: unknown = (parsed[0] as { address?: unknown }).address;
  if (typeof address !== "string" || !address.includes("@")) return null;

  return normalise(address);
}

// ── The `user+tag@` decision, made deliberately and recorded here ────────────
//
// `user+lease@gmail.com` and `user@gmail.com` reach one Gmail mailbox. They are
// NOT merged here, and that is a choice rather than an oversight.
//
// The reason is that this one key gates two things whose failure modes point in
// opposite directions. For the SPEND gates, merging is strictly better: the
// person being merged with is the same person, and refusing to merge leaves a
// free-quota move for anyone who reads this file. For the STOP gate, merging is
// a risk taken with a stranger's mail — RFC 5321 §2.3.11 makes the local part
// opaque to everyone except the destination host, and we are not it. Plenty of
// hosts treat `+` as an ordinary character, so stripping it can silence someone
// who never wrote here.
//
// `convex/schema.ts` already settled which way that asymmetry resolves, for the
// same flag: "the safe direction here is the one that keeps answering, since
// the flag suppresses mail rather than authorising it." Stripping tags
// suppresses more. So: no stripping.
//
// What that costs, stated rather than waved at: someone who has read this far
// can mint 25 documents per plus-address at ten messages an hour. That is slow,
// it is bounded per identity, and `npm run gate` reads every document row on
// production with credentials, so a farm is visible to whoever runs it.
//
// ponytail: no strip list. The upgrade, if a farm ever appears, is to strip
// tags for the handful of providers that DOCUMENT the behaviour — a fact
// lookup per domain, not a heuristic about what an address looks like. Three
// predeclared heuristics died on 2026-09-07 (docs/READINESS.md, H3); this is
// not the place to add a fourth.
