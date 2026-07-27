## Derive Every Wire Shape From the Domain Schema; the Contract Leads the Implementation
`[HIGH]` `contract-derive-schema`

Author each entity's shape **once, in the owning domain** - the row schema at the data layer
(responses) and the request schema beside its transport (inputs) - and **derive every
client-facing wire shape from it, never re-declare it by hand**. A "wire shape" is **both
directions**: the response attributes a client reads AND the request body a client writes. Both
derive from the **owning domain's exported schema** - the row schema
(`createSelectSchema(<entity>Table)`) for a response, the domain's exported request schema for a
request body - via `.pick()` / `.omit()`, re-exporting the domain's transport DTO when the shape is
identical. **Never hand-re-declare a shape the domain already exports**: if `@scope/<domain>`
exports a `<entity>RequestSchema` or a response DTO, the contract package reuses it - typically
`.omit()`-ing only the server-set fields the client cannot send (the write `actorId`, tenancy,
audit; see `mw-scope-in-path-actor-in-command`). **Hand-author in the contract package only a
composed projection no single domain owns** (e.g. a totals endpoint aggregating two services), and
even then reuse each component domain's exported schema for the leaves. The contract package
(`<surface>-api-specs`, e.g. `api-specs`; see `contract-hc-and-codegen`) owns these client-facing
wire schemas + route definitions; the gateway composition package imports them, binds its
composition handlers, and the contract package emits the OpenAPI document from its `specApp`. The
JSON:API v1.1 envelope around the attributes - the resource object `{ type, id, relationships,
links }`, the `data` / `errors` / `included` top level, pagination `links` - is **generic machinery
from the shared JSON:API toolkit** (`@scope/jsonapi`; see `CLAUDE.md`), applied once, not restated
per entity. So the one shape flows domain schema -> (`.omit` / `.pick`) -> contract wire schema ->
gateway `attributes` / request body; a renamed column or a changed request field fails the build at
every derive site.

The project is **specs-first (see `CLAUDE.md`)**, so a shape change moves in **one direction**:
edit the domain schema and its derived contract projection / route defs **first**, then bring the
gateway handlers and `<domain>` services in line. The contract leads; the implementation follows.
Deriving needs a single shared validator instance (one pinned Zod, extended once with `.openapi()`)
so refinements compose - and because `.omit()` runs on a `ZodObject` (not on the `ZodEffects` a
`.refine()` produces), a derived request body needs the domain's **pre-refine base object** (or the
refine exported as a reusable function), never a re-typed copy of it. Verify that wiring, don't
assume it.

**Incorrect - a wire shape re-declares the domain schema by hand (response OR request):**
```ts
// hand-mirrored client attributes - a parallel source of truth that drifts
// the moment a column is renamed, silently keeping the old shape:
export const <entity>Attributes = z.object({          // re-states row fields by hand
  id: z.string(), name: z.string(), slug: z.string(),
});
// hand-mirrored create body - duplicates the domain's request schema minus the server-set actorId:
export const create<Entity>RequestSchema = z.object({  // re-states request fields the domain already exports
  name: z.string(), slug: z.string(),
}).refine((b) => mutualExclusion(b), { ... });          // refine re-typed too
```

**Correct - derive both directions from the domain's exported schema:**
```ts
// response: the resource attributes are a projection off the row schema - no field re-typed:
export const <entity>Attributes = <entity>SelectSchema.omit({ consentAgeThreshold: true });
// request: reuse the domain's exported request schema, .omit()-ing only the server-set fields.
// The domain exports the base object (pre-refine) + the refine as a reusable function, so the
// refine composes once and is not copied:
export const create<Entity>RequestSchema =
  withSubIdMutex(create<Entity>RequestBaseSchema.omit({ actorId: true }));
// the generic document wrapper (@scope/jsonapi) adds type/id/relationships:
export const <entity>Document = jsonApiDocument(<entity>Attributes, { type: '<entity>s' });
```

A single declaration can't drift: a renamed column OR a changed request field updates every derived
shape and the compiler flags each call site, so divergence surfaces at the build instead of in
production - and a constraint added to the domain schema (a `.max()`, a `varchar(N)`, an enum) flows
to the wire automatically, which is what makes the contract declare what the server actually
enforces.

Reference: [Zod - omit/pick](https://zod.dev/?id=objects), [drizzle-zod - createSelectSchema](https://orm.drizzle.team/docs/zod), see `boundary-worker-composition-only`, `contract-hc-and-codegen`, `hono-openapi-routes`, `mw-scope-in-path-actor-in-command`, `naming-backend-layers`, `structure-lib-layers`, `id-uuidv7-brand-typeid-wire`
