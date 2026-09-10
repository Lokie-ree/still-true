import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";
import { questionFor, type DocumentKind } from "../convex/questions";
import { receiptKey, refusalLine } from "../convex/reply";

// The public board — a shop window, not the product. The product is the reply
// that lands in somebody's inbox; this exists so the line number in that reply
// is checkable by a stranger who was never sent one.
//
// That difference is why a card is ordered the other way round from the email.
// A person who forwarded a lease wants the answers first. A person who arrived
// here has not asked anything yet, and the reason to keep reading is the half
// nobody else ships: the questions these documents never answer.
//
// **That ordering was true inside a card and false at the page level for four
// days.** `documents.recent` orders by `_creationTime`, so which document leads
// is an accident of when it was seeded — and the accident put the Las Vegas
// handbook, which refuses nothing, on the first screen. A visitor's first
// impression was answers-with-quotes, which is what every rival on the same
// stack also shows. The differentiator was in the fourth card, below the fold.
// `DocumentCard` now hoists any document that refuses something (see there).
//
// **This file is a SECOND RENDERER of the same findings, and that is the thing
// to remember about it.** H5 and M7 were both found, fixed and closed in
// `reply.ts` on 2026-09-09 while this file went on shipping both defects to the
// open internet: it printed "This document does not state it" after the email
// stopped, and it merged two findings on the LINE after the email started
// merging on the receipt. Nothing tests this file. So the wording and the merge
// key are now IMPORTED from `reply.ts` rather than restated here — a fix to
// either reaches both renderers, and `reply.test.ts`'s class guard covers this
// page through them.

// The address is the interface. This page went live for a day without it
// anywhere on the screen — a landing page for an email product that never said
// where to send the mail.
const INBOX = "still-true@agentmail.to";

// What `documents.recent` actually returns: the row minus the field that
// carries our stack's error text. See the note in convex/documents.ts.
type PublicDocument = Omit<Doc<"documents">, "watchError">;
type Finding = Doc<"findings">;
type Answered = Extract<Finding, { verdict: "answered" }>;

// Two answers sharing one receipt print that receipt once.
type Cited = {
  questions: string[];
  answers: string[];
  quote: string;
  lineNo: number;
  previousQuote?: string;
  previousLineNo?: number;
  changedAt: number | null;
};

function groupByReceipt(answered: Answered[], kind: DocumentKind): Cited[] {
  // M7, on the board. This keyed on `f.lineNo` alone until 2026-09-09, which
  // was safe only while a quote WAS its whole line. `excerpt` ended that on
  // 09-04: two findings can cite one line and slice different sentences out of
  // it, and merging them published the second answer under the first answer's
  // receipt. `receiptKey` is reply.ts's, so the two renderers cannot disagree
  // about what a receipt is.
  const byReceipt = new Map<string, Cited>();
  for (const f of answered) {
    const ask = questionFor(kind, f.questionKey);
    const key = receiptKey(f);
    const seen = byReceipt.get(key);
    if (seen === undefined) {
      byReceipt.set(key, {
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
  return [...byReceipt.values()];
}

const label = "text-[11px] font-semibold uppercase tracking-[0.09em]";
const rule = "border-slate-200 dark:border-slate-700";

// UTC, and with the time, for the same reason reply.ts stamps receipts in UTC:
// a timestamp whose value depends on which machine rendered it is not evidence.
//
// The DATE alone was rendered until 2026-09-09, which made the one genuinely
// live thing on this page invisible. A sweep at 11:17 and a hand-run sweep at
// 15:00 printed the identical string, so a reader — or a judge watching a
// re-check land — could not tell the page had moved at all.
const stamp = (at: number) =>
  new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function Findings({
  findings,
  kind,
}: {
  findings: Finding[];
  kind: DocumentKind;
}) {
  if (findings.length === 0) return null;

  const cited = groupByReceipt(
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
            What no single line says
          </p>
          <div className="space-y-2">
            {missing.map((f) => (
              <div key={f._id}>
                <p className="text-sm font-medium">
                  {questionFor(kind, f.questionKey)}
                </p>
                {/* Word for word what the reply sends, because it is the same
                    function. A refusal is a search result, not a verdict, and
                    it claims only what was done. */}
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  {refusalLine(f.linesSearched)}
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
              <div key={`${c.lineNo}:${c.quote}`}>
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
                      Changed {shortDate(c.changedAt)}
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

function DocumentCard({ d }: { d: PublicDocument }) {
  const findings = useQuery(api.documents.findingsFor, { documentId: d._id });
  const refuses = (findings ?? []).some((f) => f.verdict === "not_stated");

  return (
    // A document that refuses something leads, whatever order the corpus was
    // seeded in. CSS `order` rather than sorting the list, because the parent
    // cannot know which documents refuse anything without a second query per
    // document, and the card already has the answer.
    //
    // Ordered by the data, not by a hand-picked id: seeding a seventh document
    // must not silently put grounding back on the first screen.
    <li
      style={{ order: refuses ? 0 : 1 }}
      className={`rounded border p-5 ${rule}`}
    >
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
        {d.lineCount.toLocaleString()} lines · read {shortDate(d.fetchedAt)}
        {/* The watch's normal day, said out loud. "Checked and unchanged" is
            what happens on almost every document on almost every run, and a
            system that only speaks when something moves is indistinguishable
            from one that stopped running. */}
        {d.lastCheckedAt !== null && (
          <> · re-checked {stamp(d.lastCheckedAt)}</>
        )}
      </p>
      {findings !== undefined && <Findings findings={findings} kind={d.kind} />}
    </li>
  );
}

export default function App() {
  const documents = useQuery(api.documents.recent);

  // The most recent re-check across the corpus. Derived from the rows rather
  // than restating the cron's schedule, which lives in convex/crons.ts and
  // would be a second copy free to drift from it.
  const lastSweep = (documents ?? []).reduce<number | null>(
    (latest, d) =>
      d.lastCheckedAt !== null && (latest === null || d.lastCheckedAt > latest)
        ? d.lastCheckedAt
        : latest,
    null,
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">still-true</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Forward a lease, a terms-of-service update, an insurance renewal. It
        replies with what that document requires of you — every claim quoted
        from your own text with the line it came from — and says plainly where
        no single line answers the question. Then it re-reads the page daily and
        tells you when a clause changes.
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
          {documents.reduce((n, d) => n + d.lineCount, 0).toLocaleString()}{" "}
          lines read · every answer below carries the sentence it came from
          {/* The strongest thing this page can say about itself, and it was
              rendered nowhere: the corpus is re-read on a schedule with nobody
              watching. Derived, so it is a reading rather than a promise. */}
          {lastSweep !== null && (
            <> · re-read daily, last sweep {stamp(lastSweep)}</>
          )}
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-4">
        {documents?.map((d) => (
          <DocumentCard key={d._id} d={d} />
        ))}
      </ul>

      <p className="mt-10 text-xs text-slate-500 dark:text-slate-400">
        The plain sentence above each quote is the model's summary. The quote is
        not: the model returns a line number, and the sentence is cut out of your
        document by index on the server. A quote that is not in the document
        cannot be shown. This quotes and counts. It does not interpret or advise,
        and it is not legal advice.
      </p>
    </main>
  );
}
