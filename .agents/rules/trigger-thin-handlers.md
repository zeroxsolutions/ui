## Keep Cron and Queue Handlers Thin Entrypoints That Reuse the Domain's Services
`[MEDIUM]` `trigger-thin-handlers`

Beyond HTTP, a worker can run on a **schedule** (`triggers.crons`, handled by a `scheduled()` export) or **consume a queue** (`queues.consumers[]`, handled by a `queue()` export). Dedicated schedule/consumer work runs on its own `*-cron` / `*-queue` worker; the edge gateway serves client traffic (HTTP/WS), never triggers. The worker app stays a **composition-only shell** - `export default { fetch, scheduled, queue }`, one handler export per trigger kind, per-env triggers under `env.<env>.triggers` - and holds no business logic.

Each handler is a **thin transport entrypoint**, symmetric with the package's HTTP transport: it builds the DB client per invocation from the worker's own binding, then **reuses the exact `lib/` services the HTTP path uses** - a write dispatches a **Command** through the per-invocation bootstrap's message bus, a read calls the same query service - and returns. It is an entrypoint, not a new logic layer. A **durable/stateful runtime object** (e.g. a per-room presence object) is likewise a thin entrypoint delegating to services behind interfaces. Offload heavy jobs to a queue/workflow; never block a request handler with heavy work.

**Incorrect - logic inline in the trigger export:**
```ts
// apps/<worker>-cron/src/main.ts
export default {
  scheduled: async (_event, env) => { /* query DB, compute, branch - logic here */ }  // 🔴 logic in the deployable
};
```

**Correct - the worker re-exports; the handler builds the client per invocation and reuses the bus:**
```ts
// apps/<worker>-cron/src/main.ts - composition-only shell
import { scheduled } from '@scope/<domain>';
export default { scheduled };            // wrangler.jsonc: env.<env>.triggers.crons: ["0 * * * *"]

// packages/<domain>/... - thin entrypoint, per invocation
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (_event, env) => {
  const db = drizzle(postgres(env.HYPERDRIVE.connectionString), { schema });
  await bootstrap({ uow: makeUnitOfWork(db) }).send(new RelayOutbox());   // the same handler the HTTP path dispatches
};
```

Reference: see `boundary-worker-composition-only`, `naming-projects`, `db-client-per-invocation`, `message-bus-and-handlers`, `bounded-context-transport-agnostic`
