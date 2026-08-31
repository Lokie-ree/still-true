// Deployment environment variables, read in one place.
//
// Two reasons this is not just `process.env.X` at the call site. Convex actions
// run where `process` exists, but the generated api.d.ts drags this module into
// the browser tsconfig, which has no node types — declaring it locally keeps
// `src/` honest about not having node globals. And deployment env vars do not
// travel between deployments, so a prod deploy with an unset key would otherwise
// fail as an opaque 401 from the vendor instead of naming what is missing.
declare const process: { env: Record<string, string | undefined> };

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing deployment environment variable ${name}. ` +
        `Set it with: npx convex env set ${name} <value> (add --prod for production).`,
    );
  }
  return value;
}
