---
description: Regenerate a Worker's binding types (worker-configuration.d.ts) (safe, local — regenerates a committed file)
---

Regenerate `worker-configuration.d.ts` for the worker project in `$ARGUMENTS` after changing `wrangler.jsonc` bindings or vars, per `.agents/rules/worker-wrangler-config.md`. This command is **safe** — it regenerates a committed types file.

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<worker>`), not the folder basename — run `pnpm nx show projects` to list them;
   if the argument is unscoped, use the entry ending in `/<name>`. If no argument is given, discover
   the **worker** projects — those with a `wrangler:typegen` target (a `wrangler.jsonc`) — and ask
   which to target, using it directly if there is exactly one. If nothing matches, show the list and stop.
2. **Ensure the `wrangler:typegen` target exists** (`pnpm nx show project <project>`). If missing,
   add it per `worker-wrangler-config` (it wraps `wrangler types`); the generated file is committed
   and wired into tsconfig `include` per `worker-wrangler-config`. Since that needs a `wrangler.jsonc`,
   scaffold the Worker config + targets per `worker-wrangler-config` first if the app isn't a Worker yet.
3. Run `pnpm nx wrangler:typegen <project>`.
4. Show the diff on the generated `worker-configuration.d.ts` and remind the user to commit it so
   binding types stay in sync.
