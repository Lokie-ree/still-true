import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

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
          </li>
        ))}
      </ul>
    </main>
  );
}
