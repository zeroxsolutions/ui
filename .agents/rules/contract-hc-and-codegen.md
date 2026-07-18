## Type Service-to-Service Callers With `hc`; Generate Edge-Gateway Clients From OpenAPI
`[HIGH]` `contract-hc-and-codegen`

A consumer never hand-rolls a `fetch` with a hardcoded path and a re-declared response parser - the typed contract takes **one of two shapes, by who is calling whom**. A **service-to-service** call (one worker calling a sibling `*-service` over a Cloudflare **service binding**) uses `hc<XxxApp>`: each domain package exports `export type XxxApp = typeof app`, and the caller builds `hc<XxxApp>(url, { fetch: binding.fetch.bind(binding) })`, so types flow at compile time for code you deploy together. A **client of the edge gateway** - a browser client or any out-of-repo / polyglot consumer - gets **no app type**: the gateway composes many services behind one client-facing contract with no single `app`, so the client is **generated from the client-facing OpenAPI SSOT** - the document the edge gateway owns and emits - with the repo's chosen codegen tool reading a **committed emission** of that document (not the live endpoint; see `CLAUDE.md`), producing types + data-fetching hooks. It binds to no internal app type and no hand-maintained path, and regenerates on every contract change so it can't drift.

Both surfaces derive from **one source**: the S2S shape is the service's row-schema-derived DTO; the client-facing shape is the gateway's resource `attributes`, derived from that same DTO (see `contract-derive-schema`). The generated client **consumes the wire document at one boundary** - a thin codegen mutator that attaches auth and surfaces a non-2xx as an error, adding **no bespoke deserialize/flatten/re-parse layer** and re-declaring no parser - and its output is client-safe: a browser client never pulls server-only contract or DB runtime into its bundle. S2S scope travels as **typed `hc` path params** - the tenant `:orgId`, a user-scoped `:userId` - never a forwarded header; a write's actor is a command field (see `mw-scope-in-path-actor-in-command`).

**Incorrect - an untyped S2S fetch, or a client coupling to a service's internals:**
```ts
const res = await c.env.DOMAIN_SERVICE.fetch('http://domain/orgs/x/entities'); // 🔴 untyped S2S fetch; drifts from the service
import type { XxxApp } from '@scope/<domain>';   // 🔴 an edge-gateway client binding to a service's internal app type
const data = await apiFetch('/me', { parse: (d) => meResponseSchema.parse(d) }); // 🔴 hand-maintained path + re-declared parser
```

**Correct - `hc<XxxApp>` for S2S; a generated client for the edge gateway:**
```ts
// service -> sibling service: typed hc over the service binding
export type XxxApp = typeof app;                 // packages/<domain>/src/hono/app.ts
const domain = hc<XxxApp>('http://domain', { fetch: c.env.DOMAIN_SERVICE.fetch.bind(c.env.DOMAIN_SERVICE) });
const rows = await (await domain.orgs[':orgId'].entities.$get({ param: { orgId } })).json(); // scope = typed path params
// browser client / external client -> edge gateway: types + hooks generated from the client-facing OpenAPI SSOT
import { useMe } from '<generated-client>';      // regenerated whenever the contract changes
```

Reference: [Hono RPC `hc`](https://hono.dev/docs/guides/rpc), [OpenAPI Specification](https://spec.openapis.org/oas/latest.html), see `contract-derive-schema`, `mw-scope-in-path-actor-in-command`
