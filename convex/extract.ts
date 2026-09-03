// The extractor — the instrument probe v3 concluded was the only one left
// ("no further sweep has information value").
//
// Two calls to the model, and the model is trusted with a sentence in neither.
// `classify` picks which predeclared checklist to fire. `extract` answers that
// checklist and returns ONE LINE NUMBER per question. Every quote this product
// publishes is then read out of the lines array by index, here, on the server,
// after the model has finished talking.
//
// That is the whole grounding claim, and it is a structural one rather than a
// confidence one. The model can be wrong about WHICH line answers a question.
// It cannot be wrong about what that line says, because it never writes it.

import { requireEnv } from "./env.ts";
import type { DocumentKind, Question } from "./questions.ts";

// What extraction produces. `documentId` and the timestamps belong to the
// database, so they are not here; convex/schema.ts extends these two shapes
// with them, which is what keeps the extractor's output and the stored row
// from drifting apart.
export type ExtractedFinding =
  | {
      questionKey: string;
      verdict: "answered";
      answer: string;
      quote: string;
      lineNo: number;
      contextBefore: string;
      contextAfter: string;
      linesSearched: number;
    }
  | { questionKey: string; verdict: "not_stated"; linesSearched: number };

// Line numbers are 1-based everywhere they are visible: in the prompt, in
// `lineNo`, in the reply, and in the demo when the number is read out loud.
// This is the only place that converts to the array's 0-based index, and P4's
// re-check must read the stored quote back through this same function or its
// change detection will fire on whitespace.
export function lineAt(lines: string[], lineNo: number): string {
  return lineNo >= 1 && lineNo <= lines.length ? lines[lineNo - 1].trim() : "";
}

// The adjacent line is usually blank — markdown from a PDF is mostly blank
// lines — and a receipt showing two empty strings around the quote proves
// nothing to the person checking it. Walk to the nearest line with text.
function neighbour(lines: string[], from: number, step: -1 | 1): string {
  for (let i = from + step; i >= 1 && i <= lines.length; i += step) {
    const line = lineAt(lines, i);
    if (line !== "") return line;
  }
  return "";
}

const numbered = (lines: string[]) =>
  lines.map((line, i) => `${i + 1}\t${line}`).join("\n");

// Silently truncating a document and then citing into it would be the worst
// bug this product could have: a confident quote from a document we did not
// finish reading. Refuse by name instead. This is a guard against silence, not
// an estimate of the model's context window — an oversized prompt failing at
// the API is also fine, because that failure is loud.
const MAX_PROMPT_CHARS = 600_000;

// One line, and the answer may not out-run it.
//
// The first version of this prompt asked for support_lines as a list, "most
// direct first". On PayPal it answered T1 across several lines — correctly —
// and the receipt published was the first of them, which stated that
// arbitration is binding and said nothing about the 30-day opt-out the answer
// asserted. A true quote under an answer it does not support is the failure
// this product cannot have, so the contract is now exactly one line, and the
// answer is bounded by what that line says.
const SYSTEM = [
  "You are given a document as tab-separated numbered lines, and a list of questions.",
  "Answer every question ONLY from this document.",
  "",
  "Cite exactly ONE line. That line must state the answer BY ITSELF: a reader shown",
  "only that line must be able to see that your answer is true. Your answer may not",
  "assert any fact, number, deadline, or condition that is not in the line you cite.",
  "",
  'Stated on one line: verdict "answered", one plain sentence, support_line set to it.',
  'Otherwise: verdict "not_stated", answer "", support_line 0 — including when the',
  "document does say it but spreads it across lines you would have to combine.",
  "Answering across lines is the one failure that matters here. The cited line is",
  "published as the receipt, and an answer its own receipt does not support is worse",
  "than a refusal.",
  "",
  "Do not guess. Do not infer from general knowledge or from what documents of this",
  "type usually say. A line number you are unsure of is worse than not_stated, because",
  "a wrong citation is published as a quote.",
  "Never copy document text into `answer`. The quote is taken from the line you cite,",
  "not from anything you write.",
].join("\n");

async function respond(
  name: string,
  schema: Record<string, unknown>,
  user: string,
): Promise<unknown> {
  if (user.length > MAX_PROMPT_CHARS) {
    throw new Error(
      `Document is ${user.length} chars, over the ${MAX_PROMPT_CHARS} limit — refusing to cite into a document that would be truncated`,
    );
  }
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: requireEnv("OPENAI_MODEL"),
      input: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return JSON.parse(outputText(await res.json()));
}

