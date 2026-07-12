## Build the DB Client Per Invocation From a Connection String
`[HIGH]` `db-client-per-invocation`

Build the database client through a factory that takes a plain **connection string** — `createDbClient(connectionString)` wrapping `drizzle(driver(connectionString), { schema })` (driver per `CLAUDE.md`). The factory takes a **connection string, never a platform binding or `c.env`**, so the logic layers stay binding-free and transport-agnostic.

Each transport reads **its own binding** and builds the client **per invocation**, then passes it into the per-invocation bootstrap by plain construction (see `di-plain-construction`): an HTTP worker builds it per **request** in middleware whose closure captures the request context; a cron/queue worker builds it per **invocation** at the top of `scheduled()` / `queue()` from that handler's env. A platform binding exists only per invocation, so it can never be captured at module load — and the build must run before any code that uses the client (in a `*-service`'s middleware, before the first handler that queries).

**Incorrect — a module-load capture, or a factory that knows the binding:**
```ts
const db = createDbClient(env.HYPERDRIVE.connectionString);                         // 🔴 no binding at module load — binds to nothing
const makeDb = (env: Env) => drizzle(env.HYPERDRIVE.connectionString, { schema });  // 🔴 construction coupled to the binding
```

**Correct — a string-in factory, built per invocation from the worker's own binding:**
```ts
// db client factory — a connection string in, a client out; knows no binding
export const createDbClient = (connectionString: string) => drizzle(postgres(connectionString), { schema });

// a *-service's hono/app.ts middleware — per request, from THIS worker's own binding
app.use('*', async (c, next) => {
  const db = createDbClient(c.env.HYPERDRIVE.connectionString);
  c.set('bus', bootstrap({ uow: createUnitOfWork(db) }));   // plain-construction bootstrap, per invocation
  await next();
});
// cron/queue worker — same, per invocation at the top of scheduled()/queue()
const db = createDbClient(env.HYPERDRIVE.connectionString);
```

**Rules of thumb:**
- The factory signature is `createDbClient(connectionString: string)` — no `Env`, no binding, no runtime context; only the transport reads the binding.
- Build per invocation from the worker's own binding — a `*-service` → per request (middleware), cron/queue → top of `scheduled()` / `queue()` — then hand it to the bootstrap.
- Match the driver to the DB in `CLAUDE.md`; never one that bypasses the platform's connection pooling (see `db-drizzle-hyperdrive-or-d1`).
- Each service builds from its **own** database's binding — never a shared DB (see `db-per-service`).

**Why:**
- A platform binding only exists per invocation, so a module-load capture binds to nothing; taking a connection string rather than a binding is what lets every transport supply its own and keeps the logic core binding-free and transport-agnostic.

Reference: see `bounded-context-transport-agnostic` · `di-plain-construction` · `db-drizzle-hyperdrive-or-d1` · `db-per-service` · `bindings-not-endpoints`
