// The numbered lines a citation points at.
//
// Everything downstream — the quote, `lineNo`, `linesSearched`, the re-check
// that compares `lines[n]` against the stored quote — is an index into the
// array this returns. So this function IS the grounding guarantee: the model
// returns an integer and the sentence is whatever this said line n was.

// A PDF hard-wraps at the visual column, so a raw `markdown.split("\n")[n]`
// hands back half a clause. Joining a line that ends mid-sentence to one that
// starts mid-sentence repairs it: measured against four real PDFs, 1,688
// broken clauses to 0. Markdown structure (`|#>*-`) is never joined, because
// a table row or a heading is not a continuation.
function reflow(markdown: string): string[] {
  return markdown.split("\n").reduce<string[]>((acc, line) => {
    const prev = acc[acc.length - 1];
    if (
      prev !== undefined &&
      /[a-z,;:)]$/.test(prev.trim()) &&
      /^[a-z("']/.test(line.trim()) &&
      !/^[|#>*-]/.test(line.trim())
    ) {
      acc[acc.length - 1] = prev.trimEnd() + " " + line.trim();
    } else {
      acc.push(line);
    }
    return acc;
  }, []);
}

// Table-of-contents dot leaders — "Termination .......... 14" — are the one
// class of line that is guaranteed to match a question's keywords and answer
// nothing. Dropping them here means they can never be cited.
const isTocEntry = (line: string) => /\.{6,}\s*\d+$/.test(line.trim());

// Firecrawl's PDF parser renders the PAGE's typesetting as markup: `5<sup>th</sup>`
// for a superscript, `<u>$25.00</u>` for an underline, `**` for bold. Those are
// how the document looks, not what it says, and leaving them in costs twice.
//
// A receipt reading `the 5<sup>th</sup> day` shows the reader our pipeline
// instead of their lease. And — the reason this lives here rather than at
// render time — the extractor is asked to copy a clause verbatim so it can be
// found inside the line it cites. A model copying `5<sup>th</sup>` silently
// writes `5th`, the search fails, and the whole 585-character paragraph is
// published instead. Measured on the real Livonia lease: every finding shortened
// except the two on the one line carrying markup.
//
// So it is stripped once, before numbering, and one substrate then serves the
// prompt, the citation, the stored quote, the receipt and P4's re-check. Any
// later normalisation would make those disagree.
// Whether a link's address adds anything its label has not already said.
//
// H3. This file used to drop every href, and the argument for it was AT&T:
// the cancellation receipt reads "See [att.com/howtocancel](https://www.att.com/howtocancel)
// for details on how to cancel", where `att.com/howtocancel` IS the answer and
// the href beside it is the same string twice. That argument is sound and it
// only covers the case where the label is the address.
//
// Pandora is the case it does not cover. Line 144 reads "...by following the
// instructions outlined in this [Listener Support Help Article](https://help.pandora.com/s/article/Cancel-…)".
// The label names a document; the address is the only thing that says WHICH
// document. Dropping it cost a real answer — "How do you cancel?" came back
// `not_stated` on a page that answers it, and a false refusal is the one thing
// this system is built not to produce.
//
// So: keep the address UNLESS the label already contains it. One rule, no
// keyword list. Three shell-page detectors were predeclared and measured on 24
// documents on 2026-09-07 and all three false-positived on real HUD and DOL
// notices (docs/READINESS.md, H3) — a list of labels that "sound uninformative"
// would be the same mistake a fourth time. This is instead the AT&T argument
// generalised, and it is checkable by reading one line rather than by trusting
// a threshold.
//
// A heuristic is acceptable HERE and was not there, and the difference is the
// failure mode, not the confidence. Guess wrong on a shell page and a real
// lease is refused unread. Guess wrong here and a line either carries an
// address it did not need or drops one it did — the status quo, on one line.
const saysTheSameThing = (label: string, href: string) => {
  const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return alnum(label).length > 0 && alnum(href).includes(alnum(label));
};

// Bumped whenever `toLines` can return different text for an unchanged
// document. That is not a version number for the file; it is the thing that
// stops a parser change from mailing every subscriber that their lease was
// rewritten.
//
// The hazard has now arrived three times: the 09-04 markup strip moved Livonia
// 421 lines to 418 with no word of it changing, this change moves 616 lines
// across the ten documents on production, and something will move them again.
// `mail.attach` re-baselines instead of diffing when a document's stored
// version is not this one — see the note on `documents.parserVersion`.
//
// 1 → 2: hrefs kept when the label does not already contain them (H3).
export const PARSER_VERSION = 2;

// HTML entities, decoded AFTER the tag strip above so a document that really
// says `&lt;` keeps its `<` instead of having it eaten as a tag. `&amp;` goes
// last for the same reason, or `&amp;lt;` would decode twice.
const decodeEntities = (line: string) =>
  line
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const stripMarkup = (line: string) =>
  decodeEntities(
    line
      // Bare urls FIRST now, which is the reverse of the order this file used
      // to argue for, and the lookbehind is what makes it safe: a url sitting
      // immediately after "](" is a link's href and belongs to the pass below.
      // Everything else is an anchor whose words live elsewhere in the
      // sentence. Every quote from a Summary of Benefits and Coverage carried
      // two of them mid-clause ("...but only if https://…/#plan
      // https://…/#specialist you have a referral"), because the glossary
      // hyperlinks on `plan` and `specialist` surface as bare hrefs while those
      // words stay in the prose. Dropping those still loses nothing.
      //
      // Running this pass second, as before, would delete the very addresses
      // the pass below has just decided to keep.
      .replace(/(?<!\]\()https?:\/\/\S+/g, "")
      .replace(
        /(!?)\[([^\]]*)\]\(([^)]*)\)/g,
        (_m, bang: string, label: string, href: string) => {
          // An image's alt text describes a picture and its address IS a
          // picture. Neither is made more useful by the other.
          if (bang === "!" || !/^https?:\/\//.test(href)) return label;
          if (label.trim() === "") return href;
          return saysTheSameThing(label, href) ? label : `${label} (${href})`;
        },
      )
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/_{3,}/g, "___")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

// A markdown table row is delimited by pipes it does not mean. The outer two
// are pure delimiter and a receipt opening `| This plan will pay` shows the
// reader our parser; the inner ones are real cell boundaries and stay, because
// welding "Specialist visit" onto "$50 copay/visit" would invent a sentence.
//
// This runs AFTER reflow, deliberately. Reflow refuses to join a line starting
// with `|` — that guard is what keeps table rows from being welded to the
// prose above them — so stripping the pipe any earlier would disable it.
const trimTablePipes = (line: string) => line.replace(/^\|\s*|\s*\|$/g, "");

export function toLines(markdown: string): string[] {
  // Strip before reflow: a line ending `</u>` fails reflow's "ends mid-clause"
  // test, so the markup was also blocking the join it exists to make.
  return reflow(markdown.split("\n").map(stripMarkup).join("\n"))
    .filter((line) => !isTocEntry(line))
    .map(trimTablePipes);
}

// The document's identity, for the watch.
//
// Firecrawl's own `changeTracking.changeStatus` was the first answer here and
// it is the wrong one, for a reason only a live run exposed: the signal is
// CONSUMABLE. It compares a scrape against the previous scrape of the same URL
// by the same team, so the moment we fetch, the baseline moves to what we just
// fetched. On 2026-09-05 a sweep scraped this project's watch fixture after two
// clauses were edited, failed somewhere after the fetch, and the next read came
// back `same` — comparing the new text against the new text. The change was
// gone permanently, and the retry that was supposed to make the watch reliable
// is what destroyed the evidence.
//
// A hash of the lines has none of that. It lives on our row, a retry recomputes
// the same value, and it cannot be spent by reading it.
export async function fingerprint(lines: readonly string[]): Promise<string> {
  const bytes = new TextEncoder().encode(lines.join("\n"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
