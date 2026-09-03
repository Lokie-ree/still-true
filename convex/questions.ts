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

export type DocumentKind = "lease" | "tos" | "notice" | "other";

export type Question = { key: string; ask: string };

// docs/probe-v3.md, "Lease / rental agreement".
const LEASE: Question[] = [
  { key: "L1", ask: "How many days after move-out must the deposit be returned?" },
  { key: "L2", ask: "How much notice must the landlord give before entering?" },
  { key: "L3", ask: "What is the late fee, and what day does it start?" },
  { key: "L4", ask: "How much notice is required to terminate, and does the lease auto-renew?" },
  { key: "L5", ask: "Which repairs is the tenant responsible for paying for?" },
];

// docs/probe-v3.md, "Terms of service / consumer agreement".
const TOS: Question[] = [
  { key: "T1", ask: "Is arbitration binding, can you opt out of it, and by when?" },
  { key: "T2", ask: "Does it auto-renew, and how do you cancel?" },
  { key: "T3", ask: "Can they change the terms unilaterally, and what notice do you get?" },
  { key: "T4", ask: "Is your data shared with third parties?" },
  { key: "T5", ask: "What happens to your account or your content when it terminates?" },
];

// The third list, added 2026-09-03. Five facts that are true of almost any
// document that puts an obligation on the person receiving it — an HOA notice,
// an insurance renewal, an employment handbook, a service contract.
//
// This exists because the alternative was worse. Firing the lease checklist at
// an insurance renewal publishes "searched 2,140 lines; this document does not
// state the deposit return window" — a true sentence and a category error. The
// refusal is the half of this product nobody else ships, and it only carries
// weight when the question belonged to the document. So an unclassifiable
// document gets questions that fit any document rather than questions that fit
// none of it.
const UNIVERSAL: Question[] = [
  { key: "U1", ask: "What does this require you to do, and by when?" },
  { key: "U2", ask: "What does it cost you — fees, charges, deposits, or penalties?" },
  { key: "U3", ask: "How do you end it, and what notice must you give?" },
  { key: "U4", ask: "What happens if you do not comply?" },
  { key: "U5", ask: "Can the other party change these terms, and what notice do you get?" },
];

export const CHECKLISTS = {
  lease: LEASE,
  tos: TOS,
  notice: UNIVERSAL,
  other: UNIVERSAL,
} satisfies Record<DocumentKind, Question[]>;
