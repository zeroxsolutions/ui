## Give Each Service Its Own Database; Reach Other Domains Over RPC, Not Their Tables
`[HIGH]` `db-per-service`

Each `<domain>-service` owns its **own** database - its own Hyperdrive binding, its own migrations - and there is **no shared database**. A service's package reaches only that database and **never** another domain's tables: no cross-service SQL, no foreign key into another schema, no second service pointed at the same connection string, and no transaction spanning two services (services with separate databases can't share one anyway). Tenancy (`org_id`) still rides every table - one-database-per-service is orthogonal to multi-tenancy.

When a domain needs another's data, it calls that domain's service over the service binding via `hc<XxxApp>` and consumes the returned **DTO, not the row**. Cross-domain consistency is **eventual** - coordinated by domain events on a queue or an orchestrating service, never a cross-service transaction. For a hot path, keep a **local, owned projection** - a denormalized read-model this service updates from those events - while the **source of truth stays in the owning service**.

**Incorrect - a shared DB, a cross-domain join/FK, or a cross-service transaction:**
```ts
// apps/<domain>-service and apps/<other>-service both point at <DOMAIN>_DATABASE_URL  // 🔴 shared DB
db.select().from(<domain>Table).innerJoin(<other>Table, ...)      // 🔴 join across two domains' schemas
enrollmentId: uuid().references(() => <other>Table.id)          // 🔴 FK into another service's table
db.transaction(async (tx) => { /* writes into <domain> AND <other> tables */ })  // 🔴 no cross-service tx
```

**Correct - one DB per service; cross-domain data via the owning service:**
```ts
// each service migrates its own schema against its own direct URL:
// apps/<domain>-service -> <DOMAIN>_DATABASE_URL  ,   apps/<other>-service -> <OTHER>_DATABASE_URL
// <other> needs a <domain> record -> typed hc over the binding, tenant scope in the path:
const rec = await (await hc<XxxApp>(url, { fetch }).orgs[':orgId'].<entity>[':id'].$get({ param: { orgId, id } })).json();
// hot path: a domain event on a queue -> <other> updates the owned read-model projection it keeps  // ✅
```

Reference: see `bounded-context-transport-agnostic`, `db-drizzle-hyperdrive-or-d1`, `db-migrations`, `contract-hc-and-codegen`, `unit-of-work-and-outbox`, `mw-scope-in-path-actor-in-command`, `trigger-thin-handlers`
