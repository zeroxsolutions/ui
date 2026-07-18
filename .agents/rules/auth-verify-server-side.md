## Verify Every Auth Token Server-Side, Behind a Swappable Port
`[HIGH]` `auth-verify-server-side`

Authenticate at the edge gateway by **verifying the caller's token server-side** - via the auth provider's server SDK on `nodejs_compat` Workers (the provider is named in `CLAUDE.md`) - and **never trust client-supplied identity**. Run the verify as **one gateway middleware layer**, delegating to a swappable auth-verifier port (`IAuthVerifier`) so the provider stays replaceable, and derive the caller's identity **only from the decoded token**, never from a client-sent field or header. On first sign-in the same middleware **JIT-upserts** the user record (`syncUser`). The resolved actor then travels downstream as a **write-Command field**, not a forwarded header (see `mw-scope-in-path-actor-in-command`).

The provider's service-account private keys are **secrets** - the secret store (`wrangler secret put`) or Terraform-managed, never wrangler `vars` or committed config (see `secrets-and-logging`). In test/e2e, point auth at the provider's **auth emulator** - never live credentials or real ID tokens - so auth tests stay deterministic, offline, and secret-free.

**Incorrect - trusting a client header, or a private key in `vars`:**
```ts
const userId = c.req.header('X-User-Id');          // 🔴 forgeable client identity
```
```jsonc
"vars": { "AUTH_PRIVATE_KEY": "-----BEGIN..." }    // 🔴 secret in plaintext config
```
**Correct - verify behind the port; keys in the secret store:**
```ts
const decoded = await authVerifier.verifyIdToken(idToken);   // ✅ server-side, behind IAuthVerifier
```
```
wrangler secret put AUTH_PRIVATE_KEY --env production        # ✅ secret store, not vars
```

**Rules of thumb:**
- Verify server-side behind `IAuthVerifier`; identity comes from the decoded token, never a client field.
- Auth is one gateway middleware layer, not ad-hoc per handler; it JIT-upserts the user on first sign-in.
- Provider service-account keys are secrets - never `vars`/committed config.
- Test/e2e use the provider's auth emulator, never live tokens or credentials.

**Why:**
- Client-supplied identity is forgeable, so only a server-side verify against the provider's service account is trustworthy - and a private key in `vars` ships as committed plaintext.

Reference: see `mw-single-global-gate-per-route-rbac`, `mw-scope-in-path-actor-in-command`, `secrets-and-logging`, `e2e-pairs-each-app`
