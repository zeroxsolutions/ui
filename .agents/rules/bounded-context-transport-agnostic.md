## Split the Backend by Bounded Context; Keep Each Package's Logic Transport-Agnostic
`[HIGH]` `bounded-context-transport-agnostic`

The unit of the backend is the **bounded context**: one business domain = one `packages/<domain>` library **plus** one `apps/<domain>-service` thin worker (names in `CLAUDE.md`). Split by **domain**, never by **layer** — there is no `packages/repositories`, no one app owning every domain. A domain owns its schema, logic, transport, and its own database end-to-end; another domain reaches it **only** over a service binding via `hc<XxxApp>`, reading the DTO — never by importing its `lib/` or touching its tables.

Inside the package, keep the **logic layers transport-agnostic**: schema, repositories, services, aggregates and value objects, ports, and DB-client construction live under `lib/` and import **no HTTP framework and no runtime context** (`c.env`), so they unit-test without a platform runtime. **Co-locate the transport** under `hono/` — an `OpenAPIHono` app, its routes, and its request/response schemas — that adapts the logic and wires DI per invocation through a plain-construction bootstrap. The package exports both the `app` and `export type XxxApp = typeof app`.

The `apps/<domain>-service` worker is a **thin shell**: it re-exports the package's `app` and declares its bindings, including its own Neon-via-Hyperdrive database; it holds no logic. The edge gateway fronts these services for clients and owns no single domain.

**Incorrect — a framework/binding in a logic layer, or a domain reaching into another's internals:**
```ts
// lib/services/<entity>-service.ts
import { OpenAPIHono } from '@hono/zod-openapi';               // 🔴 HTTP framework in a logic layer
const db = drizzle(postgres(env.HYPERDRIVE.connectionString)); // 🔴 a runtime binding in a logic layer
import { StudentService } from '@scope/<other-domain>';        // 🔴 importing another domain's lib
```

**Correct — logic under `lib/` (Hono-free), transport under `hono/`, worker a thin shell:**
```ts
// packages/<domain>/src/lib/services/<entity>-service.ts — plain class, no Hono, no c.env
export class <Entity>Service implements I<Entity>Service { /* … */ }
// packages/<domain>/src/hono/app.ts — the package's transport: OpenAPIHono + routes + per-request bootstrap DI
export const app = new OpenAPIHono<Env>()/* … */;
export type <Xxx>App = typeof app;
// apps/<domain>-service/src/main.ts — the whole file
import { app } from '@scope/<domain>';
export default app;                                            // + wrangler.jsonc declares its own DB binding
```
A domain that needs another's data calls `hc<XxxApp>` over the service binding and reads the returned DTO — never a `lib/` import.

**Rules of thumb:**
- One context = one `packages/<domain>` + one `apps/<domain>-service`; split by domain, never by layer.
- `lib/` greps clean of any HTTP-framework import and any runtime binding (`c.env`); the `hono/` folder is where routes and per-request DI live.
- The package exports `app` + its `XxxApp` type; the worker is a thin `export default app` shell with only bindings/env, including its own database.
- Cross-domain access is only over a service binding via `hc<XxxApp>` (reading the DTO), never a `lib/` import or another domain's tables.

**Why:**
- A bounded context that owns its schema, logic, transport, and database is deployed, scaled, and reasoned about on its own; keeping the logic transport-agnostic and co-locating its Hono transport is what makes it unit-testable off-runtime and exposes a typed `hc<XxxApp>` surface for RPC. Splitting by layer couples every domain through one shared artifact and defeats the split.

Reference: see `structure-lib-layers` · `boundary-worker-composition-only` · `db-per-service` · `contract-hc-and-codegen` · `hono-openapi-routes` · `di-plain-construction`
