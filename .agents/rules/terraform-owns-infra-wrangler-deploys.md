## Terraform Owns the Worker/Pages Infrastructure; Wrangler Deploys the Code
`[HIGH]` `terraform-owns-infra-wrangler-deploys`

For every Cloudflare Worker and Pages app, infrastructure and code deploy are two
separate concerns with two owners, and they never cross:

- **Terraform owns the infrastructure** (`iac/modules/cloudflare`): the
  `cloudflare_pages_project` (Pages) and the `cloudflare_worker` /
  `cloudflare_workers_script` resource when a Worker shell is provisioned; every
  **binding** (R2, KV, D1, Queues, Hyperdrive, Durable Objects, service bindings);
  **routes**; **custom domains**; **cron triggers**; and for Pages the `source` (Git
  connection) + `build_config` + `deployment_configs` bindings. `terraform apply`
  creates these and emits their ids; the worker's `wrangler.jsonc` consumes those ids
  (`bindings-not-endpoints`, `iac-terraform-root`).

- **Wrangler owns the code deploy, nothing else** (`deploy-via-nx-per-env`):
  `nx wrangler:deploy` uploads the built Worker bundle. It creates NO binding, NO
  route, NO project, NO domain - `wrangler.jsonc` only *references* the ids Terraform
  produced. For a Pages project whose `source` is set, Cloudflare itself builds and
  deploys on push (Pages Functions = a Worker; `fe-deploy-by-render-mode`); there is no
  `wrangler pages deploy` step. For a Direct-Upload Pages project, `wrangler pages
  deploy` uploads the static build but still creates no infra.

- **Workers Builds** (Cloudflare's Git auto-build for standalone backend Workers) is the
  one dashboard/API-only exception - the cloudflare Terraform provider has no resource
  for it (gap `cloudflare/terraform-provider-cloudflare#6924`). The standalone Worker's
  resource, bindings, routes, domains, and cron are still Terraform; only the Git-build
  configuration is set in the dashboard. The build/deploy command Workers Builds runs
  (`wrangler deploy` or an nx target) is itself just wrangler - invoked by Cloudflare.

**Incorrect - a binding/project/route created in wrangler or dashboard, or code shipped from Terraform:**
```jsonc
// wrangler.jsonc inventing a binding id instead of referencing Terraform's output
"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "hand-typed-id" }]   // binding not owned by Terraform
```
```hcl
resource "cloudflare_workers_script" "x" { source_code = file("dist/worker.js") }   // code bundle in Terraform state
```

**Correct - Terraform emits the id; wrangler references it; code deploys via wrangler or Cloudflare Build:**
```hcl
# iac/modules/cloudflare - Terraform creates the binding, outputs the id
resource "cloudflare_workers_kv_namespace" "main" { ... }   // -> kv_namespace_ids output
```
```jsonc
// wrangler.jsonc - references the Terraform-produced id, creates nothing
"kv_namespaces": [{ "binding": "CACHE", "id": "<terraform output kv_namespace_ids>" }]
```

**Rules of thumb:**
- A binding, route, custom domain, cron trigger, or Pages/Worker project is created by **Terraform**, never by wrangler or the dashboard; `wrangler.jsonc` only references the produced id.
- Code (the Worker bundle / Pages assets) is deployed by **wrangler** (`nx wrangler:deploy`) or by **Cloudflare Build** (Pages with `source`); never shipped from Terraform - no bundle in state.
- Workers Builds Git config is the one dashboard-only piece (#6924); the Worker's resource + bindings are still Terraform, and Workers Builds' deploy command is still just wrangler run by Cloudflare.

**Why:**
- Two owners for the same resource drift and fight; one owner per concern - Terraform owns the resource that exists between deploys, wrangler owns the code that changes every deploy - keeps state clean, deploys fast, and stops a binding or route being invented in wrangler that Terraform then "corrects" away, or a code bundle bloating Terraform state on every commit.

Reference: see `bindings-not-endpoints`, `iac-terraform-root`, `deploy-via-nx-per-env`, `fe-deploy-by-render-mode`, `boundary-worker-composition-only`, `worker-wrangler-config`
