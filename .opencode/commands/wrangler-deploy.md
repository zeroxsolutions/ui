---
description: Deploy a Cloudflare Worker to an env via its nx wrangler:deploy target (outward-facing - deploys)
---

Deploy worker project `$1` to environment `$2` (default `development`), per
`.agents/rules/deploy-via-nx-per-env.md`. Never call `wrangler` directly - use the nx target.

*This command is **outward-facing**: it deploys. opencode pre-approves nothing and withholds nothing,
so the gate is behavioural rather than mechanical: step 5 must ask before it runs,
and it should not be approved blindly.*

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<worker>`), not the folder basename - run `pnpm nx show projects` to list them;
   if `$1` is unscoped, use the entry ending in `/$1`. If `$1` is empty, discover the
   **worker** projects - those with a `wrangler:deploy` target - and ask which to target.
   If nothing matches, show the list and stop.
2. Confirm the resolved project has a `wrangler:deploy` target (`pnpm nx show project <project>`).
   **If it's missing, add it** to the app's `package.json` `nx.targets` per
   `deploy-via-nx-per-env`; and if the app isn't a Worker yet (no `wrangler.jsonc`),
   scaffold the Worker config + `wrangler:serve`/`wrangler:deploy`/`wrangler:typegen` targets
   per `worker-wrangler-config` first. Then continue (editing config will prompt).
3. If `$2` is `production`, **stop and ask the user to confirm** - production is outward-facing.
4. Confirm the env's secrets/bindings exist (the auth service account, the Hyperdrive id).
   Never print secret values; if missing, tell the user to `wrangler secret put <NAME> --env <env>` and stop.
5. Run `pnpm nx wrangler:deploy <project> -c $2` (use `-c development` if `$2` is empty).
6. Report the deployed route/URL. On failure, surface the error verbatim - do not claim success.

<!-- Mirror of the Claude Code command shipped by the nx-cloudflare-in-house-guards
plugin (`commands/wrangler-deploy.md`). opencode has no mechanism for a plugin to register a
command, so this copy lives in the repo - edit both, or they drift. -->
