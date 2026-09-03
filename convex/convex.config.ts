import { defineApp } from "convex/server";
import agentmail from "@agentmail/convex/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";

// Your own HTTP endpoints (convex/http.ts) are served under /api so the
// static site can own the root.
const app = defineApp({ httpPrefix: "/api" });
app.use(staticHosting, { httpPrefix: "/" });
// Inbound mail: Svix verification, event dedupe and durable sending, in the
// component's own sandboxed tables rather than ours.
app.use(agentmail);

export default app;
