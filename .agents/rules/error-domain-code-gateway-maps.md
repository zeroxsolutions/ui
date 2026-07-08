## Raise a `DomainError` With a Registry Code; Map It to the Wire Once in the Gateway's `onError`
`[HIGH]` `error-domain-code-gateway-maps`

Domain code — aggregates, value objects, command/event handlers, services — raises a **`DomainError`** (base from the house domain toolkit; see `CLAUDE.md`) carrying a registry **`code`** + message; it knows nothing about HTTP or the wire format and MUST NOT construct or throw a wire-format error (`JsonApiError`). An error a caller **branches on** MAY be a specific `DomainError` subclass; the base with a code covers the rest. A new code adds a **registry entry** (`code → { status, title, source? }`), never a new per-handler payload.

Map failures **centrally** — a single `app.onError`, never per handler — that turns raised `DomainError`s (and framework/unexpected errors) into a consistent HTTP status + one standard error document. That document is full JSON:API v1.1 (see `CLAUDE.md`): `{ errors: [ { status, code, title, detail, source? } ] }`, built by the shared `@scope/jsonapi` `errors[]` builder off the `code → { status, title }` registry. Handlers stay thin and let `onError` render the document; multi-field validation renders **one entry per field** with `source.pointer` = the field's JSON Pointer.

At the **edge gateway** this same `onError` renders the document and **preserves the upstream service's error objects** — it MUST NOT collapse them to a bare `message` — and MAY set `errors[].id` to the request id. A `*-cron` / `*-queue` entrypoint applies the same discipline: services throw, the entrypoint hand-crafts no error JSON.

**Incorrect — the wire error thrown in the domain, or an upstream error flattened at the gateway:**
```ts
// lib/<domain>/<entity>.ts — domain code coupled to the wire format
if (this.isFull()) throw new JsonApiError(409, 'Class is at capacity');   // 🔴 wire error inside the domain
// gateway onError collapsing an upstream service's errors[] to a bare message:
return c.json({ error: upstream.message }, 502);   // 🔴 drops the errors[] objects + their codes
```

**Correct — a `DomainError` with a code; the wire mapping happens once, at the edge:**
```ts
// lib/<domain>/<entity>.ts — knows no HTTP/JSON:API
export class ClassFull extends DomainError {
  constructor() { super('<domain>.class.full', 'Class is at capacity'); }   // caller may branch on the subclass
}
if (this.isFull()) throw new ClassFull();
// gateway src/app.ts — the one place that speaks JSON:API
app.onError((err, c) => renderErrors(err, c));   // registry code → { status, title, source }; preserves upstream errors[], stamps errors[].id
```
The `errors[]` builder and the `code → { status, title }` registry are shared machinery from `@scope/jsonapi` — never hand-assembled per route.

**Rules of thumb:**
- The domain/services raise a `DomainError` (or a caller-branchable subclass) with a registry `code` + message — never a wire (`JsonApiError`) or HTTP error in `lib/`.
- One `app.onError` owns status + body; the body is the JSON:API `errors[]` document from the shared toolkit; a new `DomainError` code adds a registry entry, not a per-handler payload.
- The gateway preserves upstream service error objects (never a bare `message`), may stamp `errors[].id` = request id; multi-field validation renders one entry per field with `source.pointer`.

**Why:**
- Keeping the wire format out of the domain lets `lib/` stay transport-agnostic and unit-testable and makes each error traceable to a domain condition; one central map is what makes every route return the identical error-document shape and keeps the machine `code`/`title`/`source` intact across the tier instead of evaporating to a message.

Reference: [Cosmic Python — domain modeling & exceptions](https://www.cosmicpython.com/book/chapter_01_domain_model.html) · see `bounded-context-transport-agnostic` · `lib-house-toolkits` · `hono-openapi-routes` · `boundary-worker-composition-only`
