# Security

This is an internal runbook, not a public vulnerability-disclosure policy. It
answers "a credential just leaked, what now" for the people who work on this
repository.

## Reporting

Report a suspected credential leak or vulnerability to @luongvantuit. Do not
open a public issue for it, and do not paste the credential into the report -
reference where it appeared instead.

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

Credentials this workspace can hold, by owner:

| Credential | Held by | Notes |
|---|---|---|
| Cloudflare Global API Key + account email | `iac/production.tfvars` | account-wide, every product on the account - rotate first |
| R2 access key for the Terraform state bucket | `iac/backend.config` | reads and writes the state, which carries secret values |
| `RCLONE_S3_ACCESS_KEY_ID` + `RCLONE_S3_SECRET_ACCESS_KEY` | `production` environment secrets in CI, and the shell of whoever runs `nx rclone:sync fluent-emoji` locally | Object Read & Write on the artwork bucket only - a holder can overwrite what every app serves |
| `CLOUDFLARE_API_TOKEN` | CI environment secrets, for the deploy job | not set in any environment yet; rotate if one is ever added and leaks |

### 2. Rotate at the source

Issue a new credential in the Cloudflare dashboard and revoke the old one - the
Global API Key is rolled under the profile's API Tokens page, R2 keys under R2's
API tokens. Revoke explicitly - do not rely on the new one displacing it.

### 3. Re-set it where it is consumed

- **CI secrets** - update the secret in the GitHub environment that holds it
  (`production` for the R2 sync keys). Endpoint and bucket name are variables,
  not secrets, and do not rotate.
- **Terraform credentials** - update `iac/production.tfvars` or
  `iac/backend.config`. Both are gitignored; only their `*.example` templates
  are committed.
- **Local sync** - replace the exported `RCLONE_S3_*` values in your shell or
  your ignored `.env`. It is never committed.

### 4. Verify

Run `terraform plan` in `iac/` for the Terraform credentials, and re-run the
`rclone-sync` job (or `nx rclone:sync fluent-emoji` locally) for the R2 sync
keys. A copy that finds nothing to move still authenticates, so a clean run
proves the new key.

### 5. Assess exposure

Check the Cloudflare audit log for use of the old credential between exposure
and revocation, and the artwork bucket for objects written in that window.
Record what you find, including "no use observed" - absence of evidence is
worth writing down.

### 6. Clean up history

Only after rotation. A credential in git history stays reachable through forks,
clones, and caches, so rewriting history reduces future copying but never
un-leaks the value. Rotation is the fix; cleanup is hygiene.

## Keeping credentials out

- Secrets go to the CI secret store or the gitignored Terraform files - never to
  a CI variable, never to a committed file.
- `.env*`, `iac/*.tfvars` and `iac/backend.config` stay gitignored. Do not add
  an exception to commit one "just this once".
- Logs carry structured, safe fields only. Never log a token or a key - a logged
  credential outlives the run in the log sink.
- Terraform state carries secret values: keep it in the remote backend and never
  commit a local state file.

Note: the `@zeroxsolutions` package scope is served with anonymous read, so no
registry token exists in this repository to leak. Publishing to that scope
needs a token, and it lives in the publisher's own npm config, never here.
