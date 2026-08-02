---
description: Regenerate a Worker's binding types (worker-configuration.d.ts) (safe, local - regenerates a committed file)
---

Regenerate `worker-configuration.d.ts` for worker project `$1` after changing
`wrangler.jsonc` bindings or vars, per `.agents/rules/worker-wrangler-config.md`.

*This command is **safe** (regenerates a committed types file): it writes nothing outward. opencode has no
per-command tool allowlist, so nothing here is pre-approved - your own permission
settings decide what runs.*

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<worker>`), not the folder basename - run `pnpm nx show projects` to list them;
   if `$1` is unscoped, use the entry ending in `/$1`. If `$1` is empty, discover the
   **worker** projects - those with a `wrangler:typegen` target (a `wrangler.jsonc`) - and ask
   which to target, using it directly if there is exactly one. If nothing matches, show the
   list and stop.
2. **Ensure the `wrangler:typegen` target exists** (`pnpm nx show project <project>`). If
   missing, add it per `worker-wrangler-config` (it wraps `wrangler types`);
   the generated file is committed and wired into tsconfig `include` per
   `worker-wrangler-config`. Since that needs a `wrangler.jsonc`, scaffold the Worker
   config + targets per `worker-wrangler-config` first if the app isn't a Worker yet.
3. Run `pnpm nx wrangler:typegen <project>`.
4. Show the diff on the generated `worker-configuration.d.ts` and remind the user to
   commit it so binding types stay in sync.

<!-- Mirror of the Claude Code command shipped by the nx-cloudflare-in-house-guards
plugin (`commands/wrangler-typegen.md`). opencode has no mechanism for a plugin to register a
command, so this copy lives in the repo - edit both, or they drift. -->
