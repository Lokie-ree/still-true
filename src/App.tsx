import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { questionFor, type DocumentKind } from "../convex/questions";

// The public board — a shop window, not the product. The product is the reply
// that lands in somebody's inbox; this exists so the line number in that reply
// is checkable by a stranger who was never sent one.
//
// That difference is why this page is ordered the other way round from the
// email. A person who forwarded a lease wants the answers first. A person who
// arrived here has not asked anything yet, and the reason to keep reading is
// the half nobody else ships: the questions these documents never answer.

// The address is the interface. This page went live for a day without it
// anywhere on the screen — a landing page for an email product that never said
// where to send the mail.
const INBOX = "still-true@agentmail.to";

type Finding = Doc<"findings">;
type Answered = Extract<Finding, { verdict: "answered" }>;

// Two answers on one line print one receipt.
//
// Splitting the compound questions was right for the engine contract and it
// left pairs like "can they change the terms?" and "what notice do you get?"
// both citing line 30 of the same handbook — which rendered that sentence twice,
// back to back, and read as a bug. The email fixed this in P3; the board did not
// get the fix until 2026-09-05.
type Cited = {
  questions: string[];
  answers: string[];
  quote: string;
  lineNo: number;
  previousQuote?: string;
  previousLineNo?: number;
  changedAt: number | null;
};

function groupByLine(answered: Answered[], kind: DocumentKind): Cited[] {
  const byLine = new Map<number, Cited>();
  for (const f of answered) {
    const ask = questionFor(kind, f.questionKey);
    const seen = byLine.get(f.lineNo);
    if (seen === undefined) {
      byLine.set(f.lineNo, {
        questions: [ask],
        answers: [f.answer],
        quote: f.quote,
        lineNo: f.lineNo,
        previousQuote: f.previousQuote,
        previousLineNo: f.previousLineNo,
        changedAt: f.changedAt,
      });
      continue;
    }
    if (!seen.questions.includes(ask)) seen.questions.push(ask);
    if (!seen.answers.includes(f.answer)) seen.answers.push(f.answer);
    // A change stamp anywhere in the group belongs to the group: the receipt
    // they share is the thing that moved.
    if (seen.changedAt === null && f.changedAt !== null) {
      seen.changedAt = f.changedAt;
      seen.previousQuote = f.previousQuote;
      seen.previousLineNo = f.previousLineNo;
    }
  }
  return [...byLine.values()];
}

const label = "text-[11px] font-semibold uppercase tracking-[0.09em]";
const rule = "border-slate-200 dark:border-slate-700";

