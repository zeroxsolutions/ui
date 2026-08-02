# Security

This is an internal runbook, not a public vulnerability-disclosure policy. It
answers "a credential just leaked, what now" for the people who work on this
repository.

## Reporting

Report a suspected credential leak or vulnerability to engineering@evolit.com.au.
Do not open a public issue for it, and do not paste the credential into the
report - reference where it appeared instead.

## What counts as a leak

A credential that reached any of these is compromised and must be rotated, even
if the exposure was brief and even if it was reverted:

- a commit, a pull request, or any git history - including a force-pushed or
  deleted branch, which remains reachable
- a log line, a build log, or an error report
- an issue, a pull-request body, or a chat message
- a third-party service that was not supposed to receive it

Reverting a commit does not undo the exposure. Rotate first, tidy history after.

## Rotation runbook

Work top to bottom. Rotate at the source before touching any configuration -
re-setting a value that is still valid at the provider changes nothing.

### 1. Identify what leaked

| Credential | Held by | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | the deploy pipeline, and the root `.env` used by the migration target | broadest blast radius - rotate first |
| Clerk secret key | the edge gateway worker | rotating invalidates server-side token verification until the gateway is redeployed |
| `<CONTEXT>_D1_DATABASE_ID` values | the root `.env` used by the migration target | an id, not a secret by itself, but it is only useful alongside the account token above |
| `SHOPEE_*` integration secrets | the links service worker | |

The migration path is the one to check first: its credentials are a superset of
runtime access, and they live in a single ignored `.env` at the workspace root.

### 2. Rotate at the source

Issue a new credential in the provider's console - Cloudflare for the API token,
Clerk for the auth keys - and revoke the old one. Revoke explicitly; do not rely
on the new one displacing it.

### 3. Re-set it where it is consumed

- **Worker secrets** - `wrangler secret put <NAME> --env <env>`, once per
  environment. Never move a secret into `wrangler.jsonc` `vars`; those ship in
  clear text with the deployment.
- **Terraform-managed secrets** - update the secret manager or the untracked
  tfvars, then apply. Committed configuration references the produced id, never
  the raw credential.
- **Local development** - update the worker's `.dev.vars` so it mirrors the
  deployed secrets. It is gitignored and never committed.
- **Migration credentials** - update the single gitignored `.env` at the
  workspace root that the `drizzle:migrate` target sources.

### 4. Redeploy and verify

Redeploy the workers that consume the rotated secret and confirm the affected
path works. A worker keeps its old secret until it is redeployed.

### 5. Assess exposure

Check the provider's audit log for use of the old credential between exposure
and revocation. Record what you find, including "no use observed" - absence of
evidence is worth writing down.

### 6. Clean up history

Only after rotation. A credential in git history stays reachable through forks,
clones, and caches, so rewriting history reduces future copying but never
un-leaks the value. Rotation is the fix; cleanup is hygiene.

## Keeping credentials out

- Secrets go to the secret store or Terraform - never to `wrangler.jsonc` `vars`,
  never to a committed file.
- `.dev.vars*` and `.env*` stay gitignored. Do not add an exception to commit one
  "just this once".
- Logs carry structured, safe fields only. Never log a token, an identity, or a
  full request body - a logged credential outlives the request in the log sink.
- Bindings reference a Terraform-provisioned resource id, never a raw connection
  string or key.
- Terraform state carries secret values: keep it in the remote backend and never
  commit a local state file.

Note: the private package scope is served with anonymous read, so no registry
token exists in this repository to leak. Publishing to that scope requires
authentication, but that happens in each library's own repository.
