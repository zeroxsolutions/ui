## Run Every Build, Test, Lint, and Serve Through Nx
`[HIGH]` `run-through-nx`

This is an Nx monorepo, so drive **every** build, test, lint, serve, and ops task through `nx` (or `pnpm nx`) — never a framework or tool binary straight on the CLI. Nx owns target inference, caching, `affected` detection, and dependency ordering; a raw binary bypasses all of it and drifts from the wiring the generators set up. Invoke by the project's **scoped** `package.json#name` (`@scope/<project>`), not the folder basename — a bare basename fails with *"project not found"* (confirm names with `nx show projects`). Tests run the same way: `nx test @scope/<project>`, `nx run-many -t test` to sweep the workspace, `nx e2e @scope/<app>-e2e` for e2e. Ops targets (`wrangler:*`, `drizzle:*`) also run through `nx` (see `deploy-via-nx-per-env`, `db-migrations`).

When adding or changing a project's tests, run them on the **workspace's configured runner**, surfaced as that project's `test` target. Discover it from `nx.json` plugins and a sibling's existing config — don't assume — and match it; keep one runner per workspace. A workspace can have more than one test plugin installed, so a freshly generated library can silently drift onto the wrong runner — catch it (concrete runner in `CLAUDE.md`).

**Incorrect — raw binary / bare basename:**
```ts
jest packages/<domain>            // 🔴 raw binary — no graph, no caching
nx build <project>               // 🔴 folder basename → "project not found"
```
**Correct — nx target by scoped name:**
```ts
nx build @scope/<project>        // ✅
nx run-many -t test              // ✅ sweep every project on its configured runner
```

Reference: see `naming-projects` · `deploy-via-nx-per-env` · `db-migrations` · `gen-via-generator`
