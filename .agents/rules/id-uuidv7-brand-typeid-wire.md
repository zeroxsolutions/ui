## Key Every Id as uuid v7; Brand It in the Domain, Emit TypeID Only at the Wire
`[MEDIUM]` `id-uuidv7-brand-typeid-wire`

One identity, three representations, each pinned to a boundary. In the **database and
everything internal** an id is a raw **uuid v7** -- the `baseTable` id default and the
`uuidV7IdGenerator` an aggregate takes at `create()` (both from the house domain toolkit;
see `lib-house-toolkits`), time-ordered for index locality. In the **domain layer** (`lib/`)
that same string is a nominal **`Brand<string, 'XId'>`** (cosmic `Brand<T,B>` -- `T` at
runtime, distinct at the type level, zero runtime cost), so a `WorkspaceId` can never be
passed where a `UserId` is wanted. On the **client-facing JSON:API wire** it is a **TypeID**
-- a type prefix plus `_` plus the uuid v7 encoded as Crockford base32 (`user_01hzy...`) --
produced and consumed by a codec that lives **only at the edge gateway**. A raw uuid never
reaches the client, and a TypeID never reaches `lib/`.

**Brand is declared once and cast at two seams only.** Each `type XId = Brand<string, 'XId'>`
is declared a single time in the context's `lib/types/ids.ts`; the unbranded `string -> XId`
cast happens **only** where a raw string first becomes a domain id -- (1) the aggregate
repository's row->aggregate mapping, and (2) the edge codec's decode of an inbound wire id --
never scattered as ad-hoc `as XId` through services or handlers. So a renamed id is one edit,
and the branded type carries through the domain untouched.

**The TypeID codec is an edge concern with a prefix registry.** The gateway encodes
`uuid v7 -> <prefix>_<base32>` on the way out and decodes `<prefix>_<base32> -> uuid v7` on
the way in, validating the prefix; a missing or mismatched prefix is a **400 at the edge**,
before any domain code runs. The codec, its Crockford base32 machinery, and the
`createTypeIdRegistry` that holds the map come from the **adopted house lib
`@zeroxsolutions/typeid`** (a thin wrapper over `typeid-js`; adopt via `catalog:`, do not
author -- verify against its installed types; see `house-libs-catalog-scope`). The
`resource type -> prefix` map is registered **once** (the concrete map lives in `CLAUDE.md`)
and mirrors the JSON:API `type`. A **foreign-key uuid is
never a wire attribute**: it surfaces as a JSON:API **relationship linkage**
(`{ type, id: '<prefix>_...' }`, TypeID-encoded), or is dropped entirely when that scope
already rides the URL path (tenancy under `/orgs/:orgId/...`); the derived `attributes`
(see `contract-derive-schema`) carry domain data, not raw fk uuids and not the raw own-id.

**Incorrect -- a TypeID built in the domain, a raw uuid/fk on the wire, the brand cast scattered:**
```ts
// lib/services/... -- a wire concern leaked into a logic layer
const wireId = `user_${base32(row.id)}`;                       // 🔴 TypeID belongs at the edge, not in lib/
return { id: row.id, workspaceId: row.workspaceId };           // 🔴 raw own-uuid + raw fk uuid on the wire
const uid = row.id as UserId; /* ...and again in three more files */  // 🔴 brand cast sprinkled everywhere
```

**Correct -- uuid v7 internal, Brand in the domain (one declaration, seam-only cast), TypeID at the edge:**
```ts
// lib/types/ids.ts -- the brand, declared ONCE
export type UserId = Brand<string, 'UserId'>;                  // ✅ one declaration per id
// aggregate repository -- the one seam that casts uuid v7 -> brand
const user = User.rehydrate({ id: row.id as UserId /* ... */ });  // ✅ cast only at the row->aggregate seam
// edge gateway -- codec from the adopted @zeroxsolutions/typeid; registry built once, edge-only
const typeIds = createTypeIdRegistry(ID_PREFIXES);             // ✅ ID_PREFIXES: the type->prefix map (CLAUDE.md)
const id = typeIds.encode('users', row.id);                    // ✅ "user_01hzy..."; decode validates prefix (400 on mismatch)
// JSON:API resource: `id` is the TypeID; a fk is a relationship linkage, never a raw-uuid attribute
{ type: 'users', id, relationships: {
    workspace: { data: { type: 'workspaces', id: typeIds.encode('workspaces', row.workspaceId) } } } }  // ✅ fk as linkage
```

**Rules of thumb:**
- DB + domain speak **uuid v7** (`baseTable` default, `uuidV7IdGenerator`); the client wire speaks **TypeID** `<prefix>_<base32(uuid v7)>`. Never a raw uuid on the wire, never a TypeID in `lib/`.
- Each `XId = Brand<string, 'XId'>` is declared once in `lib/types/ids.ts`; cast `string -> XId` only at the two seams -- row->aggregate mapping and edge wire-decode -- never a scattered `as XId`.
- The TypeID codec is the **adopted `@zeroxsolutions/typeid`** (wraps `typeid-js`, do not author), composed once at the edge gateway; the `type -> prefix` map is registered once (concrete map in `CLAUDE.md`), mirrors the JSON:API `type`, and a bad or mismatched prefix is a 400 before the domain.
- A foreign-key uuid is never a wire attribute: emit it as a JSON:API relationship linkage (TypeID id), or drop it when the scope already rides the URL path.

**Why:**
- uuid v7 gives the DB one opaque, index-friendly internal key; `Brand` makes that key type-safe across the domain at zero runtime cost; a prefixed TypeID at the wire is self-describing and mis-paste-proof and is exactly the string `id` + `type` shape JSON:API mandates. Keeping the codec at the edge leaves `lib/` transport-agnostic and makes the on-the-wire id representation a presentation choice the gateway owns, not a domain fact -- so a change to the wire id format touches only the edge codec.

Reference: [TypeID spec](https://github.com/jetify-com/typeid), [uuid v7](https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-7), see `aggregate-write-model`, `contract-derive-schema`, `lib-house-toolkits`, `house-libs-catalog-scope`, `structure-lib-layers`, `hono-openapi-routes`, `mw-scope-in-path-actor-in-command`
