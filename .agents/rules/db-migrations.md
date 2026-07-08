## Run Migrations Through Nx Targets, Over a Direct Connection, With Committed SQL
`[HIGH]` `db-migrations`

A package that owns a database schema migrates it through **nx targets that wrap drizzle-kit** — `drizzle:generate`, `drizzle:migrate`, `drizzle:push`, `drizzle:pull` in that package's `package.json` (each `nx:run-commands` with `cwd: "{projectRoot}"`; `drizzle:generate` and `drizzle:migrate` carry `dependsOn: ["^build"]` so dependencies build first) — invoked by the **scoped** project name, never the `drizzle-kit` binary on the CLI. The workflow runs one direction: edit the schema → `drizzle:generate` (writes versioned SQL under `./drizzle` — **commit it**; that SQL *is* the migration history, and committing it makes migrations reproducible across machines and environments) → `drizzle:migrate` (applies it to the target-env database). `drizzle:push` produces no migration file — use it only for throwaway/local sync, never against a shared or prod database.

DDL must reach the database over a **direct, DDL-capable connection** configured in the package's `drizzle.config.ts` — never the pooled runtime binding, which is tuned for request traffic and can corrupt pooled state when it carries DDL. For Postgres that connection is a direct DB URL that bypasses the Hyperdrive pool; for Cloudflare D1 it is the `d1-http` driver over the D1 HTTP API (so `drizzle:migrate` itself applies the migration — do not run `wrangler d1 migrations apply`). Only `drizzle.config.ts` differs by the Postgres-or-D1 choice (see `CLAUDE.md`); the targets and workflow are identical. The connection is per-environment — one database per deploy env — so point the config at the target env's database before migrating, or you silently migrate the wrong one.

The migration connection is a superset of runtime access, so its credentials are **secrets**: `drizzle.config.ts` reads them from `process.env.*` — the Postgres `<APP>_DATABASE_URL`, or D1's three `CLOUDFLARE_*` values (account id, database id, token) — and the real values live in the secret store or a gitignored `.env`, never in the config or committed to the repo. Add the package's `drizzle.config.*` to the eslint `@nx/dependency-checks` `ignoredFiles` so lint doesn't flag its `drizzle-kit` import, which stays a devDependency.

**Incorrect — the runtime pool binding for DDL, or a committed credential:**
```ts
// drizzle.config.ts
dbCredentials: { url: env.HYPERDRIVE.connectionString }   // 🔴 runtime pool mangles DDL
dbCredentials: { url: 'postgres://user:pass@host/db' }    // 🔴 credential committed to the repo
```
**Correct — a direct connection from env; migrate through the nx target:**
```ts
// drizzle.config.ts on the schema owner (Postgres)
export default defineConfig({
  out: './drizzle', schema: './src/lib/db/schema.ts', dialect: 'postgresql',
  dbCredentials: { url: process.env.<APP>_DATABASE_URL as string },   // ✅ DIRECT URL, from a secret
});
// edit schema → nx drizzle:generate @scope/<domain>  (commit ./drizzle/*.sql) → nx drizzle:migrate @scope/<domain>
```
The repo's `/db-generate` and `/db-migrate` commands wrap the `drizzle:generate` / `drizzle:migrate` targets.

Reference: see `db-drizzle-hyperdrive-or-d1` · `secrets-and-logging` · `naming-projects` · `deploy-via-nx-per-env` · `naming-files-and-symbols`
