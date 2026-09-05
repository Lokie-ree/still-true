// The gate. Every check below is a claim this repository makes about itself in
// README.md or docs/READINESS.md, rewritten as something that exits non-zero.
//
// It exists because "is it done?" kept being answered by reading the code, and
// twice the answer was wrong in the expensive direction: P0 was reported
// deployed when it was not, and a webhook was reported silent while its logs sat
// sixteen minutes old. Neither was carelessness. Both were a judgement call
// standing in for a measurement, and the fix for that is not more care.
//
//   npm run gate
//
// Read-only, and free: no mutation, no scrape, no model call. Safe to run on a
// loop. The local half (tsc, tests) runs ahead of this in the npm script, so
// what is left here is the half that can only be answered by asking production.
//
// ponytail: no framework, no reporter, no config. A list of named checks and an
// exit code is the entire contract. Reach for more when a check needs to run
// somewhere that reads JUnit XML.

const PROD = "impressive-marten-163";
const CLOUD = `https://${PROD}.convex.cloud`;
const SITE = `https://${PROD}.convex.site`;

// Predeclared, so a failing run cannot be argued down to a passing one after
// the fact.
//
// 48h rather than 24h for the sweep: the cron fires daily at 11:17 UTC, so a
// run that happens to land 23 hours after the last sweep would fail a 24-hour
// threshold while nothing whatsoever is wrong. Two cycles missed is a real
// signal; one boundary crossing is a clock.
const LIMITS = {
  publicFunctions: 2,
  sweepStaleAfterMs: 48 * 60 * 60 * 1000,
  minBoardDocuments: 1,
};

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

async function callQuery(path, args = {}) {
  const res = await fetch(`${CLOUD}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  const body = await res.json();
  // A Convex function that throws still answers 200 with status:"error". Reading
  // only res.ok here is the same mistake as trusting a 200 from the board.
  if (body.status !== "success") {
    throw new Error(`${path} → ${body.errorMessage ?? JSON.stringify(body)}`);
  }
  return body.value;
}

// H1's invariant, asserted against the deployment rather than the branch. The
// schema that shipped before this one had a public `publish` mutation that let
// any caller write arbitrary findings into production; this is the check that
// notices the day one comes back.
check("prod exposes only read-only queries", async () => {
  const { execFileSync } = await import("node:child_process");
  const raw = execFileSync(
    "npx",
    ["convex", "function-spec", "--deployment", PROD],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  const spec = JSON.parse(raw);
  const functions = Array.isArray(spec) ? spec : spec.functions;
  const publics = functions.filter((f) => f.visibility?.kind === "public");
  const writers = publics.filter((f) => f.functionType !== "Query");
  if (writers.length > 0) {
    throw new Error(
      `public non-query on prod: ${writers.map((f) => f.identifier).join(", ")}`,
    );
  }
  if (publics.length !== LIMITS.publicFunctions) {
    throw new Error(
      `expected ${LIMITS.publicFunctions} public functions, found ${publics.length}: ` +
        publics.map((f) => f.identifier).join(", "),
    );
  }
  return `${functions.length} functions, ${publics.length} public, all queries`;
});

// A 200 and a correct <title> are not evidence a page is usable — that lesson
// cost a day. This cannot prove the board renders, and does not claim to: it
// proves the document that carries the app is being served and references a
// bundle. What the board actually SAYS is the next check, asked of the data.
check("the site serves the app document", async () => {
  const res = await fetch(SITE);
  if (!res.ok) throw new Error(`${SITE} → HTTP ${res.status}`);
  const html = await res.text();
  if (!/<script[^>]+src=/.test(html)) {
    throw new Error("no script tag: the site is serving something, not the app");
  }
  return `HTTP 200, ${html.length} bytes, bundle referenced`;
});

// The leak H1 was: this asks production, with no credentials, exactly what a
// stranger gets, and fails if a single private row is in it. Asserted against
// the live answer rather than against the index that is supposed to gate it,
// because the index being right is the thing in question.
check("the public board returns only public documents", async () => {
  const documents = await callQuery("documents:recent");
  if (documents.length < LIMITS.minBoardDocuments) {
    throw new Error(`board is empty: ${documents.length} documents`);
  }
  const leaked = documents.filter((d) => d.isPublic !== true);
  if (leaked.length > 0) {
    throw new Error(
      `${leaked.length} non-public rows on the board: ` +
        leaked.map((d) => d._id).join(", "),
    );
  }
  return `${documents.length} documents, all isPublic`;
});

// The product's whole invariant, asserted where a reader would meet it: no
// answer without a receipt. The schema makes an answered finding without a
// quote unrepresentable; this checks that what is actually stored on production
// agrees, and that a quote is not the empty string.
check("every published answer carries its quote", async () => {
  const documents = await callQuery("documents:recent");
  let answered = 0;
  for (const document of documents) {
    const findings = await callQuery("documents:findingsFor", {
      documentId: document._id,
    });
    for (const finding of findings) {
      if (finding.verdict !== "answered") continue;
      answered++;
      if (typeof finding.quote !== "string" || finding.quote.trim() === "") {
        throw new Error(`empty quote on ${document._id} / ${finding.questionKey}`);
      }
      if (!Number.isInteger(finding.lineNo) || finding.lineNo < 1) {
        throw new Error(`bad lineNo on ${document._id} / ${finding.questionKey}`);
      }
    }
  }
  if (answered === 0) throw new Error("no answered findings on the board");
  return `${answered} answered findings, all quoted with a line number`;
});

// M3's blind spot, from the outside. A re-check that throws writes nothing
// anywhere and the only surviving signal is a `lastCheckedAt` that quietly
// stops advancing — while the reply goes on promising a daily re-read. That
// signal is invisible in the logs and perfectly visible here.
//
// What this CANNOT tell you is whether the cron fired or somebody ran
// `watch:sweep` by hand — both stamp the same field. As of today every stamp on
// production came from a manual run; the schedule's first real firing is
// 11:17 UTC on 2026-09-06. So a green check here means "the sweep ran",
// not "the schedule works", until that has happened once unattended.
check("the watch has swept recently", async () => {
  const documents = await callQuery("documents:recent");
  const checked = documents
    .map((d) => d.lastCheckedAt)
    .filter((at) => typeof at === "number");
  if (checked.length === 0) {
    throw new Error("no document has ever been re-checked");
  }
  const newest = Math.max(...checked);
  const ageMs = Date.now() - newest;
  if (ageMs > LIMITS.sweepStaleAfterMs) {
    throw new Error(
      `last sweep ${(ageMs / 3_600_000).toFixed(1)}h ago, over the ` +
        `${LIMITS.sweepStaleAfterMs / 3_600_000}h threshold — the cron is not running ` +
        `or every re-check is failing`,
    );
  }
  return `last sweep ${(ageMs / 3_600_000).toFixed(1)}h ago, ${checked.length} documents stamped`;
});

console.log(`gate: production ${PROD} (read-only)\n`);

let failed = 0;
for (const { name, fn } of checks) {
  try {
    console.log(`  PASS  ${name}\n        ${await fn()}`);
  } catch (thrown) {
    failed++;
    console.log(
      `  FAIL  ${name}\n        ${thrown instanceof Error ? thrown.message : thrown}`,
    );
  }
}

console.log(
  `\n${checks.length - failed}/${checks.length} checks passed on ${PROD}.`,
);
process.exit(failed === 0 ? 0 : 1);
