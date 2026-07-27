# iac — Terraform infrastructure root

Infrastructure-as-code for this platform: it provisions the Cloudflare / Neon /
Firebase resources the Workers consume as **bindings**. A standalone Terraform
root that lives **inside** this repo but is **not** an nx project — run `terraform`
here directly, never through `nx`. Governed by `iac-terraform-root`,
`bindings-not-endpoints`, `tf-state-and-secrets`, and `db-migrations` in
`.agents/rules/`.

This README is the **same across every product's iac root** — it documents the
shared concept only. The concrete resources a given root declares (which
databases, buckets, queues, DNS records, Firebase projects) live in its
`*.tfvars`, and what it exports lives in its `outputs.tf`; this README never
enumerates them, so it can't drift.

## Concept

- **One standalone root, a workspace per environment.** Every resource name is
  namespaced by `terraform.workspace` (full-word `development` / `production`,
  never `dev`/`prod`), so two envs never collide in one account. Select the
  workspace and pass its matching var-file together (`iac-terraform-root`).
- **Per-provider modules.** `modules/cloudflare` (Hyperdrive, R2, Queues, KV, D1,
  DNS, Pages, …), `modules/neon` (project + database + owner role), `modules/google`
  (Firebase project + web app + Admin SDK), `modules/clerk` (applications, domains,
  instance config, redirect URLs, JWT templates — the opt-in auth alternative to
  Firebase; Platform API beta). A **Pages project** with `source` set connects a
  Git repo so Cloudflare builds+deploys on push (Pages Functions run as a Worker);
  authorize the GitHub/GitLab app on the account once first. Workers Builds (for
  standalone backend Workers) is dashboard-only, not Terraform (provider gap
  cloudflare/terraform-provider-cloudflare#6924). Add resources by extending a
  module, new providers by adding a per-provider module; the set is per-root, not a
  ceiling. The Worker/Pages infrastructure (project, bindings, routes, domains, build
  setup) is owned by Terraform here; wrangler only deploys code - see
  `terraform-owns-infra-wrangler-deploys`.
- **A Neon database per entry, wired to its own Hyperdrive.** One Neon project per
  workspace; the `neon_databases` map declares each database, and **every entry
  gets its own `<key>_owner` role plus a Cloudflare Hyperdrive config** named
  `<project>-<key>-<workspace>` pointing at it. A microservice root lists one DB
  per bounded-context service; a smaller app lists one — the wiring is identical.
- **Remote, secret-free state.** State lives in an S3-compatible remote backend
  (Cloudflare R2) and is never committed (`tf-state-and-secrets`). Provisioning
  flows one direction — `apply` emits an id, a worker's `wrangler.jsonc` consumes
  it; config never invents an id (`bindings-not-endpoints`).

## Layout

| Path | Purpose |
|---|---|
| `main.tf` | Composes the provider modules; wires each Neon database → its own Hyperdrive config. |
| `variables.tf` | Root inputs (typed). |
| `outputs.tf` | The binding ids / config this root exports (see **Outputs**). |
| `*.tfvars` (+ `*.tfvars.example`) | The concrete resources this root declares — databases, buckets, queues, DNS, Firebase projects. **The per-root source of truth.** |
| `backend.config` (+ `.example`) | Remote-state backend (R2) config. |
| `modules/{cloudflare,neon,google,clerk}` | The per-provider modules. |
| `.terraform.lock.hcl` | Pinned provider versions (committed). |

## Outputs

`outputs.tf` exports the values downstream consumers read — never hand-copied. The
kinds a root may export:

- **Hyperdrive config ids** → each worker's `wrangler.jsonc` Hyperdrive binding.
- **R2 bucket names / Queue ids** → the corresponding worker bindings.
- **Direct per-service Neon URLs** *(sensitive; where a root runs migrations)* →
  drizzle-kit **migrations**, a URL that **bypasses** Hyperdrive (`db-migrations`);
  write into the gitignored root `.env`.
- **Firebase config + Admin SDK key** *(sensitive)* → the gateway's Firebase auth
  (`auth-verify-server-side`).
- **Clerk application instances** *(sensitive; where a product uses Clerk instead of
  Firebase)* → the gateway's Clerk token verify (`auth-verify-server-side`); the
  publishable keys go to the SPA.

A given root exports only the subset it needs — read its `outputs.tf` for the
exact set.

## Secrets — never committed

`.gitignore` excludes every real value; only `*.example` files are tracked
(`tf-state-and-secrets`). Every root should commit `*.example` templates so the
next person can seed the real files.

- `*.tfvars` — Neon / Cloudflare API tokens.
- `creds/*.json` — GCP service-account keys, at the paths the tfvars reference.
- `backend.config` — R2 access/secret keys for the remote state backend.
- `*.tfstate`, `*.tfplan` — hold plaintext connection URLs / keys; remote or
  gitignored, never committed.

## Usage

```bash
# one-time, per machine — create the gitignored real files:
#   development.tfvars, backend.config, creds/*.json
#   (from the committed *.example templates where present, else the secret store)

terraform init -backend-config=backend.config
terraform workspace select development || terraform workspace new development
terraform plan  -var-file=development.tfvars -out=development.tfplan
terraform apply development.tfplan
```

Always pair the workspace with its matching var-file — a `production` workspace
takes `production.tfvars`. Apply outputs then feed each worker's `wrangler.jsonc`
bindings and the migration `.env` (see **Outputs**).
