## Layer `lib/` Downward-Only; Home Every Type in `types/` and Every Helper in `utils/`
`[HIGH]` `structure-lib-layers`

Structure each backend `<domain>` package's `lib/` as a **downward-only** stack: every layer depends only on the one below and programs to **interfaces** (`I<entity>Repository`, `I<entity>Service`, the port seams). The logic layers stop at the service and stay **transport-agnostic** — the package's Hono transport (routes, middleware, per-request DI) sits beside them under `hono/`, depending on the services and never the reverse. A dependency arrow that points **up** — a repository importing a service, or any logic layer importing an HTTP framework — is the smell.

| Layer | Path | Holds |
| --- | --- | --- |
| Schema | `lib/db/` | tables + drizzle-zod row schemas + the tenancy column; the schema-derived row type stays here |
| Repository | `lib/repositories/` | data access only; extends the house `BaseRepository` (see `repo-extend-baserepository`) |
| Domain | `lib/domain/` | aggregates + value objects — pure classes with invariants (see `aggregate-write-model`) |
| Commands | `lib/commands/` | bare imperative Command classes — the write intents dispatched on the bus (see `message-bus-and-handlers`) |
| Events | `lib/events/` | bare past-tense Domain Event classes an aggregate raises |
| Handlers | `lib/handlers/` | command + event handler **functions** `(deps) => (message) => result`, registered on the bus at the `bootstrap` |
| Service | `lib/services/` | business logic; returns domain rows/objects |
| Declared types | `lib/types/` | interfaces + type aliases — service DTOs, port/seam interfaces, value types |
| Helpers | `lib/utils/` | stateless pure functions + self-contained value classes |
| Transport (**not** a logic layer) | `hono/` | `OpenAPIHono` app, routes, per-request DI, per-request DB-client build |

In `lib/`, a **declared type** (interface or type alias) lives in `lib/types/`, and a **stateless helper** — a pure function, or a self-contained value class with no I/O and no injected dependency — lives in `lib/utils/`. One file per responsibility, each folder with an `index.ts` barrel, a test co-located with the helper it exercises. Those two names are the **only** sanctioned buckets: never a synonym (`helpers/`, `util/`, `shared/`, `common/`, `misc/`) and never a per-concept `lib/<concern>/` folder (no `auth/`, `money/`, …) — a concept's types go to `types/`, its helpers to `utils/`. The same flat split holds in a `<worker>` app (`src/utils/` beside role folders like `routes/`, `services/`, `middlewares/`). This governs backend code; a frontend app follows its own layout.

**Two exceptions — a type inseparable from its owner stays with the owner:** a class's own DI interface (`I<entity>Service` / `I<entity>Repository`) stays in the class file (the seam a test fakes, see `di-plain-construction`), and a schema-derived row type (`typeof table.$inferSelect`, drizzle-zod types) stays in `lib/db/` because it *is* the schema. Everything else is a declared type in `lib/types/`; a port's **implementation** follows its dependencies — a pure domain class into a logic layer, an infra adapter that needs a binding into the transport.

**Incorrect — an upward arrow, or a mis-homed type:**
```ts
// lib/repositories/<entity>-repository.ts
import { <Entity>Service } from '../services/<entity>-service.js';   // 🔴 repository importing a service — arrow points up
import { OpenAPIHono } from '@hono/zod-openapi';                     // 🔴 an HTTP framework in a logic layer
// lib/services/<entity>-service.ts
export interface Create<Entity>Input { /* … */ }                     // 🔴 a declared type outside lib/types/
// lib/money/money.ts                                                // 🔴 a per-concept folder
```

**Correct — downward-only logic; flat `types/` + `utils/`:**
```ts
// lib/services/<entity>-service.ts — depends on the repository interface; nothing depends upward
export class <Entity>Service implements I<Entity>Service {
  constructor(private readonly repo: I<Entity>Repository) {}
}
// lib/types/create-<entity>-input.ts   → Create<Entity>Input   (a DTO / port / value type is a declared type)
// lib/utils/amount.ts                  → class Amount           (pure value class)
```
A service returns domain rows/objects; the public projection is the **derived** DTO applied at the route boundary, not a hand-written per-entity mapper (see `contract-derive-schema`).

Reference: see `bounded-context-transport-agnostic` · `hono-openapi-routes` · `naming-backend-layers` · `contract-derive-schema` · `aggregate-write-model` · `di-plain-construction`
