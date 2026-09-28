# iac — Terraform infrastructure root

Infrastructure-as-code for this platform: it provisions the Cloudflare / Neon /
Firebase resources the Workers consume as **bindings**. A standalone Terraform
root that lives **inside** this repo but is **not** an nx project — run `terraform`
here directly, never through `nx`.

This README is the **same across every product's iac root** — it documents the
shared concept only. The concrete resources a given root declares (which
databases, buckets, queues, DNS records, Firebase projects) live in its
`*.tfvars`, and what it exports lives in its `outputs.tf`; this README never
enumerates them, so it can't drift.

## Concept

- **One standalone root, a workspace per environment.** Every resource name is
  namespaced by `terraform.workspace` (full-word `development` / `production`,
  never `dev`/`prod`), so two envs never collide in one account. Select the
  workspace and pass its matching var-file together.
- **Per-provider modules.** A root composes one module per provider from the shared
  modules repo (Cloudflare, Neon, Google, Clerk, ...); which ones a given root
  composes, and what each provisions, is visible in its own `main.tf` - this README
  never enumerates them. Add resources by extending a module, new providers by
  adding a per-provider module; the set is per-root, not a ceiling.
- **The root owns what a binding resolves against, never a worker.** Databases,
  queues, buckets, key-value namespaces, poolers and DNS are applied here, by a
  human. A worker or a hosted site - its code, bindings, routes, custom domains and
  crons - is declared in its own `wrangler.jsonc` and shipped by its deploy target
  in CI.
- **Remote, secret-free state.** State lives in an S3-compatible remote backend
  (Cloudflare R2) and is never committed. Provisioning
  flows one direction — `apply` emits an id, a worker's `wrangler.jsonc` consumes
  it; config never invents an id.

## Layout

| Path                              | Purpose                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `main.tf`                         | Composes the provider modules this root needs.                                                                                    |
| `variables.tf`                    | Root inputs (typed).                                                                                                              |
| `outputs.tf`                      | The binding ids / config this root exports (see **Outputs**).                                                                     |
| `*.tfvars` (+ `*.tfvars.example`) | The concrete resources this root declares — databases, buckets, queues, DNS, Firebase projects. **The per-root source of truth.** |
| `backend.config` (+ `.example`)   | Remote-state backend (R2) config.                                                                                                 |
| `.terraform.lock.hcl`             | Pinned provider versions (committed).                                                                                             |

## Outputs

`outputs.tf` exports the values downstream consumers read - never hand-copied. A
given root exports only the subset it needs - read its `outputs.tf` for the
exact set.

## Secrets — never committed

`.gitignore` excludes every real value; only `*.example` files are tracked.
Every root should commit `*.example` templates so the
next person can seed the real files.

- `*.tfvars` — Neon / Cloudflare API tokens.
- `creds/*.json` — GCP service-account keys, at the paths the tfvars reference.
- `backend.config` — R2 access/secret keys for the remote state backend.
- `*.tfstate`, `*.tfplan` — hold plaintext connection URLs / keys; remote or
  gitignored, never committed.

## Usage

```bash
# one-time, per machine - create the gitignored real files:
#   <env>.tfvars, backend.config, creds/*.json
#   (from the committed *.example templates where present, else the secret store)

terraform init -backend-config=backend.config
terraform workspace select <env> || terraform workspace new <env>
terraform plan  -var-file=<env>.tfvars -out=<env>.tfplan
terraform apply <env>.tfplan
```

Always pair the workspace with its matching var-file - a `<env>` workspace takes
`<env>.tfvars`. Apply outputs then feed each worker's `wrangler.jsonc` bindings and
the migration `.env` (see **Outputs**).