function Findings({
  documentId,
  kind,
}: {
  documentId: Id<"documents">;
  kind: DocumentKind;
}) {
  const findings = useQuery(api.documents.findingsFor, { documentId });
  if (findings === undefined || findings.length === 0) return null;

  const cited = groupByLine(
    findings.filter((f): f is Answered => f.verdict === "answered"),
    kind,
  );
  const missing = findings.filter((f) => f.verdict === "not_stated");

  return (
    <div className={`mt-4 space-y-5 border-t pt-4 ${rule}`}>
      {/* First, deliberately. See the note at the top of this file. */}
      {missing.length > 0 && (
        <div>
          <p className={`${label} mb-2 text-amber-700 dark:text-amber-500`}>
            What it never says
          </p>
          <div className="space-y-2">
            {missing.map((f) => (
              <div key={f._id}>
                <p className="text-sm font-medium">
                  {questionFor(kind, f.questionKey)}
                </p>
                {/* Word for word what the reply sends. A refusal is a search
                    result, not a verdict, and it claims only what was done. */}
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  Searched all {f.linesSearched.toLocaleString()} lines. This
                  document does not state it.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cited.length > 0 && (
        <div>
          <p className={`${label} mb-2 text-emerald-700 dark:text-emerald-500`}>
            What it requires of you
          </p>
          <div className="space-y-4">
            {cited.map((c) => (
              <div key={c.lineNo}>
                {c.questions.map((q) => (
                  <p
                    key={q}
                    className="text-xs text-slate-500 dark:text-slate-400"
                  >
                    {q}
                  </p>
                ))}
                {c.answers.map((a) => (
                  <p key={a} className="text-sm font-medium">
                    {a}
                  </p>
                ))}
                <blockquote
                  className={`mt-1 border-l-2 pl-3 text-sm italic text-slate-600 dark:text-slate-300 ${rule}`}
                >
                  {c.quote}
                </blockquote>
                <p className="mt-1 pl-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  line {c.lineNo}
                </p>

                {/* What it used to say. Stamped only when the document's stored
                    hash moved AND the old clause is gone from the text — never
                    from two model runs disagreeing. Struck through rather than
                    described, for the same reason the new one is quoted: a
                    change notice without both receipts is only an assertion
                    that something happened. */}
                {c.changedAt !== null && c.previousQuote !== undefined && (
                  <div className="mt-2">
                    <p
                      className={`${label} mb-1 text-amber-700 dark:text-amber-500`}
                    >
                      Changed {new Date(c.changedAt).toLocaleDateString()}
                    </p>
                    <blockquote className="border-l-2 border-amber-300 pl-3 text-sm italic text-slate-400 dark:border-amber-700 dark:text-slate-500">
                      <s>{c.previousQuote}</s>
                    </blockquote>
                    <p className="mt-1 pl-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      was line {c.previousLineNo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const documents = useQuery(api.documents.recent);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">still-true</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Forward a lease, a terms-of-service update, an insurance renewal. It
        replies with what that document requires of you — every claim quoted
        from your own text with the line it came from — and says plainly where
        the document is silent. Then it re-reads the page daily and tells you
        when a clause changes.
      </p>

      {/* The interface, stated. */}
      <div className={`mt-5 rounded border px-4 py-3 ${rule}`}>
        <p className={`${label} text-slate-500 dark:text-slate-400`}>
          Forward a document to
        </p>
        <p className="mt-1 font-mono text-base font-semibold">
          <a href={`mailto:${INBOX}`} className="underline">
            {INBOX}
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          A PDF attachment or a link in the body. The reply lands in about
          fifteen seconds. Nothing you forward appears on this page.
        </p>
      </div>

      {documents === undefined && (
        <p className="mt-8 text-slate-500">Loading…</p>
      )}
      {documents?.length === 0 && (
        <p className="mt-8 text-slate-500">No documents yet.</p>
      )}

      {documents !== undefined && documents.length > 0 && (
        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          {documents.length} public documents ·{" "}
          {documents
            .reduce((n, d) => n + d.lineCount, 0)
            .toLocaleString()}{" "}
          lines read · every answer below carries the sentence it came from
        </p>
      )}

      <ul className="mt-3 space-y-4">
        {documents?.map((d) => (
          <li key={d._id} className={`rounded border p-5 ${rule}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">{d.title}</h2>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {d.kind}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {d.url ? (
                <a href={d.url} className="underline break-all">
                  {d.url}
                </a>
              ) : (
                "emailed attachment"
              )}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
              {d.lineCount.toLocaleString()} lines · read{" "}
              {new Date(d.fetchedAt).toLocaleDateString()}
              {/* The watch's normal day, said out loud. "Checked and unchanged"
                  is what happens on almost every document on almost every run,
                  and a system that only speaks when something moves is
                  indistinguishable from one that stopped running. */}
              {d.lastCheckedAt !== null && (
                <>
                  {" · re-checked "}
                  {new Date(d.lastCheckedAt).toLocaleDateString()}
                </>
              )}
            </p>
            <Findings documentId={d._id} kind={d.kind} />
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-slate-500 dark:text-slate-400">
        Every quote is a numbered line of the document above it, pulled out by
        index — the model returns a line number and never writes the sentence,
        so a quote that is not in the document cannot be shown. This quotes and
        counts. It does not interpret or advise, and it is not legal advice.
      </p>
    </main>
  );
}
