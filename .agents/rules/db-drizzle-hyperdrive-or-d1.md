## Reach the Database Only Through Drizzle, Matching the Driver to the DB
`[HIGH]` `db-drizzle-hyperdrive-or-d1`

Access the database **only through Drizzle** — define schema and queries with its query builder, with **no raw SQL**. Compose the house DB toolkit (`baseTable`, `BaseRepository`; see `CLAUDE.md`) and **drizzle-zod** for internal row schemas, and pin **Zod 4** workspace-wide to match the toolkit.

Match the **driver to the database** the repo chose (see `CLAUDE.md`): **`postgres-js` over a Hyperdrive binding** for Postgres, or **`drizzle-orm/d1`** for D1 (SQLite, served locally under `wrangler dev`) — never the Neon serverless driver, which doesn't fit the Hyperdrive-pooled Workers path. The frontend opens no database connection; it reaches data only through the backend API. Postgres DDL migrates over a direct URL that bypasses the pool, not the runtime binding (see `db-migrations`).

**Incorrect — raw SQL or the wrong Workers driver:**
```ts
await sql`SELECT * FROM users`;                    // 🔴 raw SQL bypasses the typed schema
import { neon } from '@neondatabase/serverless';   // 🔴 serverless driver breaks the Hyperdrive-pooled path
```

**Correct — Drizzle's query builder over the matched driver:**
```ts
db.select().from(usersTable).where(eq(usersTable.orgId, orgId));   // ✅ Drizzle query builder
// Postgres on Workers: postgres-js over the Hyperdrive binding
```

Reference: [Drizzle ORM](https://orm.drizzle.team/docs/overview) · see `lib-house-toolkits` · `repo-extend-baserepository` · `db-client-per-invocation` · `db-migrations`
