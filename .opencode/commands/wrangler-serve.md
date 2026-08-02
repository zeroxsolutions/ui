---
description: Run a Cloudflare Worker locally via its nx wrangler:serve target (safe, local - long-running)
---

Serve worker project `$1` locally, per `.agents/rules/deploy-via-nx-per-env.md` and
`worker-wrangler-config`. Never call `wrangler` or `opennextjs-cloudflare` directly - use the
nx target.

*This command is **safe** (local only): it writes nothing outward. opencode has no
per-command tool allowlist, so nothing here is pre-approved - your own permission
settings decide what runs.*

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<worker>`), not the folder basename - run `pnpm nx show projects` to list them;
   if `$1` is unscoped, use the entry ending in `/$1`. If `$1` is empty, discover the
   **worker** projects - those with a `wrangler:serve` target - and ask which to target,
   using it directly if there is exactly one. If nothing matches, show the list and stop.
2. **Ensure the `wrangler:serve` target exists** (`pnpm nx show project <project>`). If
   missing, add it to the app's `package.json` `nx.targets`. Two things it MUST carry:
   - **`"continuous": true`.** A dev-server CLI never exits. Without this flag nx treats the
     target as a task that should complete, so the invocation blocks forever and any
     `dependsOn` waiting on it never proceeds. Every long-running CLI target - a worker dev
     server, a framework dev server, a watcher - carries it; a one-shot target
     (`wrangler:deploy`, `wrangler:typegen`) must not.
   - **The right underlying CLI for the app kind.** A plain Worker wraps
     `wrangler dev --env development`. A Next SSR app deployed through `@opennextjs/cloudflare`
     wraps `opennextjs-cloudflare preview --env development` instead - `wrangler dev` cannot
     run it, because the entry is the OpenNext build output (`.open-next/worker.js`), which
     that command produces.

   If the app isn't a Worker yet (no `wrangler.jsonc`), scaffold the Worker config and its
   targets per `worker-wrangler-config` first.
3. **Do not bake a port into the target.** Each dev server takes the default port, which is
   correct for the usual case of running one at a time. Pass a port only at the moment two
   need to run together, appending it to the run in step 5:
   `pnpm nx wrangler:serve <project> -- --port <n> --inspector-port <n>`.
4. Confirm local secrets are in place. `wrangler dev` reads the worker directory's gitignored
   `.dev.vars`, which mirrors the deployed secrets (`secrets-and-logging`). Never print a
   value; if one is missing, name the key and tell the user to add it. Note that a
   build-time-inlined variable (anything `NEXT_PUBLIC_*` in a Next app) comes from the env
   files at build, not from `.dev.vars` - a missing one is baked into the bundle as absent.
5. Run `pnpm nx wrangler:serve <project>` **in the background** - it does not exit.
6. Report the URL it bound to, read from the output rather than assumed: the port falls
   through to the next free one when the default is taken, so two servers can be live on
   different ports than you expect. On failure, surface the error verbatim - do not claim it
   started.
7. Every binding stays local. Never point a local binding at a production resource
   (`worker-wrangler-config`).

<!-- Mirror of the Claude Code command shipped by the nx-cloudflare-in-house-guards
plugin (`commands/wrangler-serve.md`). opencode has no mechanism for a plugin to register a
command, so this copy lives in the repo - edit both, or they drift. -->
