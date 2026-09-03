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

export function toLines(markdown: string): string[] {
  return reflow(markdown).filter((line) => !isTocEntry(line));
}
