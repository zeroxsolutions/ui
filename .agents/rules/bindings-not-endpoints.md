## Reach Platform Services Through Bindings, Not Endpoints
`[HIGH]` `bindings-not-endpoints`

A Cloudflare Worker reaches every platform service through a **Worker binding** - Hyperdrive (Postgres pooling), R2, Queues, service bindings, Durable Objects - never a hardcoded endpoint, URL, or credential. Each binding is **Terraform-provisioned** (see `iac-terraform-root`): IaC produces the id, the worker's `wrangler.jsonc` consumes it, and every deployed env references its **own** per-env binding id.

`localConnectionString` is consulted only by local `wrangler dev`, never in production.

**Incorrect - hardcoded endpoint / credential in config:**
```ts
fetch('https://<account>.r2.cloudflarestorage.com/...');   // 🔴 hardcoded endpoint pins one account/env
```
```jsonc
"vars": { "DATABASE_URL": "postgres://user:pass@host/db" }   // 🔴 endpoint + credential baked into config
```

**Correct - binding to a provisioned resource:**
```ts
env.R2.put(key, body);              // ✅ R2 binding
env.HYPERDRIVE.connectionString;    // ✅ Hyperdrive binding - from a Terraform-provisioned id
```
```jsonc
"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<terraform-provisioned-id>",
                 "localConnectionString": "postgres://localhost/dev" }]
```

**Rules of thumb:**
- Every platform service (Hyperdrive, R2, Queues, service bindings, Durable Objects) is a Terraform-provisioned binding, not a URL in code.
- Each deployed env references its own binding id; `localConnectionString` is for `wrangler dev` only.

**Why:**
- Bindings are provisioned, credential-free, and environment-scoped; a hardcoded endpoint pins the code to one account/env and leaks configuration.

Reference: see `db-client-per-invocation`, `worker-wrangler-config`, `iac-terraform-root`, `secrets-and-logging`
