---
description: Apply pending Drizzle migrations to a schema package's database (state-changing - writes a real database)
---

Apply pending Drizzle migrations for the schema-owning package `$1`, per `.agents/rules/db-migrations.md`.
This **writes to a real database** - proceed carefully.

*This command is **state-changing**: it writes a real database. opencode pre-approves nothing and withholds nothing,
so the gate is behavioural rather than mechanical: step 5 must ask before it runs,
and it should not be approved blindly.*

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<project>`), not the folder basename - run `pnpm nx show projects` to list them;
   if `$1` is unscoped, use the entry ending in `/$1`. If `$1` is empty, discover the
   **schema-owning** projects - those whose `package.json` declares a `drizzle:migrate`
   target (each schema owns its own migrations; see `db-per-service`) - and ask
   which to target, using it directly if there is exactly one. If nothing matches, show the
   list and stop.
2. **Ensure the `drizzle:migrate` target exists** (`pnpm nx show project <project>`). If
   missing, add it (and `drizzle:generate`) to the package's `nx.targets` per
   `db-migrations` - plus a `drizzle.config.ts` per `db-migrations`
   if absent.
3. Determine which database this package's `<APP>_DATABASE_URL` points at - its **own** direct
   URL (not the pooled binding), since each schema owns its database (`db-per-service`,
   `db-migrations`). If it targets a shared/production database, **stop and ask
   the user to confirm** first.
4. Ensure migrations were generated and committed (`/db-generate`) before applying.
5. Run `pnpm nx drizzle:migrate <project>`.
6. Report which migrations were applied. On error, surface it verbatim. Never run
   `drizzle:push` against a shared/production database.

<!-- Mirror of the Claude Code command shipped by the nx-cloudflare-in-house-guards
plugin (`commands/db-migrate.md`). opencode has no mechanism for a plugin to register a
command, so this copy lives in the repo - edit both, or they drift. -->
