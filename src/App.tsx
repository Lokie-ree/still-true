import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const answers = useQuery(api.answers.board);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">still-true</h1>
      <p className="mb-6 text-sm text-slate-500">
        Public answers that tell you when they stopped being true.
      </p>

      {answers === undefined && <p>Loading…</p>}
      {answers?.length === 0 && (
        <p className="text-slate-500">No answers yet.</p>
      )}

      <ul className="space-y-4">
        {answers?.map((a) => (
          <li key={a._id} className="rounded border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{a.question}</h2>
              <span
                className={
                  a.status === "fresh" ? "text-green-600" : "text-amber-600"
                }
              >
                {a.status}
              </span>
            </div>
            <p className="mt-1">{a.answer}</p>
            <p className="mt-2 text-xs text-slate-500">
              <a href={a.source?.url} className="underline">
                {a.source?.url}
              </a>{" "}
              · verified {new Date(a.verifiedAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
