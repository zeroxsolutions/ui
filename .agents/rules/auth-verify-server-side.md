## Verify Every Auth Token Server-Side, Behind the Identity Lib's Provider Port
`[HIGH]` `auth-verify-server-side`

Authenticate at the edge gateway by **verifying the caller's token server-side** - behind `@zeroxsolutions/identity`'s `IIdentityProvider` port (`authenticate(Request)` -> `Principal`), and **never trust client-supplied identity**. The product injects the provider adapter it needs (`./clerk` or `./firebase`); the `./hono` binding runs as **one gateway middleware layer** (`identityMiddleware(provider)`) that resolves the `Principal` from `c.req.raw` and maps an `Unauthenticated` outcome to `401`. The port owns the seam, so the provider stays replaceable - the product's `lib/` layers hold **no** provider SDK and **no** auth framework; the gateway's per-invocation bootstrap constructs the provider from secrets and injects it. Identity is derived **only from the decoded token**, never a client-sent field or header. On first sign-in the gateway **JIT-upserts** the user record (`syncUser`) from the resolved `Principal`. The resolved actor then travels downstream as a **write-Command field**, not a forwarded header (see `mw-scope-in-path-actor-in-command`).

The provider's service-account keys are **secrets** - the secret store (`wrangler secret put`) or Terraform-managed, never wrangler `vars` or committed config (see `secrets-and-logging`). In test/e2e, point auth at the provider's **auth emulator** - never live credentials or real ID tokens - so auth tests stay deterministic, offline, and secret-free.

**Incorrect - trusting a client header, or a private key in `vars`:**
```ts
const userId = c.req.header('X-User-Id');          // 🔴 forgeable client identity
```
```jsonc
"vars": { "AUTH_PRIVATE_KEY": "-----BEGIN..." }    // 🔴 secret in plaintext config
```
**Correct - verify behind the lib's provider port; keys in the secret store:**
```ts
const principal = await provider.authenticate(c.req.raw);   // ✅ server-side, behind @zeroxsolutions/identity IIdentityProvider
```
```
wrangler secret put AUTH_PRIVATE_KEY --env production        # ✅ secret store, not vars
```

**Rules of thumb:**
- Verify server-side behind `@zeroxsolutions/identity`'s `IIdentityProvider` port; identity comes from the decoded token, never a client field.
- The product injects one provider adapter (`./clerk` | `./firebase`); the `./hono` binding's `identityMiddleware` is the one gateway middleware layer, not ad-hoc per handler. The gateway JIT-upserts the user on first sign-in.
- The product's `lib/` holds no provider SDK and no auth framework - only the gateway bootstrap names the provider, and provider keys are secrets, never `vars`/committed config.
- Test/e2e use the provider's auth emulator, never live tokens or credentials.

**Why:**
- Client-supplied identity is forgeable, so only a server-side verify behind the shared `IIdentityProvider` port is trustworthy - and a private key in `vars` ships as committed plaintext. Routing every product through one provider-agnostic port keeps the seam replaceable and `lib/` free of provider/framework coupling.

Reference: see `mw-single-global-gate-per-route-rbac`, `mw-scope-in-path-actor-in-command`, `secrets-and-logging`, `e2e-pairs-each-app`
