## Type Service-to-Service Callers With `hc`; Generate Edge-Gateway Clients From the Contract Package
`[HIGH]` `contract-hc-and-codegen`

A consumer never hand-rolls a `fetch` with a hardcoded path and a re-declared response parser - the typed contract takes **one of two shapes, by who is calling whom**. A **service-to-service** call (one worker calling a sibling `*-service` over a Cloudflare **service binding**) uses `hc<XxxApp>`: each domain package exports `export type XxxApp = typeof app`, and the caller builds `hc<XxxApp>(url, { fetch: binding.fetch.bind(binding) })`, so types flow at compile time for code you deploy together. A **client of the edge gateway** - a browser client or any out-of-repo / polyglot consumer - gets **no app type**: the gateway composes many services behind one client-facing contract with no single `app`, so the client is **generated from the client-facing OpenAPI SSOT** owned by the **spec-first contract package** (`<surface>-api-specs`, e.g. `api-specs` for the main surface). That package authors the route definitions + wire schemas, the gateway imports and implements them, and the contract package emits the OpenAPI document from its `specApp`; the codegen reads a **committed emission** of that document (not the live endpoint; see `CLAUDE.md`), producing types + data-fetching hooks, and regenerates on every contract change so it can't drift.

The contract package is a **real, generated workspace project**: produced by the project generator (never a hand-created folder), with a build target + an `exports` map (exposing `./openapi.json`), versioned, and publishable - so out-of-repo consumers reach the doc through its package interface, and the in-repo codegen reads its committed `openapi.json` (a spec-file path is codegen's universal input shape). The "fictional package" defect was that the package had no build target and was hand-created - NOT that a codegen reads a committed file path; the fix is the package being real, not routing the codegen through package resolution. **Each gateway surface owns its own contract package** (main `api-specs`, a second surface's `<surface>-api-specs`); the contract is never duplicated across packages. Both the S2S and client-facing wire shapes derive from the row schema (see `contract-derive-schema`) - derived (`.pick`/`.omit`) when the wire approximates a row, authored in the contract package when it is a composed projection. The generated client **consumes the wire document at one boundary** - a thin codegen mutator that attaches auth and surfaces a non-2xx as an error, adding **no bespoke deserialize/flatten/re-parse layer** and re-declaring no parser - and its output is client-safe: a browser client never pulls server-only contract or DB runtime into its bundle. S2S scope travels as **typed `hc` path params** - the tenant `:orgId`, a user-scoped `:userId` - never a forwarded header; a write's actor is a command field (see `mw-scope-in-path-actor-in-command`).

**Drift between the contract and the code is blocked in CI**, not left to convention: CI re-emits the spec and fails on a non-empty `git diff --exit-code`; the spec is linted (Spectral: operationId present, responses described, security on sensitive endpoints); and a breaking-change detector (`oasdiff`) blocks a PR that removes a field, changes a type, or adds a required field without a major bump.

**Incorrect - an untyped S2S fetch, a client coupling to a service's internals, or a hand-maintained spec:**
```ts
const res = await c.env.DOMAIN_SERVICE.fetch('http://domain/orgs/x/entities'); // 🔴 untyped S2S fetch; drifts from the service
import type { XxxApp } from '@scope/<domain>';   // 🔴 an edge-gateway client binding to a service's internal app type
const data = await apiFetch('/me', { parse: (d) => meResponseSchema.parse(d) }); // 🔴 hand-maintained path + re-declared parser
```

**Correct - `hc<XxxApp>` for S2S; a generated contract package + a generated client for the edge gateway:**
```ts
// service -> sibling service: typed hc over the service binding
export type XxxApp = typeof app;                 // packages/<domain>/src/hono/app.ts
const domain = hc<XxxApp>('http://domain', { fetch: c.env.DOMAIN_SERVICE.fetch.bind(c.env.DOMAIN_SERVICE) });
const rows = await (await domain.orgs[':orgId'].entities.$get({ param: { orgId } })).json(); // scope = typed path params
// contract package owns the client-facing SSOT the gateway implements and the client codegens from:
// packages/<surface>-api-specs/src/routes + /src/schema + createSpecApp().getOpenAPI31Document(...)
// browser client / external client -> edge gateway: types + hooks generated from the committed openapi.json
import { useMe } from '<generated-client>';      // regenerated whenever the contract changes
```

Reference: [Hono RPC `hc`](https://hono.dev/docs/guides/rpc), [OpenAPI Specification](https://spec.openapis.org/oas/latest.html), [Spectral](https://docs.stoplight.io/docs/spectral), [oasdiff](https://github.com/oasdiff/oasdiff), see `contract-derive-schema`, `boundary-worker-composition-only`, `mw-scope-in-path-actor-in-command`
