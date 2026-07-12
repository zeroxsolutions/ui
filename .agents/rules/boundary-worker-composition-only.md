## Keep Worker Apps Thin Deployment Shells; the Edge Gateway Is the One Composition Tier
`[HIGH]` `boundary-worker-composition-only`

A deployable worker app holds **only deployment wiring**: its `wrangler.jsonc` (bindings, env split, triggers) and a `main.ts` that **re-exports the transport its package already built** — `export default app` (and `export default { fetch, scheduled, queue }` once it has those handlers). Everything else — the Hono transport (routes, middleware, per-invocation DI wiring) **and** the business logic (aggregates, value objects, services, repositories, schema, ports) — lives in the `<domain>` package, not in the app. The worker names platform services as bindings; the package consumes them through the injected client.

The **edge gateway** (`*-gateway`) is the **edge composition tier (a BFF)** — and it obeys the thin-shell rule like every other worker. Because it fronts *many* services, no single domain package owns its wiring, so its composition lives in its **own dedicated composition package** (`packages/<gateway>` — a non-domain package, concrete name in `CLAUDE.md`) that builds the `OpenAPIHono` app + routes + the edge cross-cutting layers and exports `app` + its `XxxApp` type; the `*-gateway` worker re-exports that `app` (`export default app`) exactly as a `*-service` worker re-exports its domain package. The gateway is special in **what** it holds, not **where**: it owns and implements the client-facing API, assembling each endpoint from the services it fronts with **whatever logic that composition needs** — call one service or several, aggregate, orchestrate, decide, guard, reshape, validate (open-ended, never a fixed menu). The cross-cutting layers run once at the edge: the auth gate, session/context resolution, RBAC, the central error map, CORS, and the client-facing OpenAPI it owns and **emits from its own `OpenAPIHono`** — so a spec-distribution package can generate the document by **importing the composition package** (a forward dependency), never by importing the deployable app. It is **not a proxy** — a 1:1 forward is only the degenerate case; it also owns the wire standard's heavier surface (the compound-document `included`, the relationship endpoints, the atomic-operations extension), composing it at the edge.

The gateway has exactly **one boundary**: it reaches domain data only through a service's own API — typed `hc<XxxApp>` over the service binding, **never another service's database** — and it carries **no single bounded context's domain logic**, which stays in the owning service. "No domain logic" is not "no logic": composing the services it fronts is precisely the gateway's job.

**Incorrect — transport or branching logic built inside a `*-service` app:**
```ts
// apps/<domain>-service/src/main.ts
const app = new OpenAPIHono();                                        // 🔴 building transport in the app
app.openapi(route, async (c) => { /* query DB, branch, compute … */ });  // 🔴 domain logic in the deployable
```

**Correct — the package owns the app + logic; the worker re-exports:**
```ts
// apps/<domain>-service/src/main.ts — the whole file
import { app } from '@scope/<domain>';   // the package built the OpenAPIHono app + wired DI
export default app;                        // wrangler.jsonc declares the bindings

// apps/<gateway>/src/main.ts — the whole file (identical shape; the gateway is not a carve-out)
import { app } from '@scope/<gateway>';   // the composition package built the OpenAPIHono app + edge layers
export default app;                        // wrangler.jsonc declares the service bindings it fronts
```

**Rules of thumb:**
- A `*-service` / `*-cron` / `*-queue` worker is `main.ts` (`export default`) + `wrangler.jsonc` — no `OpenAPIHono`, no routes, no branching logic; its package keeps transport in `hono/` and logic in `lib/`.
- The edge gateway is the BFF **and** a thin-shell worker: its composition lives in its own non-domain composition package (`packages/<gateway>`) and the `*-gateway` worker just re-exports that `app`; it composes the services it fronts over their typed `hc<XxxApp>` APIs — never their databases — and holds no bounded context's own domain logic.
- A worker keeps its role name even after it gains `scheduled` / `queue` handlers (see `naming-projects`).

**Why:**
- Keeping every `*-service` / `*-cron` / `*-queue` deployable a thin shell means the same package (logic + typed Hono app) is reused and unit-tested off-runtime, and each service exposes an `hc<XxxApp>` surface for RPC.
- A client-facing endpoint is often not 1:1 with any one service, so composing several behind one stable, client-shaped contract is the edge tier's job; forcing the gateway to be a dumb proxy would push that composition into the client or duplicate it across services.
- Housing the gateway's composition in a package (not the deployable) makes it uniform with every worker, unit-testable off-runtime, and lets a spec-distribution package emit the client-facing OpenAPI by **importing** it — a forward package dependency, never a package importing an app.

Reference: see `bounded-context-transport-agnostic` · `hono-openapi-routes` · `trigger-thin-handlers` · `bindings-not-endpoints` · `mw-single-global-gate-per-route-rbac`
