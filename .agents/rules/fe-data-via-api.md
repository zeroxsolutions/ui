## Reach Data Only Through the Gateway API, Never the Database
`[HIGH]` `fe-data-via-api`

A frontend app — the SPA and every web surface (`<app>`) — reaches data **only** through the edge gateway's API; behind that gateway, the **domain services** are the only tier that touches a database — the gateway itself holds no database and composes those services over `hc` (see `boundary-worker-composition-only`, `db-per-service`). This is a hard boundary: no DB driver, connection string, or Drizzle import belongs in a frontend bundle. Every read and write is an API call — a typed client generated from the gateway's client-facing OpenAPI, its server state owned by the app's query layer (see `contract-hc-and-codegen`, `fe-app-structure`).

Compose those screens from the house design system, and give a new user-facing kind (`desktop`, `mobile`, native, …) its own descriptive project + rule rather than stretching a web app's conventions over it (see `naming-projects`).

**Incorrect — a frontend touching the database:**
```ts
import { db } from '@scope/db/postgres';   // 🔴 DB driver in the browser bundle — leaks credentials, bypasses the API's tenancy/auth/validation
```
**Correct — through the gateway API:**
```ts
const { data } = useClasses({ orgId });    // ✅ generated client → HTTP to the edge gateway → the domain services that reach the DB
```

Reference: see `fe-app-structure` · `contract-hc-and-codegen` · `naming-projects`
