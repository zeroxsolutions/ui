## Define Every Route OpenAPI-First on the Package's `OpenAPIHono`, With Thin Handlers
`[HIGH]` `hono-openapi-routes`

Write HTTP routes and middleware with **Hono**, defined **OpenAPI-first** via **`@hono/zod-openapi`**. Declare each route as `createRoute({ method, path, request, responses })` and attach it with `.openapi(route, handler)` on the package's `OpenAPIHono` under `hono/routes/` — never a bare `app.get()`, which is invisible to the spec. Request/response schemas reuse the derived contract schemas (see `contract-derive-schema`), not a re-declared shape. Mount a **Scalar** reference at `/scalar` with the spec at `/doc`, and register the `Bearer` security scheme once. Each package exports `app` + `AppType` for `hc` RPC; the `<worker>` re-exports it (see `bounded-context-transport-agnostic`).

Keep **handlers thin** — no business logic. A read handler pulls the per-invocation query surface, calls `findOne` / `findAll`, and serializes the row(s); a write handler builds a **Command** and dispatches it on the in-process message bus (see `message-bus-and-handlers`). Everything the handler resolves is wired by plain construction at a per-invocation bootstrap (see `di-plain-construction`); logic lives in the package's `lib/` services/repositories (see `structure-lib-layers`).

Responses follow the wire standard (this project's choice — full JSON:API v1.1; see `CLAUDE.md`): a route returns a **document** — the generic wrapper from the shared `@scope/jsonapi` toolkit around the **derived** resource attributes — `{ data: resourceObject }` for a single read, `{ data: [...], links, meta }` for a list, `{ errors: [...] }` on failure (rendered centrally, see `error-domain-code-gateway-maps`); never a bare or ad-hoc body. A **list** route declares the standard query families — `page[offset]`/`page[limit]`, `sort`, `filter`, `fields[TYPE]`, `include` — validated against a per-entity filterable/sortable **whitelist** (see `repo-extend-baserepository`). **Content negotiation** (415 on a parameterized request media type, 406 when every `Accept` is parameterized, 400 on an ill-named query param) runs as **one middleware from `@scope/jsonapi`**, not per handler.

**Incorrect — a bare route the spec can't see, logic inline:**
```ts
app.get('/classes', async (c) => { /* query DB + business logic here */ });   // 🔴 fat, un-speced, ad-hoc body
```

**Correct — route def + thin handler returning a contract document:**
```ts
// packages/<domain>/src/hono/routes/classes.ts
classesRoutes.openapi(listClassesRoute, async (c) => {              // declares page/sort/filter/fields/include
  const [rows, total] = await c.get('read').classes.findAll(c.req.valid('query'));
  return c.json(serializeClasses(rows, { total }));                // { data: [...], links, meta } — @scope/jsonapi wrapper
});
// a write handler builds a Command and hands it to the bus instead — see message-bus-and-handlers
```

**Rules of thumb:**
- One `createRoute` def per endpoint on the package's `OpenAPIHono`; a bare `app.get()` is forbidden — invisible to the spec, it drifts silently.
- Docs (`/doc`, `/scalar`) are public, registered before the auth gate (see `mw-single-global-gate-per-route-rbac`).
- Scope lives in the **path** — org-scoped under `/orgs/:orgId/…`, user-scoped under `/users/:userId/…`, names from the domain's ubiquitous language; a write's **actor** is a Command field, not a path segment (see `mw-scope-in-path-actor-in-command`).

**Why:**
- If the spec is the contract, a route the spec can't see doesn't exist to consumers; OpenAPI-first defs plus thin handlers keep the contract and the logic separable and testable, and a standard document format keeps every response shape uniform without a per-entity envelope.

Reference: [Hono zod-openapi](https://hono.dev/examples/zod-openapi) · see `bounded-context-transport-agnostic` · `message-bus-and-handlers` · `contract-derive-schema` · `error-domain-code-gateway-maps` · `mw-single-global-gate-per-route-rbac` · `mw-scope-in-path-actor-in-command`