// The Responses API returns a list of output items, not a single message. The
// `output_text` convenience field is assembled by the SDKs, so it may or may
// not be on the wire; take it when it is there and walk the items when it is
// not.
function outputText(body: unknown): string {
  const b = (body ?? {}) as Record<string, unknown>;
  // An `incomplete` response still parses as JSON up to where it stopped.
  // Catching it here means a truncated answer never reaches the verifier.
  if (b.status === "incomplete") {
    throw new Error(
      `OpenAI stopped early: ${JSON.stringify(b.incomplete_details)}`,
    );
  }
  if (typeof b.output_text === "string" && b.output_text !== "") {
    return b.output_text;
  }
  for (const item of Array.isArray(b.output) ? b.output : []) {
    const content = (item as Record<string, unknown>)?.content;
    for (const part of Array.isArray(content) ? content : []) {
      const p = part as Record<string, unknown>;
      if (p.type === "output_text" && typeof p.text === "string") return p.text;
      if (p.type === "refusal") {
        throw new Error(`OpenAI refused: ${String(p.refusal)}`);
      }
    }
  }
  throw new Error("OpenAI response carried no output text");
}

// Classification only chooses a checklist. It reads the head of the document
// because the first 150 lines and the filename separate a lease from a terms
// page, and the extraction call on a 3,500-line document costs many times more.
export async function classify(
  title: string,
  lines: string[],
): Promise<DocumentKind> {
  const parsed = await respond(
    "classification",
    {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["lease", "tos", "notice", "other"] },
      },
      required: ["kind"],
      additionalProperties: false,
    },
    [
      `Title: ${title}`,
      "",
      "Classify this document.",
      '"lease" — a residential or commercial rental agreement.',
      '"tos" — terms of service, a consumer or subscriber agreement, an EULA.',
      '"notice" — a one-off notice or letter: HOA, insurance renewal, rate change.',
      '"other" — anything else, including handbooks and policy manuals.',
      "",
      numbered(lines.slice(0, 150)),
    ].join("\n"),
  );
  const kind = (parsed as { kind?: unknown })?.kind;
  // The strict enum should make this unreachable; "other" is a real corpus with
  // a real checklist, so falling back to it costs nothing.
  return kind === "lease" || kind === "tos" || kind === "notice" ? kind : "other";
}

export async function extract(
  lines: string[],
  questions: Question[],
): Promise<ExtractedFinding[]> {
  const parsed = await respond(
    "findings",
    {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question_key: {
                type: "string",
                enum: questions.map((q) => q.key),
              },
              verdict: { type: "string", enum: ["answered", "not_stated"] },
              answer: { type: "string" },
              // One integer, never a list. A list meant the model could answer
              // across lines while only the first was published as the quote,
              // and "keep [0], discard the rest" made that loss silent. The
              // schema now cannot express the answer that broke. 0 is the
              // refusal value: it is out of range, so verify() already rejects
              // it by the rule it applies to every other bad index.
              support_line: { type: "integer" },
            },
            required: ["question_key", "verdict", "answer", "support_line"],
            additionalProperties: false,
          },
        },
      },
      required: ["findings"],
      additionalProperties: false,
    },
    [
      "Questions:",
      ...questions.map((q) => `${q.key}: ${q.ask}`),
      "",
      `Document (${lines.length} numbered lines):`,
      numbered(lines),
    ].join("\n"),
  );
  return verify(parsed, questions, lines);
}

// The deterministic gate between extraction and publication, and the reason
// `answered` and `not_stated` are separate arms in the schema rather than one
// row with nullable columns.
//
// A claim survives only if the index is an integer, in range, and lands on a
// line that has text on it. Anything else becomes not_stated — which is a real
// answer here, not an error path. Exported because this, and not the API call,
// is the logic that has to be right; convex/extract.test.ts drives it directly.
export function verify(
  parsed: unknown,
  questions: Question[],
  lines: string[],
): ExtractedFinding[] {
  const linesSearched = lines.length;
  const raw = (parsed as { findings?: unknown })?.findings;
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of Array.isArray(raw) ? raw : []) {
    const claim = (item ?? {}) as Record<string, unknown>;
    if (typeof claim.question_key === "string") {
      byKey.set(claim.question_key, claim);
    }
  }

  // Driven by the predeclared question list, never by what came back. A
  // question the model skipped is a refusal, because "searched 3,505 lines and
  // it is not there" is the claim; silence is not a third verdict.
  return questions.map((question): ExtractedFinding => {
    const refused = {
      questionKey: question.key,
      verdict: "not_stated",
      linesSearched,
    } as const;

    const claim = byKey.get(question.key);
    if (claim === undefined || claim.verdict !== "answered") return refused;

    const answer = claim.answer;
    if (typeof answer !== "string" || answer.trim() === "") return refused;

    const lineNo = claim.support_line;
    if (typeof lineNo !== "number" || !Number.isInteger(lineNo)) return refused;

    const quote = lineAt(lines, lineNo);
    if (quote === "") return refused;

    return {
      questionKey: question.key,
      verdict: "answered",
      answer: answer.trim(),
      // Read out of the document, never out of the model's output.
      quote,
      lineNo,
      contextBefore: neighbour(lines, lineNo, -1),
      contextAfter: neighbour(lines, lineNo, 1),
      linesSearched,
    };
  });
}
