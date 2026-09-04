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
// Links get two passes, and the ORDER is the whole safety argument.
//
// A markdown link keeps its text and loses its href: AT&T's cancellation
// receipt reads "See [att.com/howtocancel](https://www.att.com/howtocancel) for
// details on how to cancel", where `att.com/howtocancel` is the answer and the
// href beside it is the same string twice.
//
// A BARE url is then, by construction, one that had no readable text to keep —
// an anchor whose words live somewhere else in the sentence. Every quote from a
// Summary of Benefits and Coverage carried two of them mid-clause
// ("...but only if https://…/#plan https://…/#specialist you have a referral"),
// because the glossary hyperlinks on `plan` and `specialist` surface as bare
// hrefs while those words stay in the prose. Dropping them loses nothing that
// was not already said.
//
// Running the link pass first is what makes the bare-url pass safe: anything
// carrying human-readable text has already been reduced to that text, so what
// remains is only ever an address with nothing to say.
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
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
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
