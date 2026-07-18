## Keep Terraform State Remote and Secret-Free
`[HIGH]` `tf-state-and-secrets`

In a Terraform IaC root, keep state in a **remote backend** (e.g. an S3-compatible store) and **never commit `terraform.tfstate`** - state carries secret values and resource ids, so committing it leaks credentials and lets two applies fight over one file; gitignore any local `*.tfstate`. Pin the provider, but treat the exact version as discoverable - read it from `.terraform.lock.hcl` / the `required_providers` block, don't freeze a version number here.

Keep **secrets out of every committed file** - no raw service-account key, database URL, or token in committed `.tf` / `.tfvars` or in a worker's wrangler `vars`. Manage each as a Terraform-managed secret resource or via `wrangler secret put <NAME> --env <env>`, and keep raw values in a secret manager or an untracked tfvars. Provisioning flows one way: **`apply` emits the id / secret reference, config consumes it** - a Hyperdrive/D1/Queues binding needs only the id, never the credential - so keep producer and consumer in sync.

**Incorrect - state committed, or a secret in committed vars:**
```
git add terraform.tfstate                    // 🔴 secret values + resource ids now in git history
database_url = "postgres://user:pass@..."      // 🔴 credential committed in production.tfvars
```
**Correct - remote state, secrets held out of git:**
```
// ✅ remote backend; local *.tfstate gitignored; provider pinned in the lockfile
// ✅ wrangler secret put <APP>_DATABASE_URL --env production
// committed .tf / .tfvars reference only the produced id, never the raw value
```

Reference: see `iac-terraform-root`, `secrets-and-logging`, `bindings-not-endpoints`, `commit-conventions`
