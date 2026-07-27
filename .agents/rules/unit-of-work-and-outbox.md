## Persist Every Write in One Unit of Work; Stage Events to the Outbox in the Same Transaction
`[HIGH]` `unit-of-work-and-outbox`

A write persists inside a single **Unit of Work** - one atomic transaction. The handler opens `uow.run(async (repos) => ...)`; **every** write it makes runs in that one transaction, and a mid-way failure **rolls back all of it**. A multi-table write - one aggregate persisted across several of its own tables (an organization plus its membership rows) - is **one** `uow.run`, never two separate awaited writes; a write still mutates **exactly one aggregate** per transaction (see `aggregate-write-model`). The UoW is the `IUnitOfWork` **port** from the house domain toolkit; its driver impl (`db.transaction`) and the aggregate repositories it exposes (`repos.<entity>`, `repos.outbox`) ship from the house DB toolkit. The transport builds the UoW from its own binding **per invocation** and passes it into the bootstrap; `lib/` sees only the port.

An aggregate records the **Domain Events** it raises (`raise()`); the handler drains them with `pullEvents()` and **stages them into the outbox table within that same transaction**, so the aggregate rows and the outbox rows commit together. Never dispatch an event **before** commit, and never with a **bare post-commit publish** - the commit-succeeds-then-publish gap loses the event if the process dies between the two.

A separate **relay** (a `<worker>-consumer` / `<worker>-job` worker) reads the outbox, publishes each event to a Cloudflare Queue, and marks it sent. Same-context reactions run **in-process** off the bus (`bus.publish`); cross-context consumers run **off the Queue**. Delivery is **at-least-once**, so cross-context consumers MUST be **idempotent**.

**Incorrect - the aggregate committed on its own, then a bare post-commit publish:**
```ts
await repos.organizations.save(org);      // 🔴 commits in its own tx - the aggregate rows land without the events
await queue.send(org.pullEvents());       // 🔴 bare post-commit publish - if it fails, the event is lost forever
```

**Correct - one atomic Unit of Work; events staged to the outbox in the same tx:**
```ts
await uow.run(async (repos) => {
  await repos.organizations.save(org);            // one aggregate, written across its several tables
  await repos.outbox.stage(org.pullEvents());     // ✅ aggregate rows + outbox rows in ONE transaction
});                                               // any failure rolls back everything
// relay (<worker>-consumer/<worker>-job): read outbox -> publish to Queue -> mark sent; consumers are idempotent
```

**Rules of thumb:**
- Every write in a use case runs inside one `uow.run` - the aggregate `save` and the outbox `stage` share the one transaction; a mid-way failure rolls back all of it.
- `lib/` depends on the `IUnitOfWork` port; the driver impl and the outbox come from the house DB toolkit; the transport builds the UoW per invocation.
- Never publish an event before commit or with a bare post-commit publish - stage to the outbox; a relay reads it -> Queue -> marks sent.
- Same-context reactions run in-process via `bus.publish`; cross-context reactions ride the Queue and their consumers are idempotent (at-least-once).

**Why:**
- One transaction per write removes the partial-write risk and makes the event durable the instant the write commits - the relay then delivers at-least-once and idempotent consumers absorb any redelivery; routing all writes through the port keeps the domain testable with a **fake unit of work**.

Reference: [Cosmic Python - Unit of Work](https://www.cosmicpython.com/book/chapter_06_uow.html), [Cosmic Python - external events / outbox](https://www.cosmicpython.com/book/chapter_11_external_events.html), see `aggregate-write-model`, `message-bus-and-handlers`, `db-client-per-invocation`, `lib-house-toolkits`, `db-per-service`, `trigger-thin-handlers`
