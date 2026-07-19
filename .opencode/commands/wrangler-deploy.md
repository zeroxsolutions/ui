---
description: Deploy a Cloudflare Worker to an env via its nx wrangler:deploy target (outward-facing — deploys)
---

Deploy a worker to an environment per `.agents/rules/deploy-via-nx-per-env.md`. From `$ARGUMENTS`, the first token is the worker project and the optional second is the env (`development` | `production`, default `development`). Never call `wrangler` directly — use the nx target.

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<worker>`), not the folder basename — run `pnpm nx show projects` to list them;
   if the argument is unscoped, use the entry ending in `/<name>`. If no project is given, discover
   the **worker** projects — those with a `wrangler:deploy` target — and ask which to target.
   If nothing matches, show the list and stop.
2. Confirm the resolved project has a `wrangler:deploy` target (`pnpm nx show project <project>`).
   **If it's missing, add it** to the app's `package.json` `nx.targets` per `deploy-via-nx-per-env`;
   and if the app isn't a Worker yet (no `wrangler.jsonc`), scaffold the Worker config +
   `wrangler:serve`/`wrangler:deploy`/`wrangler:typegen` targets per `worker-wrangler-config` first.
3. If the env is `production`, **stop and ask the user to confirm** — production is outward-facing.
4. Confirm the env's secrets/bindings exist (the auth service account, the Hyperdrive id). Never print
   secret values; if missing, tell the user to `wrangler secret put <NAME> --env <env>` and stop.
5. Run `pnpm nx wrangler:deploy <project> -c <env>` (use `-c development` if the env is empty). Because
   this deploys, **ask for confirmation before running**.
6. Report the deployed route/URL. On failure, surface the error verbatim — do not claim success.
