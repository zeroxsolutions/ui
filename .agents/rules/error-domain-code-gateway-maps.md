## Raise a Plain Typed Error in the Domain; Map It to the Wire by Type at Each Transport's `onError`
`[HIGH]` `error-domain-code-gateway-maps`

A failure raised anywhere in a bounded context's `lib/` (aggregate, value object, command/event handler, service, guard) is a **plain `Error` subclass** carrying only domain data - the offending id, field, or value. It carries **no** wire concern: no HTTP status, no wire `code` string, no JSON:API shape, and **no custom base** - and it MUST NOT construct or throw a wire-format error (`JsonApiError`). Each subclass exists so a transport (and any caller) can branch on the specific failure **by its type**; a shared/generic failure (e.g. a query-whitelist rejection) is a plain `Error` subclass in the house toolkit that raises it, mapped by type at the consuming service.

Each **transport** - a service's single `onError`, the edge gateway - owns a **type-keyed registry** mapping a concrete **error class -> `{ status, title, code? }`**, built with the shared `@scope/jsonapi` `defineErrorMap([[ErrorClass, meta], ...])` and resolved by `createDomainErrorResolver(registry)` (the `resolve` hook for `createJsonApiErrorHandler`). It resolves a raised error by its **constructor identity** (`registry.get(err.constructor)`), never by a field read off the error. **Registry membership is the sole discriminator**: a type in the registry -> its mapped status (+ code); any other error - a programming bug, or a domain error someone forgot to register -> a generic **500** with no leaked detail. A new domain error adds **one registry entry** keyed on its class, never a per-handler payload; a completeness test asserts every declared domain error class appears in a registry (else it 500s).

Map failures **centrally** - a single `app.onError` per transport, never per handler - rendering the one standard document: full JSON:API v1.1 (see `CLAUDE.md`) `{ errors: [ { status, code?, title, detail, source? } ] }`, built by the shared `@scope/jsonapi` machinery. The wire `code`, when emitted, is supplied by the transport's registry - an **edge presentation choice**, never declared by the domain; the default is **preserve** it, so existing clients keep branching on `errors[].code`. Handlers stay thin and let `onError` render; multi-field validation renders **one entry per field** with `source.pointer` = the field's JSON Pointer.

At the **edge gateway** this same `onError` maps the errors the gateway itself raises by type, and **preserves a fronted service's rendered error document** - a downstream error arrives as an already-serialized JSON:API document over `hc` (no live error instance crosses the hop), so the gateway forwards its error objects unchanged (never a bare `message`) and MAY stamp `errors[].id` = the request id; it MUST NOT re-map the document by type. A `*-consumer` / `*-job` entrypoint applies the same discipline: services throw, the entrypoint hand-crafts no error JSON.

**Incorrect - a based/coded or wire error in the domain, or an upstream error flattened at the gateway:**
```ts
// lib/<domain>/<entity>.ts - a wire concern in the domain
if (this.isFull()) throw new JsonApiError(409, 'Class is at capacity');       // 🔴 wire error inside the domain
export class ClassFull extends DomainError { constructor(){ super('class.full', '...'); } }  // 🔴 a custom base + wire `code` in the domain
return c.json({ error: upstream.message }, 502);   // 🔴 gateway drops the upstream errors[] objects + their codes
```

**Correct - a plain typed error; the transport maps it by type:**
```ts
// lib/<domain>/<entity>.ts - a plain Error: no code, no base, knows no HTTP/JSON:API
export class ClassFull extends Error { constructor(){ super('Class is at capacity'); } }   // caller branches on the type
if (this.isFull()) throw new ClassFull();
// hono/<domain>-error-map.ts - the transport owns the type -> wire table
export const <domain>ErrorRegistry = defineErrorMap([
  [ClassFull, { status: 409, title: 'Conflict', code: '<domain>.class.full' }],            // a new error = one entry here
]);
export const resolveDomainError = createDomainErrorResolver(<domain>ErrorRegistry);         // registry miss -> undefined -> generic 500
// hono/app.ts - one central onError per transport
app.onError(createJsonApiErrorHandler({ resolve: resolveDomainError }));
```

**Rules of thumb:**
- The domain/services raise a **plain `Error` subclass** with only domain data - no wire `code`, no custom base, never a `JsonApiError`/HTTP error in `lib/`.
- Each transport owns a **type-keyed registry** (`defineErrorMap`) resolved by constructor identity (`createDomainErrorResolver`); a new error adds one entry keyed on its class.
- **Registry membership is the discriminator** - a registered type -> its status (+ code); anything else -> a generic 500 (a completeness test guards a forgotten registration).
- One `app.onError` per transport owns status + body; the wire `code`, when present, comes from the registry (default preserved), never from the error.
- The gateway preserves a fronted service's rendered document (never re-maps by type, never a bare `message`), may stamp `errors[].id` = the request id; multi-field validation renders one entry per field with `source.pointer`.

**Why:**
- A domain error is a domain fact, not a wire token: keeping the `code`/status out of the domain lets `lib/` stay transport-agnostic and unit-testable, and corrects the dependency direction - the edge decides how an error looks on the wire. Mapping by **type** at one central `onError` keeps every route's error-document shape identical and lets a change of wire format touch only the transport's table, never the domain; and registry membership makes a forgotten error surface loudly as a 500 instead of masquerading as a lenient 4xx.

Reference: [Cosmic Python - domain modeling & exceptions](https://www.cosmicpython.com/book/chapter_01_domain_model.html), see `bounded-context-transport-agnostic`, `lib-house-toolkits`, `hono-openapi-routes`, `boundary-worker-composition-only`
