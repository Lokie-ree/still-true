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
const stripMarkup = (line: string) =>
  line
    .replace(/<[^>]+>/g, "")
    .replace(/_{3,}/g, "___")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function toLines(markdown: string): string[] {
  // Strip before reflow: a line ending `</u>` fails reflow's "ends mid-clause"
  // test, so the markup was also blocking the join it exists to make.
  return reflow(markdown.split("\n").map(stripMarkup).join("\n")).filter(
    (line) => !isTocEntry(line),
  );
}
