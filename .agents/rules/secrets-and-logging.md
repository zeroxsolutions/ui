## Store Secrets in the Secret Store; Log Structured, Never Credentials
`[HIGH]` `secrets-and-logging`

Every worker - the edge gateway, each `<domain>-service`, and the `*-consumer` / `*-job` workers - keeps secrets out of plaintext config and out of log lines. A secret (an auth provider's service-account key, a database URL, an API token) is NEVER placed in wrangler `vars`; set it with `wrangler secret put <NAME> --env <env>` or manage it through Terraform, and reference a Terraform-produced Hyperdrive `id` rather than a raw connection string. Local secrets for `wrangler dev` live in a gitignored `.dev.vars` file in the worker directory that mirrors the deployed secrets (keep `.dev.vars*` and `.env*` ignored, never committed).

Log with structured `console` calls captured by Workers Logs under `observability.enabled` - a JSON object of safe fields. Never log a secret, token, or full request body: a logged credential outlives the request in the log sink and is a compliance breach.

**Incorrect - secret in `vars`, or a credential logged:**
```ts
"vars": { "<PROVIDER>_PRIVATE_KEY": "-----BEGIN..." }   // 🔴 secret in plaintext worker config
console.log(`verifying ${idToken}`);                   // 🔴 logs a credential
console.log('body', await c.req.json());               // 🔴 full request body to the log sink
```

**Correct - secret store + gitignored local file; structured, redacted logs:**
```ts
// wrangler secret put <APP>_DATABASE_URL --env production   (or Terraform-managed)
// apps/<worker>/.dev.vars   - local only, gitignored
console.log(JSON.stringify({ event: 'auth.ok', userId }));   // ✅ safe fields, no secrets
```

**Rules of thumb:**
- `vars` is for non-secret config only; service-account keys, DB URLs, and tokens go to the secret store or Terraform, and config consumes the Hyperdrive `id`, not a raw credential.
- `.dev.vars` mirrors the deployed secrets locally and is never committed.
- Structured JSON fields to Workers Logs; redact identity, credentials, and full bodies before they reach a line.

**Why:**
- `vars` ships in plaintext with the worker config and a logged credential persists in the log sink - both are irreversible leaks; the secret store, Terraform-produced ids, and redacted structured logs keep credentials out of the repo and out of the logs.

Reference: see `worker-wrangler-config`, `tf-state-and-secrets`, `naming-files-and-symbols`, `commit-conventions`
