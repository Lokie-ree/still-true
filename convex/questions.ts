// The corpus. This file is config; it is not the engine.
//
// The standing rule for this project is: change the corpus, never the engine.
// Everything below is a list of questions and the document kind they fire
// against. Nothing here knows how extraction works, and nothing in extract.ts
// knows what a lease is. Adding a document type is an edit to this file alone.
//
// PREDECLARED, and that word is load-bearing. `lease` and `tos` were fixed on
// 2026-09-02 in docs/probe-v3.md before any document was fetched. `universal`
// was fixed on 2026-09-03, before the extractor had run even once. A question
// list written after seeing what a document happens to contain is a taxonomy
// tuned to its own result — the precise error probe v3 exists to prevent — so
// no list here is revised in response to an extraction run. Add a new list for
// a new corpus; do not edit an old one to make it score better.
//
// ── Compound questions split, 2026-09-03 ────────────────────────────────────
// The one revision, and the reason it is not the forbidden kind.
//
// The engine's contract changed that day: a finding now cites exactly ONE line,
// and the answer may not assert anything that line does not say. A question
// asking two things at once ("notice to terminate, AND does it auto-renew") is
// unanswerable under that contract unless one line happens to carry both
// halves — which made the refusal rate a function of how a document was
// formatted rather than what it said, and that is the measurement the P2 gate
// is supposed to take.
//
// So every compound question was divided into its parts. No question's subject
// changed; none was added, dropped, or reworded to be easier. The trigger was
// the engine contract, which applies to every document identically, not any
// document's score. Splitting BEFORE running the remaining gate documents is
// what keeps that claim checkable.
// ────────────────────────────────────────────────────────────────────────────

export type DocumentKind = "lease" | "tos" | "notice" | "other";

export type Question = { key: string; ask: string };

// docs/probe-v3.md, "Lease / rental agreement".
const LEASE: Question[] = [
  { key: "L1", ask: "How many days after move-out must the deposit be returned?" },
  { key: "L2", ask: "How much notice must the landlord give before entering?" },
  { key: "L3a", ask: "What is the late fee amount?" },
  { key: "L3b", ask: "On what day does a late fee start to apply?" },
  { key: "L4a", ask: "How much notice is required to terminate?" },
  { key: "L4b", ask: "Does the lease auto-renew at the end of its term?" },
  { key: "L5", ask: "Which repairs is the tenant responsible for paying for?" },
];

// docs/probe-v3.md, "Terms of service / consumer agreement".
const TOS: Question[] = [
  { key: "T1a", ask: "Is arbitration binding?" },
  { key: "T1b", ask: "Can you opt out of arbitration, and by when?" },
  { key: "T2a", ask: "Does it auto-renew?" },
  { key: "T2b", ask: "How do you cancel?" },
  { key: "T3a", ask: "Can they change the terms unilaterally?" },
  { key: "T3b", ask: "What notice do you get before a change takes effect?" },
  { key: "T4", ask: "Is your data shared with third parties?" },
  { key: "T5", ask: "What happens to your account or your content when it terminates?" },
];

// The third list, added 2026-09-03. Five facts — seven questions after the
// split — that are true of almost any document putting an obligation on the
// person receiving it: an HOA notice, an insurance renewal, an employment
// handbook, a service contract.
//
// This exists because the alternative was worse. Firing the lease checklist at
// an insurance renewal publishes "searched 2,140 lines; this document does not
// state the deposit return window" — a true sentence and a category error. The
// refusal is the half of this product nobody else ships, and it only carries
// weight when the question belonged to the document. So an unclassifiable
// document gets questions that fit any document rather than questions that fit
// none of it.
const UNIVERSAL: Question[] = [
  { key: "U1a", ask: "What does this require you to do?" },
  { key: "U1b", ask: "By when must you do it?" },
  { key: "U2", ask: "What does it cost you — fees, charges, deposits, or penalties?" },
  { key: "U3a", ask: "How do you end it?" },
  { key: "U3b", ask: "What notice must you give to end it?" },
  { key: "U4", ask: "What happens if you do not comply?" },
  { key: "U5a", ask: "Can the other party change these terms?" },
  { key: "U5b", ask: "What notice do you get before a change takes effect?" },
];

export const CHECKLISTS = {
  lease: LEASE,
  tos: TOS,
  notice: UNIVERSAL,
  other: UNIVERSAL,
} satisfies Record<DocumentKind, Question[]>;

// The question a stored key was asking, for anything that shows a finding to a
// person. A finding stores `questionKey` and not the question text, because the
// key is what the extractor contracts on and the wording lives here — but a
// reader shown `U5b` has been told nothing at all. The board printed those keys
// raw until 2026-09-05.
//
// Falls back to the key rather than throwing: a finding published under a key
// that has since left a checklist is stale, not a crash.
export const questionFor = (kind: DocumentKind, key: string): string =>
  CHECKLISTS[kind].find((q) => q.key === key)?.ask ?? key;
