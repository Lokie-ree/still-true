import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// The minimum that makes P2's exit test performable: every citation openable by
// hand, with the line number it claims. This is NOT the receipt page — P3 owns
// that, and owns making a quote clickable in its surrounding context. Anything
// past reading a finding and checking it belongs there, not here.
function Findings({ documentId }: { documentId: Id<"documents"> }) {
  const findings = useQuery(api.documents.findingsFor, { documentId });
  if (findings === undefined || findings.length === 0) return null;

  const answered = findings.filter((f) => f.verdict === "answered");
  const missing = findings.filter((f) => f.verdict === "not_stated");

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      {answered.map((f) => (
        <div key={f._id}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {f.questionKey}
          </p>
          <p className="text-sm">{f.answer}</p>
          <blockquote className="mt-1 border-l-2 pl-3 text-sm text-slate-600">
            {f.quote}
            <span className="ml-2 text-xs text-slate-400">line {f.lineNo}</span>
          </blockquote>
        </div>
      ))}

      {missing.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            What it never says
          </p>
          <p className="text-sm text-slate-600">
            Searched {missing[0].linesSearched.toLocaleString()} lines.{" "}
            {missing.map((f) => f.questionKey).join(", ")} not stated.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const documents = useQuery(api.documents.recent);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">still-true</h1>
      <p className="mb-6 text-sm text-slate-500">
        Forward a document. Get back what it requires of you — quoted, dated,
        and honest about what it never says.
      </p>

      {documents === undefined && <p>Loading…</p>}
      {documents?.length === 0 && (
        <p className="text-slate-500">No documents yet.</p>
      )}

      <ul className="space-y-4">
        {documents?.map((d) => (
          <li key={d._id} className="rounded border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{d.title}</h2>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {d.kind}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {d.url ? (
                <a href={d.url} className="underline">
                  {d.url}
                </a>
              ) : (
                "emailed attachment"
              )}{" "}
              · {d.lineCount.toLocaleString()} lines · read{" "}
              {new Date(d.fetchedAt).toLocaleDateString()}
            </p>
            <Findings documentId={d._id} />
          </li>
        ))}
      </ul>
    </main>
  );
}
