## Route Every Write Through the Message Bus; Wire Handlers at a Per-Invocation Bootstrap
`[HIGH]` `message-bus-and-handlers`

In a write-owning bounded context the **message bus is the entrypoint into the domain** (Cosmic Python Ch9). A transport — a `hono` route or a `*-queue` consumer — is a **thin adapter**: it builds a **Command** and dispatches `bus.send(cmd)`, or maps a queue message to a **Domain Event** and `bus.publish(event)`. It never calls a handler or a service directly and holds no business logic. The bus owns the routing: one command → exactly one handler (`onCommand`), one event → zero-or-more handlers (`onEvent`). A domain event that must leave the context is published to a Cloudflare Queue and consumed by that context's `*-queue` worker, never dispatched into another context's database (see `db-per-service`).

A handler is a **plain function** — `(deps) => (message) => result` — registered on the bus by message type, receiving its dependencies **by closure**. The object graph is wired by a per-invocation **`bootstrap`** — the one composition root — via plain construction (see `di-plain-construction`). The `bootstrap` takes already-resolved dependencies (an injected `uow`; pure `clock` / `ids` defaulted where the context needs them), registers each handler, and returns a wired `MessageBus`. It never reads `c.env` or a binding: the transport builds the `uow` from its own binding per invocation and passes it in (see `db-client-per-invocation`, `bounded-context-transport-agnostic`). Because a binding exists only per invocation, the bus is never a module-level singleton — the **same** `bootstrap` is re-run and reused by every entrypoint (HTTP, `*-queue`, cron), so one registration serves every trigger.

**Incorrect — the transport wires straight to a handler, bypassing the bus:**
```ts
classesRoutes.openapi(createClassRoute, async (c) => {
  await createClass(deps)(c.req.valid('json'));   // 🔴 transport coupled to logic; skips the bus routing
});
```

**Correct — the transport builds a Command and dispatches; the bootstrap wires the bus:**
```ts
// hono/routes/classes.ts — thin adapter: build → dispatch → re-read row → serialize
classesRoutes.openapi(createClassRoute, async (c) => {
  const cmd = new CreateClass({ ...c.req.valid('json'), orgId: c.req.param('orgId'), actorId: c.get('actor').id });
  const id  = await c.get('bus').send(cmd);       // ✅ the bus routes to the one handler
  // …post-commit row read → serialize (see aggregate-write-model)
});

// lib/handlers/create-class.ts — a function handler; deps arrive by closure
export const createClass = (deps: HandlerDeps) => (cmd: CreateClass): Promise<ClassId> =>
  deps.uow.run(async (repos) => { /* load aggregate → behave → save + stage events */ });

// lib/bootstrap.ts — the one composition root, run per invocation, no container
export function bootstrap({ uow, clock = systemClock, ids = uuidV7IdGenerator }: BootstrapDeps): MessageBus {
  const deps = { uow, clock, ids };
  const bus  = new MessageBus();
  bus.onCommand(CreateClass, createClass(deps));
  bus.onEvent(ClassCreated, [projectClassCount(deps)]);
  return bus;
}
```

**Rules of thumb:**
- The transport builds the message and calls `bus.send` / `bus.publish` — never a handler or service method directly.
- One command → one handler; one event → zero-or-more handlers; the bus owns routing.
- The `bootstrap` is the one composition root, run per invocation; it takes resolved deps and returns a `MessageBus`, never reading `c.env`, never a module-level singleton.
- The same `bootstrap` serves every entrypoint (HTTP, `*-queue`, cron); a cross-context event rides a Queue to a `*-queue` consumer.
- Test a handler by passing fake `deps` (a fake unit of work + in-memory bus) straight to it (see `test-seams-and-real-db`).

**Why:**
- Routing every write through one bus makes the domain's entrypoints uniform — HTTP, queue, and cron each build a message and dispatch — keeps the transport a thin adapter, and gives one registration point so a new trigger reuses the exact same handler, wired as ordinary readable code.

Reference: [Cosmic Python — the message bus](https://www.cosmicpython.com/book/chapter_09_all_messagebus.html) · [Cosmic Python — bootstrap / DI](https://www.cosmicpython.com/book/chapter_13_dependency_injection.html) · see `di-plain-construction` · `aggregate-write-model` · `bounded-context-transport-agnostic` · `db-client-per-invocation` · `boundary-worker-composition-only` · `db-per-service` · `test-seams-and-real-db`
