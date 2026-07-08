## Provision the Platform From One Standalone Terraform Root, a Workspace per Environment
`[HIGH]` `iac-terraform-root`

Keep all `.tf` in one dedicated, standalone root (e.g. `iac/`), built from reusable per-provider modules — never scatter `.tf` through `apps/*`. This root is **not** an nx project: it lives outside the nx graph, nx never builds or tests it, and it runs its own toolchain (`terraform`). Resource names stay kebab-case; the binding names they map to stay SCREAMING_SNAKE (`HYPERDRIVE`, `R2`).

Create every resource only through `terraform apply` — never dashboard-click it or spin it up with an ad-hoc CLI (`wrangler r2 bucket create`, `wrangler hyperdrive create`, …). A hand-made resource drifts from state, so Terraform can't track, reproduce, or destroy it, and the next apply may clobber it. A binding flows **one direction — IaC produces the id, config consumes it**: `apply` emits an id, the worker's `wrangler.jsonc` wires it in, and config never invents an id. A Worker `route` authored in `wrangler.jsonc` is the one thing declared there directly — it's a trigger URL pattern, not a consumed binding.

Separate environments with a **workspace per env**, not a copy-pasted root, using full-word names (`development` / `production`). Select the workspace and pass its matching var-file together, and namespace every resource name with `terraform.workspace` so two envs never collide in one account. One remote backend holds state keyed per workspace.

**Incorrect — `.tf` scattered into an app, a hand-made resource, or a mismatched workspace:**
```
apps/<worker>/infra/hyperdrive.tf                    # 🔴 scattered; nx tries to reason about a non-project
wrangler hyperdrive create …                          # 🔴 Terraform can't track / reproduce / destroy it
terraform workspace select production \
  && terraform apply -var-file=development.tfvars      # 🔴 workspace and var-file from different envs
```

**Correct — one standalone root, apply-provisioned, workspace per env:**
```
iac/  modules/cloudflare/…  modules/neon/…            # ✅ per-provider modules, outside the nx graph
terraform workspace select development
terraform apply -var-file=development.tfvars          # ✅ names namespaced by terraform.workspace
# apply emits the Hyperdrive id → wrangler.jsonc: hyperdrive[].id = <that id>
```

Reference: see `structure-apps-packages` · `bindings-not-endpoints` · `tf-state-and-secrets` · `deploy-via-nx-per-env` · `naming-files-and-symbols`
