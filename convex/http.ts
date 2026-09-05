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
  // ponytail: @agentmail/convex 0.1.0 declares this ctx as one whose
  // `runMutation` takes convex's transactionLimits options, and an httpAction's
  // does not. Runtime is unaffected — handleWebhook only ever calls
  // `ctx.runMutation(ref, args)`. Delete the cast when the component's type is
  // fixed. The disable is because the rule reads the inner `as unknown` as a
  // no-op; it is the hop that makes the outer assertion legal at all.
  handler: httpAction((ctx, req) =>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    agentmail.handleWebhook(ctx as unknown as WebhookCtx, req),
  ),
});

export default http;
