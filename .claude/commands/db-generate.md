---
description: Generate a Drizzle SQL migration from a schema package (safe, local — touches no database)
argument-hint: <project> (schema owner; asks if omitted)
allowed-tools: Bash(pnpm nx show*), Bash(pnpm nx drizzle:generate*), Bash(git status*), Bash(git diff*)
---

Generate a Drizzle migration for the schema-owning package `$1`, per `.claude/rules/db-migrations.md`.

*Safety gate: this command is **safe** (local SQL generation, touches no database), so its `drizzle:generate` target is allowlisted in `allowed-tools` and runs without a prompt.*

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<project>`), not the folder basename — run `pnpm nx show projects` to list them;
   if `$1` is unscoped, use the entry ending in `/$1`. If `$1` is empty, discover the
   **schema-owning** projects — those whose `package.json` declares a `drizzle:generate`
   target (each schema owns its own migrations; see `db-per-service`) — and ask
   which to target, using it directly if there is exactly one. If nothing matches, show the
   list and stop.
2. **Ensure the `drizzle:generate` target exists** (`pnpm nx show project <project>`). If
   missing, add it (and `drizzle:migrate`) to the package's `nx.targets` per
   `db-migrations` — plus a `drizzle.config.ts` per `db-migrations`
   if absent — then continue.
3. Run `pnpm nx drizzle:generate <project>`.
4. Show the new SQL under the package's `./drizzle` (`git status`, `git diff`).
5. Remind the user to review and **commit** the generated SQL, then run `/db-migrate`
   to apply it. Do **not** apply migrations here — this command only generates.
