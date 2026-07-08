## Address Tenancy and User-Scope in the URL Path; Carry the Actor as a Command Field
`[HIGH]` `mw-scope-in-path-actor-in-command`

Identity and tenancy flow by **where they belong in the request**, not as forwarded headers. The **tenant** (the org that owns the data) and any **user-scoped resource** are addressed as **URL path segments** — `/orgs/:orgId/…`, `/users/:userId/…` — on **both** the client-facing contract and the internal service contract. The **actor** (the authenticated caller, needed for write attribution — `created_by`, own-rows) rides as a **field of the write Command** the gateway composes for the internal call — never a path segment and never a forwarded identity header. A resource is contained by its tenant, not by its caller, so nesting it under the actor is a containment lie; and the actor is application/command context, extracted at the entrypoint and passed into the write model as a Command field (Cosmic Python service layer), not a domain resource.

A service reads the scope from **path params natively** — no per-service header-parsing middleware — and the actor from the Command; a cross-service call propagates scope as **typed `hc` path params** (compile-time-checked, not a stringly header contract). The client-supplied `:orgId` is **untrusted**: the gateway validates the caller's membership once, in its context resolution, before acting — an explicit path segment does not make the value trusted, and the gateway stays the single enforcement point.

**Incorrect — identity/tenancy smuggled through forwarded headers + re-parsed per service:**
```ts
// gateway forwards "trusted" identity headers
req.headers.set('X-User-Id', userId); req.headers.set('X-Active-Org', orgId);   // 🔴 header-forwarding
// every service re-parses the same headers
app.use('*', resolveContext());                        // 🔴 duplicated header-parsing middleware
const orgId = c.req.header('X-Active-Org');
```

**Correct — tenant + user-scope in the path, actor in the command:**
```ts
// client → gateway AND gateway → service: scope lives in the path
GET  /orgs/:orgId/classes                    // tenant scope — cacheable per-org
GET  /users/:userId/enrollments              // user-scoped resource
// a write: the gateway composes the internal command, actor is a server-set field
POST /orgs/:orgId/classes   { ...class, actorId }      // ✅ actor = command field (never client-set)
// service reads scope natively — no header middleware
const { orgId } = c.req.param();
// cross-service over a binding: scope travels as typed hc path params
await hc<XxxApp>(url, { fetch }).orgs[':orgId'].classes.$get({ param: { orgId } });
```

**Rules of thumb:**
- Tenant (`orgs`) + user-scoped resource (`users`) → **path**, on both contracts; resource names come from the domain's ubiquitous language, never security jargon (`principals`, `subjects`).
- Actor (write attribution) → a **field of the write Command** the gateway sets; the client shape never carries it (the client can't declare who acted).
- No forwarded identity headers and no per-service header-parsing middleware — a service reads path params plus the Command's actor field.
- The client-supplied `:orgId` is validated at the gateway (membership) before use; explicit ≠ trusted; the gateway is the single enforcement point.

**Why:**
- Path-scoped tenancy gives a tenant-safe cache key, a self-contained (bookmarkable) request, an injection-free internal URL the gateway builds itself, and a compile-time-checked cross-service contract — while deleting the per-service header-name convention and the duplicated context-parsing middleware.

Reference: [DDD — ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) · [Cosmic Python — Service Layer](https://www.cosmicpython.com/book/chapter_04_service_layer.html) · see `mw-single-global-gate-per-route-rbac` · `hono-openapi-routes` · `contract-hc-and-codegen` · `naming-backend-layers`
