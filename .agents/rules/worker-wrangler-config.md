## Give Each Worker One `wrangler.jsonc`, Typed Bindings, and Locally-Backed Dev
`[MEDIUM]` `worker-wrangler-config`

Each worker app (`<worker>`) owns exactly one `wrangler.jsonc` carrying `compatibility_flags: ["nodejs_compat"]`, `observability.enabled: true`, and an `env.development` / `env.production` split — every per-env value (bindings, triggers, routes) lives under `env.<env>`, so dev and prod stay structurally identical and differ only in configuration. **Exposure follows the worker's role.** Only the client-facing edge gateway is public: `workers_dev: true` in dev, a `route` in prod. Every internal worker (`<domain>-service`, `*-cron`, `*-queue`) is private — no `route`, `workers_dev: false` in *both* envs — reached only through its service binding or trigger. A public URL on an internal worker lets a caller reach it directly and forge the identity/scope the gateway is meant to establish, bypassing the one auth gate (see `mw-single-global-gate-per-route-rbac`).

Give each worker a `wrangler:typegen` nx target, commit its output, and regenerate after every binding or config change so the types match the runtime bindings. A worker app takes its Cloudflare globals and typed `Env` from the generated `worker-configuration.d.ts`, wired into `tsconfig.app.json` `include` as a direct file include (keep `types: ["node"]`) — never a `/// <reference>` in `.ts` source. A domain package has no `wrangler.jsonc`, so it can't run typegen: it pulls the bare CF globals from a single ambient `src/cloudflare-env.d.ts` holding `/// <reference types="@cloudflare/workers-types" />`. Keep the reference in exactly one place per project. (A Next/OpenNext app runs typegen too, emitting `cloudflare-env.d.ts` with a `CloudflareEnv` interface — see `fe-deploy-by-render-mode`.)

Run the worker locally under `wrangler dev` with every binding backed **locally**, so dev mirrors production without touching real data: a local Postgres backs the Hyperdrive binding through its `localConnectionString`, or `wrangler dev` serves a local SQLite for D1 (see `CLAUDE.md` for the database choice), and auth runs against the provider's emulator (see `auth-verify-server-side`). Never point a local binding at a production resource.

**Incorrect — an internal worker left public, or a scattered CF-types reference:**
```jsonc
// apps/<worker>-service (internal) — exposed on a public URL
{ "env": { "development": { "workers_dev": true } } }   // 🔴 gateway auth gate now bypassable
```
```ts
/// <reference types="@cloudflare/workers-types" />   // 🔴 sprinkled through src/*.ts instead of one home
```

**Correct — env split, gateway public / internal private, CF types in one place:**
```jsonc
// edge gateway — the one public ingress
{ "compatibility_flags": ["nodejs_compat"], "observability": { "enabled": true },
  "env": { "development": { "workers_dev": true },
           "production":  { "route": "<host>/*" } } }
// internal <domain>-service / *-cron / *-queue — private in both envs
{ "env": { "development": { "workers_dev": false }, "production": { "workers_dev": false } } }
// worker app — tsconfig.app.json wires the generated file, no source-level reference
{ "compilerOptions": { "types": ["node"] }, "include": ["src/**/*.ts", "./worker-configuration.d.ts"] }
```
Note: a domain package (no `wrangler.jsonc`) instead declares CF globals once in `src/cloudflare-env.d.ts`.

Reference: see `bindings-not-endpoints` · `secrets-and-logging` · `mw-single-global-gate-per-route-rbac` · `naming-projects` · `db-migrations` · `fe-deploy-by-render-mode`
