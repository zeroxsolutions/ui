## Compose the House Backend Toolkits; Re-Implement No Primitive and Ship No Schema of Your Own
`[MEDIUM]` `lib-house-toolkits`

The backend's model core comes from two shared house libraries (names in `CLAUDE.md`). The DB-agnostic **domain toolkit** ships the Cosmic primitives — the `Entity` / `ValueObject` / `AggregateRoot` bases (event collection + `pullEvents()`), the `DomainCommand` / `DomainEvent` bases, the in-process `MessageBus`, the `IUnitOfWork` **port**, `Brand<T,B>`, and the `IIdGenerator` (**uuid v7**) / `IClock` ports. A `packages/<domain>` context **composes** these; it never re-implements a bus, a base class, or a port. The **driver impl** for that port — the Unit of Work (`db.transaction`) and the transactional outbox — ships from the house **DB** toolkit, not the domain toolkit.

The house **DB toolkit** is a generic Drizzle toolkit — a base table (audit columns + soft-delete), a base repository (CRUD / pagination / relations), and query helpers — and **contains no domain schema of its own**. It targets Postgres (`postgres-js`) and Cloudflare D1 on Drizzle ORM + Zod 4; pin **Zod 4** workspace-wide to match it. Compose it in the context: spread the base table and add your own `orgId` tenancy column, keep tables under `lib/db/` and repositories under `lib/repositories/` extending the base repository.

Concrete aggregates, value objects, commands, events, handler functions, the aggregate repository, and every domain table + its repository are per-context `packages/<domain>` code — built **on** the toolkits' audited primitives, never a private copy of them.

**Incorrect — re-implementing a primitive, or expecting domain schema from a toolkit:**
```ts
export class MessageBus { /* … */ }          // 🔴 re-implementing a house primitive per package
import { usersTable } from '@scope/db';       // 🔴 the DB toolkit ships no domain schema
```

**Correct — import the primitives; compose your schema and aggregates on them:**
```ts
import { AggregateRoot, MessageBus, type IUnitOfWork } from '@scope/cosmic';
import { baseTable, BaseRepository, DrizzleUnitOfWork, DrizzleOutbox } from '@scope/db/postgres';
export class Class extends AggregateRoot<ClassId> { /* domain code */ }
export const usersTable = pgTable('users', { ...baseTable, orgId: uuid('org_id') /* tenancy */ });
```

**Rules of thumb:**
- Domain toolkit → the Cosmic bases + `MessageBus` + `IUnitOfWork` port + `Brand` + id/clock ports; never re-implement one.
- The Unit of Work impl + transactional outbox come from the **DB** toolkit; the domain toolkit ships only the port.
- DB toolkit → base table + base repository + query helpers, no domain schema; compose with an `orgId` tenancy column, tables in `lib/db/`, repositories in `lib/repositories/`.
- Aggregates, VOs, commands, events, handlers, the aggregate repo, and every table + repository are per-context code.

**Why:**
- Composing shared, audited primitives makes a fix to the bus, an aggregate base, the Unit of Work, or the base repository land once for every context; a per-package copy — or a toolkit that carried one app's domain schema — would couple every backend to one artifact and let the primitives drift.

Reference: see `aggregate-write-model` · `message-bus-and-handlers` · `unit-of-work-and-outbox` · `repo-extend-baserepository` · `db-drizzle-hyperdrive-or-d1` · `house-libs-catalog-scope`
