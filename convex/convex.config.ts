import { defineApp } from "convex/server";
import agentmail from "@agentmail/convex/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import workpool from "@convex-dev/workpool/convex.config";

// Your own HTTP endpoints (convex/http.ts) are served under /api so the
// static site can own the root.
const app = defineApp({ httpPrefix: "/api" });
app.use(staticHosting, { httpPrefix: "/" });
// Inbound mail: Svix verification, event dedupe and durable sending, in the
// component's own sandboxed tables rather than ours.
app.use(agentmail);
// The watch's re-checks. A sweep fans one cron tick out into a Firecrawl scrape
// and two model calls per document, and `ctx.scheduler` gives those no retry at
// all — the readiness audit's M1 exists because a scheduled action that throws
// is silent. M1's apology only covers documents someone emailed about; a
// re-check has no thread and no sender, so its failures were invisible by
// construction.
//
// The re-check qualifies for retry on the component's own test: it is
// idempotent, because `mail.attach` replaces a document's finding set outright,
// so running it twice publishes what running it once would have.
app.use(workpool, { name: "watchPool" });

export default app;
