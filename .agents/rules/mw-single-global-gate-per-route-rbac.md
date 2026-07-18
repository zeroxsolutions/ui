## Gate Auth Once Globally, Public Docs First; Enforce RBAC at the Gateway
`[HIGH]` `mw-single-global-gate-per-route-rbac`

In the edge gateway's `app.ts`, Hono runs middleware by **registration order**, and a sub-app's `use('*', ...)` mounted at `app.route('/', sub)` matches **every** path registered *after* it - including sibling groups and `/doc`. So **never scatter `use('*', auth())`** per group: each group's wildcard leaks onto the others and onto the public docs, which then 401. Compose the gate **once**, in this order: (1) `app.use('*', cors())`; (2) the **public** surface - `app.doc('/doc')` + the Scalar reference at `/scalar` (+ health) - before any auth; (3) per-request dependency wiring - the auth verifier plus the typed `hc` clients to the owning services the gate reads context from (the gateway holds **no database of its own**; each `*-service` builds its own DB client - see `db-per-service`); (4) `app.use('*', auth())` then the session resolver, the **one** global authentication gate; (5) the protected proxied groups, which carry no `auth()` of their own. That gate resolves the caller's context - identity, requested org, permissions - from the owning service **once** and validates their membership in the requested org, taken from the `:orgId` path segment, never a client header (see `mw-scope-in-path-actor-in-command`).

**Authorization (RBAC) is enforced at the gateway, per route** - it is the single ingress and the only tier holding the caller's resolved permissions. The gateway fronts the internal `*-service` workers by proxying (see `boundary-worker-composition-only`), so the guard attaches to the gateway's **proxy registration**, never a service handler. A downstream service holds **no** `requirePermission`: it is private, reachable only over its service binding (see `worker-wrangler-config`), and **trusts** the gateway's decision. Tenancy and identity flow as request structure, not forwarded headers - the tenant as the **`:orgId` path scope** the gateway validates once, and a write's actor as a **command field** the gateway sets (see `mw-scope-in-path-actor-in-command`); the gateway forwards **no** permission list. Fine-grained, data-scoped authorization (ownership, "only your own rows") stays in the **service** logic keyed on that path org scope, not a permission string.

The guard is **variadic - every listed permission required (AND)** - so one function, one call shape whether an endpoint needs one permission or several. `requirePermission(...permissions: string[])` checks every listed permission is in the caller's resolved set; add a sibling `requireAnyPermission(...)` only when a genuine OR-endpoint appears.

```ts
requirePermission('<entity>:manage')                     // one
requirePermission('<entity>:manage', '<other>:manage')   // AND - all required; 403 if any missing
```

**Incorrect - a wildcard gate that leaks, or RBAC in the service handler:**
```ts
<domain>Routes.use('*', auth());   // 🔴 leaks onto siblings + public /doc -> 401
// a service's own hono/routes handler carrying requirePermission   // 🔴 authz duplicated per service; the gateway already holds the permissions
```

**Correct - one gate after public docs; RBAC at the gateway proxy; the service trusts:**
```ts
// gateway: guard at the proxy registration - only an authorized request is forwarded
<domain>Routes.openapi(
  { ...create<Entity>Route, middleware: [requirePermission('<entity>:manage')] },
  proxy,
);
// service: handler only - no requirePermission; org-scoped by the `:orgId` path param
```

**Rules of thumb:**
- Authenticate once, globally, after the public docs; enforce RBAC **at the gateway**, per proxied route.
- `requirePermission(...perms)` is variadic (AND) - one guard, one call shape for one-or-many permissions.
- Downstream services carry no `requirePermission` - private + binding-only, they trust the gateway; tenancy/identity travel as **path scope + a command actor field**, never forwarded headers, never the permission list.
- Coarse RBAC (permission strings) -> gateway; fine / data authz (ownership, tenancy) -> service logic on the path org scope.

**Why:**
- A wildcard sub-app gate matches everything registered after it, so "per group" auth silently becomes "every request, including public docs" - one composed gate is the only way to keep the docs public and the rest closed.
- The gateway is the single ingress and the only tier holding the caller's resolved permissions, so enforcing RBAC there keeps one decision point instead of copy-pasting the guard into every service.

Reference: see `mw-scope-in-path-actor-in-command`, `auth-verify-server-side`, `hono-openapi-routes`, `boundary-worker-composition-only`, `worker-wrangler-config`, `db-client-per-invocation`
