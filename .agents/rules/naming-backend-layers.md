## Name Every Backend Layer, Schema, and Read/Write Method by Its Role
`[MEDIUM]` `naming-backend-layers`

Backend files and directories are **kebab-case, suffixed by layer**, with one `index.ts` barrel per directory re-exporting that directory's public surface — so a glob on the suffix (`*-repository.ts`) finds every file of a layer. The logic layers live under `lib/`; the domain package's co-located `hono/` transport holds `routes/`, `middlewares/`, and `schema/`. Generic casing is `naming-files-and-symbols`; these are the backend layer names.

| Layer | File · class · interface | Example |
| --- | --- | --- |
| Repository (`lib/repositories/`) | `<entity>-repository.ts` · `<Entity>Repository` · `I<Entity>Repository` | `card-repository.ts` |
| Service (`lib/services/`) | `<entity>-service.ts` · `<Entity>Service` · `I<Entity>Service` | `transaction-service.ts` |
| Drizzle schema (`lib/db/`) | `<entity>Table` · `<entity><Field>Enum` · `<entity>(Select\|Insert)Schema` | `cardsTable`, `cardTypeEnum`, `cardInsertSchema` |
| Route module (`hono/routes/`) | `routes/<group>.ts` (kebab) | `global-statistics.ts` |
| Middleware (`hono/middlewares/`) | `middlewares/<name>.ts` | `auth.ts` |
| Request/response schema (`hono/schema/`) | `schema/<group>-schema.ts` (see below) | `identity-schema.ts` |

**Postgres DB names** (the string passed to Drizzle; the TS property stays camelCase): tables snake_case **plural** (`cards`), columns snake_case (`wallet_id`), indexes `idx_<table>_<column>` (`idx_cards_wallet_id`), pg enums snake_case (`pgEnum('card_type', …)`). A `<ENTITY>_TABLE_NAME` const holds the table name; audit columns and `org_id` ride the base table, never redeclared.

**Transport schemas** live in `hono/schema/` — a role name, never a `dto/` bucket — files `<group>-schema.ts` mirroring the `routes/<group>.ts` they validate. One role suffix per symbol: a request body is `<name>RequestSchema`, a response projection `<name>ResponseSchema`, and a row→wire mapper is the verb `serialize<Entity>`. The response projection is **derived** from the row schema, never re-declared (`contract-derive-schema`): `<entity>SelectSchema` (persistence) → `<entity>ResponseSchema` (wire). Under the JSON:API envelope the derived projection is `<entity>AttributesSchema`, wrapped by the generic document wrapper from `@scope/jsonapi` as `<entity>DocumentSchema`; a list route's query schema is `<entity>QuerySchema`; the `errors[]` builder is shared machinery, not a per-entity schema.

**Read and write speak two vocabularies.** The read query surface names its methods `findOne` / `findAll` — mirroring the row repository (`repo-extend-baserepository`), not `get*` / `list*` (those are the gateway's operationIds) — each taking one options object (`{ id, orgId, page?, sort?, filter? }`) with **scope as a field**, never encoded in the name (`findAll({ orgId })`, not `findAllByOrg`). The write side has **no verb-methods**: its vocabulary is imperative, bare **Command** names (`CreateClass`, `EnrollStudent`) dispatched on the message bus (`message-bus-and-handlers`). A read takes one options object; a write handler takes one Command, with the actor a server-set Command field (`mw-scope-in-path-actor-in-command`).

**The full method vocabulary — one verb per seam.** Beyond `findOne`/`findAll`, the read row repo adds paginated `findAllAndCount(opts)` → `[rows, total]`; a specialized finder is `findOneBy<Scope>` / `findAllAndCountBy<Scope>` / `findBy<Scope>` (see `repo-extend-baserepository`). The **aggregate** repo is a separate class (never merged with the read-row repo) whose only verbs are `load(id)` → aggregate and `save(aggregate)` → rows (see `aggregate-write-model`). The two flows are symmetric: a **read** goes transport → read repo (`findOne` / `findAll`) directly — no read-service needed — and a **write** goes transport → `Command` → handler → aggregate repo (`load` / `save`); `get*` / `list*` never appear below the gateway, and no read method takes positional scope args (one options object, scope a field).

**Incorrect — a `dto/` bucket, or `get*` / scope-baked read methods:**
```ts
hono/dto/identity.ts                        // 🔴 `dto` bucket, not `hono/schema/`
export const organizationDto = …            // 🔴 `Dto` suffix drifts from *ResponseSchema
class ClassService { getClass(id) {} }      // 🔴 get* is a gateway operationId; use findOne
service.findAllByOrg(orgId);                // 🔴 scope in the name; use findAll({ orgId })
```
**Correct — role-suffixed schemas, `findOne` / `findAll`, Commands for writes:**
```ts
// hono/schema/identity-schema.ts — pairs with hono/routes/identity.ts
export const organizationResponseSchema = organizationSelectSchema.omit(…);   // derived off the row
export function serializeStudent(row: Student) { … }                          // verb; row → wire
// read surface: mirror the repo, scope is a field
read.classes.findOne({ id, orgId });
read.students.findAll({ orgId, classId, page, sort });
// write: the vocabulary is the Command, actor a server-set field
await bus.send(new EnrollStudent({ classId, studentId, actorId }));
```

**Why:**
- One role-suffixed name per layer/schema/method makes every artifact `glob`-able and leaves one name per concept, so a renamed layer, a drifting `Dto`, or a scope-in-the-name method can't quietly spread across domains.

Reference: see `naming-files-and-symbols` · `contract-derive-schema` · `hono-openapi-routes` · `repo-extend-baserepository` · `message-bus-and-handlers` · `mw-scope-in-path-actor-in-command`
