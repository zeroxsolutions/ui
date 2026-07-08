## Derive Every Wire Shape From the Row Schema; the Contract Leads the Implementation
`[HIGH]` `contract-derive-schema`

Author each entity's shape **once, at the data layer**, and **derive every wire shape from it — never re-declare it by hand**. When the row schema is defined with an ORM that emits validators (drizzle-zod's `createSelectSchema`), a `<domain>` package projects its **service-internal** transport DTO — the `hc<XxxApp>` surface — off its **own** row schema with `.omit()` / `.pick()`, dropping internal columns (tenancy, audit, soft-delete), and homes that derived DTO beside the transport in `hono/schema/`. The **client-facing** contract derives the same way: the edge gateway owns the client-facing route defs and emits the one OpenAPI document from its own `OpenAPIHono` (see `boundary-worker-composition-only`), and a resource object's **`attributes` are the derived DTO** — a re-export of the owning domain's transport DTO when identical, a `.pick`/`.omit` for a subset. The JSON:API v1.1 envelope around those attributes — the resource object `{ type, id, relationships, links }`, the `data` / `errors` / `included` top level, pagination `links` — is **generic machinery from the shared JSON:API toolkit** (`@scope/jsonapi`; see `CLAUDE.md`), applied once, not restated per entity. So the one shape flows row schema → service DTO → the gateway's resource `attributes`; a renamed column fails the build at each derive site.

The project is **specs-first (see `CLAUDE.md`)**, so a shape change moves in **one direction**: edit the data-layer row schema and its derived contract projection / route defs **first**, then bring the gateway handlers and `<domain>` services in line. The contract leads; the implementation follows. Deriving needs a single shared validator instance (one pinned Zod, extended once with `.openapi()`) so refinements compose — verify that wiring, don't assume it.

**Incorrect — a wire shape re-declares the row by hand:**
```ts
// hand-mirrored client attributes — a parallel source of truth that drifts
// the moment a column is renamed, silently keeping the old shape:
export const <entity>Attributes = z.object({          // 🔴 restates row fields by hand
  id: z.string(), name: z.string(), slug: z.string(),
  defaultCurrency: z.string(), timezone: z.string(), locale: z.string(),
});
```

**Correct — derive the attributes from the row schema; wrap with generic machinery:**
```ts
// data layer owns the one shape:
export const <entity>SelectSchema = createSelectSchema(<entity>Table).omit(defaultSelectOmit);
// the resource attributes are a projection off it — no field re-typed:
export const <entity>Attributes = <entity>SelectSchema.omit({ consentAgeThreshold: true });  // ✅
// the generic document wrapper (@scope/jsonapi) adds type/id/relationships:
export const <entity>Document = jsonApiDocument(<entity>Attributes, { type: '<entity>s' });
```

A single declaration can't drift: a renamed column updates every derived shape and the compiler flags each call site that must change, so divergence surfaces at the build instead of in production.

Reference: [Zod — omit/pick](https://zod.dev/?id=objects) · [drizzle-zod — createSelectSchema](https://orm.drizzle.team/docs/zod) · see `boundary-worker-composition-only` · `contract-hc-and-codegen` · `hono-openapi-routes` · `naming-backend-layers` · `structure-lib-layers`
