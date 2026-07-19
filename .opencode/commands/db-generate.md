---
description: Generate a Drizzle SQL migration from a schema package (safe, local — touches no database)
---

Generate a Drizzle migration for the schema-owning package in `$ARGUMENTS`, per `.agents/rules/db-migrations.md`. This command is **safe** — local SQL generation, touches no database.

1. **Resolve the project name.** nx project names are the **scoped** `package.json` name
   (`@scope/<project>`), not the folder basename — run `pnpm nx show projects` to list them;
   if the argument is unscoped, use the entry ending in `/<name>`. If no argument is given, discover
   the **schema-owning** projects — those whose `package.json` declares a `drizzle:generate`
   target (each schema owns its own migrations; see `db-per-service`) — and ask which to target,
   using it directly if there is exactly one. If nothing matches, show the list and stop.
2. **Ensure the `drizzle:generate` target exists** (`pnpm nx show project <project>`). If missing,
   add it (and `drizzle:migrate`) to the package's `nx.targets` per `db-migrations` — plus a
   `drizzle.config.ts` per `db-migrations` if absent — then continue.
3. Run `pnpm nx drizzle:generate <project>`.
4. Show the new SQL under the package's `./drizzle` (`git status`, `git diff`).
5. Remind the user to review and **commit** the generated SQL, then run `/db-migrate` to apply it.
   Do **not** apply migrations here — this command only generates.
