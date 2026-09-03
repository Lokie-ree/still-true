import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { agentmail } from "./mail";

// The only route open to the internet, and it is one line of ours.
//
// The component verifies the Svix signature, dedupes on `event_id`, and
// dispatches to `onMessageReceived` through its own workpool, so a slow read of
// a 300-page PDF cannot block the next delivery. `convex.config.ts` sets
// httpPrefix "/api", so this lands at /api/agentmail — the URL the webhook is
// already registered against.
const http = httpRouter();

type WebhookCtx = Parameters<typeof agentmail.handleWebhook>[0];

http.route({
  path: "/agentmail",
  method: "POST",
  // ponytail: @agentmail/convex 0.1.0 types this ctx as a mutation ctx, but its
  // own README calls it from an httpAction, whose `runMutation` has no
  // transactionLimits overload. Runtime is unaffected — handleWebhook only
  // calls `ctx.runMutation`. Delete the cast when the component's type is fixed.
  handler: httpAction((ctx, req) =>
    agentmail.handleWebhook(ctx as unknown as WebhookCtx, req),
  ),
});

export default http;
