## Deploy Workers Through One Nx Target, Env Under `configurations`
`[HIGH]` `deploy-via-nx-per-env`

A Cloudflare Worker app builds, serves, and deploys through **`nx` targets that wrap `wrangler`** - the build / serve / deploy / typegen `wrangler` invocations run only inside a target's `command`, never on the CLI directly. (The one sanctioned direct-CLI `wrangler` use is **secret provisioning** - `wrangler secret put <NAME> --env <env>`, a one-off with no nx target; see `secrets-and-logging`.) Targets live in each project's `package.json` under `"nx": { "targets": { ... } }`, use `executor: "nx:run-commands"` with `cwd: "{projectRoot}"` (add `tty: true` for interactive tools), depend on `["^build"]` so the worker's libraries build first, and are invoked by the project's **scoped** name (see `naming-projects`), not the folder basename.

Per-environment variants (`development` / `production`) are **one** target: put each env under `configurations` with a `defaultConfiguration` of `development` (the safe default), and select at run time with `-c <env>` (alias for `--configuration`). Dev and prod differ only in the config the flag picks, never in a separate target.

**Incorrect - raw binary, or a target per env:**
```jsonc
// cd apps/<worker> && wrangler deploy --env production   // 🔴 bypasses ^build, caching, target inference
"deploy-dev":  { "command": "wrangler deploy --env development" },
"deploy-prod": { "command": "wrangler deploy --env production" }   // 🔴 duplicated targets
```

**Correct - one nx target wrapping wrangler, env under `configurations`:**
```jsonc
"wrangler:deploy": {
  "executor": "nx:run-commands", "dependsOn": ["^build"],
  "options": { "cwd": "{projectRoot}" },
  "defaultConfiguration": "development",
  "configurations": {
    "development": { "command": "wrangler deploy --env development" },
    "production":  { "command": "wrangler deploy --env production" }
  }
}
// nx wrangler:deploy @scope/<worker> -c production   // ✅ scoped name, env by flag
```

Reference: see `naming-projects`, `run-through-nx`, `worker-wrangler-config`, `secrets-and-logging`
