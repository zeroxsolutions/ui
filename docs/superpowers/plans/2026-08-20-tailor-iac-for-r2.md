# Tailor the Terraform Root for the fluent-emoji R2 Bucket - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `iac/` from another product's untouched scaffold into a root that
provisions one R2 bucket, `ui-sdk-fluent-emoji-production`, served over
`fluent-emoji.zeroxsolutions.com`.

**Architecture:** `iac/` is a standalone Terraform root, **not** an nx project - drive it
with `terraform` directly, never `nx`. It composes one remote module,
`zeroxsolutions/tf-modules//cloudflare`, which owns the platform services that live
between deploys. This plan deletes the `neon`, `google_main` and `clerk` module blocks a
UI registry does not use, bumps the surviving pin, wires the module's existing
`r2_custom_domains` input through the root, and rewrites the example var files.

**Tech Stack:** Terraform 1.15.8, `cloudflare/cloudflare` provider `~> 5`,
`zeroxsolutions/tf-modules//cloudflare` at `v1.0.3`.

**Spec:** `docs/superpowers/specs/2026-08-20-fluent-emoji-r2-cdn-design.md`

This plan covers **phase 1 only**. Phase 2 (the sync tool in
`packages/fluent-emoji/tools/`) gets its own plan once this bucket exists, because its
tasks cannot be verified against a bucket that is not there.

## Global Constraints

- **Terraform version.** `.tool-versions` pins `terraform 1.15.8`. asdf currently has no
  terraform plugin, the binary on PATH is Homebrew's 1.14.8, and `ci.yml` installs
  latest. Task 1 settles this before anything is formatted, because `fmt` is a gate.
- **Never run `nx` against `iac/`.** It has no scoped `package.json` and is not in the
  graph.
- **Plain ASCII in all authored text.** The existing
  `.tf` files contain em dashes in `description` strings; convert the ones you touch,
  and only those.
- **Terraform owns the platform services that live between deploys.**
  Add no `cloudflare_worker`, `cloudflare_workers_route` or `cloudflare_pages_project`.
- **Format before every commit.** `ci.yml` runs `terraform fmt -check` over every
  directory holding a tracked `.tf`. It does **not** cover `*.tfvars.example`, so format
  those deliberately.
- **Never commit a secret.** Real values
  live in gitignored `backend.config` and `production.tfvars`; only `*.example` is
  committed, with placeholders.
- **Conventional commits**, scope `iac`, with a `Co-Authored-By:` trailer. Never
  `--no-verify` or `HUSKY=0` - that bypass is hard-gated by a PreToolUse hook.
- **Rule-audit the staged diff before each commit:** walk
  `.claude/rules/*` against what is actually staged and state the result.

### The verification loop used throughout

`terraform init -backend=false -input=false` fetches the private modules and the
providers with **no credentials at all** (measured 2026-08-20 on this machine), and
`terraform validate` then checks the whole root. Every task below except Task 6 is
verified this way. Only Task 6 needs credentials.

Re-run `init` whenever a module `source` or `ref` changes; `validate` alone will not
pick up a new module version.

**The end state of Tasks 1 to 3 was built and checked before this plan was written**
(2026-08-20, Terraform 1.14.8): the resulting root reports
`Success! The configuration is valid.` against `cloudflare` at `v1.0.3`, and its lock
file resolves exactly one provider, `registry.terraform.io/cloudflare/cloudflare`. So a
failure while following these tasks is a slip in the transcription, not a flaw in the
target shape. Re-measure if the module gains a `required_providers` entry.

---

### Task 1: Strip the unused provider modules

`main.tf` composes four modules. Three of them - `neon`, `google_main`, `clerk` - serve a
different product. Deleting a module block leaves dangling `module.<name>` references in
`main.tf` and `outputs.tf`, and `terraform validate` fails until the last one is gone, so
all three files move together. There is no green state in between.

Toolchain setup is folded in here because this is the first task that formats a file.

**Files:**
- Modify: `iac/main.tf` (delete lines 6-80, keep the `terraform` block and rewrite the
  `cloudflare` module call)
- Modify: `iac/variables.tf` (delete the Neon, Google and Clerk inputs)
- Modify: `iac/outputs.tf` (delete the Neon, Firebase and Clerk outputs)

**Interfaces:**
- Consumes: nothing.
- Produces: a root whose only module call is `module "cloudflare"`, and whose variables
  are `project_name`, `cloudflare_account_id`, `cloudflare_api_token`,
  `cloudflare_r2_buckets`, `cloudflare_queues`, `cloudflare_kv_namespaces`,
  `cloudflare_dns_records`, `cloudflare_d1_databases`, `cloudflare_pages_projects`.
  Task 3 adds `cloudflare_r2_custom_domains` to that set.

- [ ] **Step 1: Create the task branch**

`master` is the releasable branch, so the work branches off it before any commit.

```bash
cd /Users/tus/ZeroXSolutions/ui-sdk
git switch -c chore/tailor-iac-r2
```

Every path below is relative to the repo root. If you would rather isolate this from
other work, `git worktree add ../ui-sdk-iac-r2 -b chore/tailor-iac-r2` does the same
job - but a worktree carries its own `node_modules`, so it needs
`pnpm install --frozen-lockfile` before the first commit, because the husky hook runs
nx. A plain branch reuses the install that is already here.

- [ ] **Step 2: Install the pinned Terraform**

`.tool-versions` says 1.15.8 but asdf has no terraform plugin, so the pin does nothing
and Homebrew's 1.14.8 answers instead.

```bash
asdf plugin add terraform https://github.com/asdf-community/asdf-hashicorp.git
asdf install terraform 1.15.8
```

- [ ] **Step 3: Confirm the pinned version answers**

```bash
cd iac && terraform version
```

Expected: `Terraform v1.15.8`. If it still prints `v1.14.8`, asdf is not shimming -
check `asdf current terraform` reports `1.15.8` from this repo's `.tool-versions`
before going further. Do not proceed on 1.14.8: `fmt` output is version-sensitive and
CI checks it.

- [ ] **Step 4: Capture the baseline green**

```bash
cd iac
terraform init -backend=false -input=false
terraform validate
```

Expected: `Success! The configuration is valid.`

This proves the loop works before you change anything. If `init` fails fetching
`git::https://github.com/zeroxsolutions/tf-modules.git`, your git credentials cannot
read that private repo - fix that first, nothing below will work.

- [ ] **Step 5: Rewrite `iac/main.tf`**

Replace the whole file with:

```hcl
terraform {
  backend "s3" {
    use_lockfile = true
  }
}

module "cloudflare" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//cloudflare?ref=v1.0.3"

  project_name = var.project_name
  account_id   = var.cloudflare_account_id
  api_token    = var.cloudflare_api_token

  r2_buckets     = var.cloudflare_r2_buckets
  queues         = var.cloudflare_queues
  kv_namespaces  = var.cloudflare_kv_namespaces
  dns_records    = var.cloudflare_dns_records
  d1_databases   = var.cloudflare_d1_databases
  pages_projects = var.cloudflare_pages_projects

  # The module declares hyperdrive_configs without a default, so it must be passed.
  # This root has no database layer to point one at - the Neon module that fed it
  # belonged to a different product.
  hyperdrive_configs = {}

  # The module provisions a Realtime (Calls) SFU app unless told not to - its
  # realtime_enabled defaults to true. This repo has no rooms feature, so the
  # default would create ui-sdk-rooms-production for nothing.
  realtime_enabled = false
}
```

**`realtime_enabled` is this module's trap.** Every other input is either required or
defaults to something inert; this one defaults to `true` and *creates a resource* -
`cloudflare_calls_sfu_app.rooms`, on `count = var.realtime_enabled ? 1 : 0`. Omitting it
is not "leave the default alone", it is "provision a media server". Five review passes on
this branch missed it because they all read the diff and none read the module. When you
compose a module, read its variables for defaults that create, not just for the inputs it
forces you to supply.

The `ref` stays at whatever the base already pins, `v1.0.3` - do not change it here.

`origin_connection_limit` is dropped along with Hyperdrive: it tunes a Hyperdrive origin,
and there are no Hyperdrive configs left for it to tune.

- [ ] **Step 6: Run validate to see it fail for the right reason**

```bash
cd iac && terraform validate
```

Expected: FAIL, several `Error: Reference to undeclared module`, pointing at
`outputs.tf` lines that still read `module.neon`, `module.google_main` and
`module.clerk`. This is the red state - it proves `validate` actually catches a dangling
reference, which is the whole reason these three files move together.

- [ ] **Step 7: Delete the dead outputs from `iac/outputs.tf`**

Remove `neon_database_urls`, `web_app_firebase_config`, `web_app_firebase_admin_key`,
the commented-out `back_office_firebase_config` / `back_office_firebase_admin_key`
block, `hyperdrive_config_ids`, and every `clerk_*` output. Also drop
`cloudflare_ai_gateways` - this root creates no AI Gateway. The file becomes:

```hcl
output "r2_bucket_names" {
  value = module.cloudflare.r2_bucket_names
}

output "queue_ids" {
  value = module.cloudflare.queue_ids
}

# KV / D1 binding ids - consumed by a worker's wrangler.jsonc when one exists.
output "cloudflare_kv_namespace_ids" {
  value = module.cloudflare.kv_namespace_ids
}

output "cloudflare_d1_database_ids" {
  value = module.cloudflare.d1_database_ids
}

# Pages projects - subdomain (<name>.pages.dev) + domains. With `source` set, Cloudflare
# builds and deploys the repo on push; no GitHub Actions.
output "cloudflare_pages_projects" {
  value = module.cloudflare.pages_projects
}
```

`hyperdrive_config_ids` goes because `hyperdrive_configs` is hard-coded empty, so the
output could only ever be `{}`.

- [ ] **Step 8: Delete the dead inputs from `iac/variables.tf`**

Remove every `neon_*`, `gcp_*` and `clerk_*` variable, including the `## Neon`,
`## Google / Firebase` and `## Clerk` section comments. Remove
`cloudflare_origin_connection_limit`. Convert the em dashes in the surviving
descriptions to ` - `. The file becomes:

```hcl
## Common
variable "project_name" {
  type        = string
  description = "The name of the project"
  nullable    = false
}

## Cloudflare
variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID"
  nullable    = false
}

variable "cloudflare_api_token" {
  type        = string
  description = "API token for Cloudflare provider"
  sensitive   = true
  nullable    = false
}

variable "cloudflare_r2_buckets" {
  type        = list(string)
  description = "Logical R2 bucket names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_queues" {
  type        = list(string)
  description = "Logical Queue names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_kv_namespaces" {
  type        = list(string)
  description = "Logical KV namespace names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_dns_records" {
  type = list(object({
    zone_id = string
    type    = string
    content = string
    name    = string
    ttl     = optional(number, 1)
    comment = optional(string, null)
    proxied = optional(bool, true)
  }))
  description = "DNS records to create"
  default     = []
}

variable "cloudflare_d1_databases" {
  type = list(object({
    name                  = string
    jurisdiction          = optional(string, null)
    primary_location_hint = optional(string, null)
  }))
  description = "D1 databases to create"
  default     = []
}
```

Then keep the existing `cloudflare_pages_projects` variable **verbatim** - it is 45 lines
of nested object type, it is unchanged by this task, and retyping it invites a typo.

`sensitive = true` is added to `cloudflare_api_token` because it is a credential and
a credential must stay out of plan and output text; the module already marks its own
copy sensitive.

`default = []` is added to `cloudflare_r2_buckets`, `cloudflare_queues` and
`cloudflare_d1_databases` so a var-file declares only the resources that exist. The
tfvars is the per-root source of truth for what a root provisions; a required-but-empty
input makes every var-file restate an absence.

- [ ] **Step 9: Run validate to confirm green**

```bash
cd iac && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 10: Format**

```bash
cd iac && terraform fmt -diff .
```

Expected: either no output, or the reformatted files listed. Re-run
`terraform fmt -check -diff .` and expect exit 0 with no diff.

- [ ] **Step 11: Confirm no non-ASCII typography survives**

```bash
cd iac && LC_ALL=C grep -n '[^ -~]' main.tf variables.tf outputs.tf
```

Expected: no output.

- [ ] **Step 12: Commit**

Rule-audit the staged diff against `.claude/rules/*` and state the result first.

```bash
git add iac/main.tf iac/variables.tf iac/outputs.tf
git commit -m "chore(iac): drop the neon, google and clerk scaffold modules

Why: this root serves a UI registry, which has no database, no Firebase
project and no auth provider. Nothing here was ever applied, so the blocks
were scaffold from another product rather than infrastructure in use.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

The husky hook runs `pnpm nx format:write --stdin` then
`pnpm nx run-many -t lint typecheck build test`. It sweeps the whole workspace even for
an `iac/`-only change, so expect it to take a while. Every project with a `test` target
sets `watch: false` in its vitest config, so the `testMode: watch` defect `CLAUDE.md`
records in `nx.json` does not hang it. If it does hang, that is the defect surfacing -
stop and report rather than bypassing the hook.

---

### Task 2: SUPERSEDED - the bump already happened on master

**Do not execute this task.** It is kept, rather than deleted, so the ledger's task
numbering and the analysis below stay reachable.

This task was written to bump the module pin from `v1.0.0` to `v1.0.3`. That bump was
already on master before this branch existed: base commit `4e7cd10` pins every module at
`ref=v1.0.3`. The plan said otherwise because it was written against an earlier read,
while master advanced underneath it. Task 1's fix round restores `v1.0.3` after Task 1's
text wrongly wrote `v1.0.0`.

The version analysis remains accurate and is worth keeping: reading `v1.0.0...v1.0.3`
shows the Cloudflare provider constraint unchanged (`~> 5`), every input this root passes
keeping its shape, and everything added optional - `api_key` / `email` for Global API Key
auth, `r2_managed_domains`, and per-worker fields on `worker_apps`, which this root does
not use. The one behaviour change is `api_token` relaxing from `nullable = false` to
`default = null`: a missing token reaches the provider as unauthenticated and fails at
plan time instead of at variable validation. This root always passes one.

---

### Task 3: Wire `r2_custom_domains` through the root

The module has taken `r2_custom_domains` since `v1.0.0`, but this root has never passed
it. Without it a bucket is created with no public hostname, which accepts every upload
and then serves 404 to every reader - a broken setup that looks provisioned.

**Files:**
- Modify: `iac/variables.tf` (add one variable after `cloudflare_r2_buckets`)
- Modify: `iac/main.tf` (pass it)
- Modify: `iac/outputs.tf` (surface the module's output)

**Interfaces:**
- Consumes: the variable set from Task 1.
- Produces: `var.cloudflare_r2_custom_domains`, a
  `list(object({ bucket, domain, zone_name, min_tls, enabled }))`, which Task 4's
  `production.tfvars.example` populates. Also the root output `r2_custom_domains`, a
  `map(string)` of domain to `https://<domain>`, which phase 2 reads to learn the base
  URL.

- [ ] **Step 1: Pass the input in `iac/main.tf` before declaring the variable**

Add to the `module "cloudflare"` block, directly under `r2_buckets`:

```hcl
  r2_custom_domains = var.cloudflare_r2_custom_domains
```

- [ ] **Step 2: Run validate to see it fail for the right reason**

```bash
cd iac && terraform validate
```

Expected: FAIL with `Error: Reference to undeclared input variable` naming
`var.cloudflare_r2_custom_domains` at `main.tf`. This is the red state, and it is worth
seeing: it proves `validate` catches a variable that exists only in a module call, which
is the exact mistake this task could otherwise ship silently.

- [ ] **Step 3: Declare the variable in `iac/variables.tf`**

Insert directly after the `cloudflare_r2_buckets` block:

```hcl
variable "cloudflare_r2_custom_domains" {
  type = list(object({
    bucket    = string
    domain    = string
    zone_name = string
    min_tls   = optional(string, "1.2")
    enabled   = optional(bool, true)
  }))
  description = "Public custom domains attached to R2 buckets. `bucket` is a logical name that must also appear in cloudflare_r2_buckets; `zone_name` is the Cloudflare zone the hostname belongs to. The Cloudflare API provisions the proxied CNAME itself, so no cloudflare_dns_records entry is needed."
  default     = []
}
```

The type mirrors the module's own `r2_custom_domains` variable, defaults included.

- [ ] **Step 4: Run validate to confirm green**

```bash
cd iac && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 5: Surface the output in `iac/outputs.tf`**

Add directly after `r2_bucket_names`:

```hcl
# Public HTTPS origin per R2 custom domain, keyed by hostname. This is the base URL an
# app points its asset resolver at.
output "r2_custom_domains" {
  value = module.cloudflare.r2_custom_domains
}
```

- [ ] **Step 6: Validate, format, and check typography**

```bash
cd iac
terraform validate
terraform fmt -check -diff .
LC_ALL=C grep -n '[^ -~]' main.tf variables.tf outputs.tf
```

Expected: `Success!`, then exit 0 with no `fmt` diff, then no grep output.

- [ ] **Step 7: Commit**

Rule-audit the staged diff first.

```bash
git add iac/main.tf iac/variables.tf iac/outputs.tf
git commit -m "feat(iac): wire r2 custom domains through the root

Why: the module has taken r2_custom_domains since v1.0.0 but the root never
passed it, so a bucket could only be created without a public hostname -
accepting every write and serving 404 to every read.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Rewrite the example var files and commit the provider lock

**Corrected premise.** An earlier de-classify pass on master already fixed
`project_name` to `"ui-sdk"` and the backend state key to `ui-sdk/`, so neither is part
of this task. What is left is worse than a naming leak: both examples still assign
`neon_api_key`, `neon_databases`, `gcp_*` and `clerk_*` - variables Task 1 deleted from
`variables.tf`. A var-file that names an undeclared variable fails at plan time, so the
committed examples are currently broken against the root they document. They also still
declare `cloudflare_r2_buckets = ["files", "recordings"]`, `cloudflare_queues =
["grading"]`, and two placeholder DNS records belonging to the other product.

The provider lock file is regenerated here rather than earlier because Task 1 removed
three modules and with them four providers. The committed lock still pins
`buildwithdeck/clerk`, `hashicorp/google-beta`, `hashicorp/time` and `kislerdm/neon`
alongside `cloudflare/cloudflare` - four entries for providers nothing in this root
references any more.

**Files:**
- Modify: `iac/production.tfvars.example` (replace wholesale)
- Delete: `iac/development.tfvars.example`
- Modify: `iac/.terraform.lock.hcl` (already tracked, currently locks five providers)

`iac/backend.config.example` is **not** touched - its key already reads
`ui-sdk/terraform.tfstate`.

**Interfaces:**
- Consumes: `var.cloudflare_r2_custom_domains` from Task 3.
- Produces: the concrete values Task 6 applies - logical bucket `fluent-emoji`,
  hostname `fluent-emoji.zeroxsolutions.com`, zone `zeroxsolutions.com`,
  `project_name = "ui-sdk"`.

- [ ] **Step 1: Replace `iac/production.tfvars.example` wholesale**

```hcl
## Common
project_name = "ui-sdk"

## Cloudflare
cloudflare_account_id = "<account_id>"
cloudflare_api_token  = "<api_token>"

# R2 object storage - logical names, prefixed with project+workspace at creation, so
# `fluent-emoji` becomes `ui-sdk-fluent-emoji-production`. It serves the artwork
# committed under packages/fluent-emoji/assets.
cloudflare_r2_buckets = ["fluent-emoji"]

# Public hostname for the artwork bucket. One custom domain maps to exactly one bucket
# and serves from the bucket root, so object key `3d/1f92f.webp` is reachable at
# https://fluent-emoji.zeroxsolutions.com/3d/1f92f.webp. The Cloudflare API provisions
# the proxied CNAME in the zone, so cloudflare_dns_records stays empty.
cloudflare_r2_custom_domains = [
  {
    bucket    = "fluent-emoji"
    domain    = "fluent-emoji.zeroxsolutions.com"
    zone_name = "zeroxsolutions.com"
  }
]

# Nothing else is provisioned here: this repo publishes packages and a shadcn registry,
# so it has no queue, no D1 database, no KV namespace and no Pages project. Each of
# these defaults to empty; they are listed to record that the omission is deliberate.
# cloudflare_queues         = []
# cloudflare_kv_namespaces  = []
# cloudflare_d1_databases   = []
# cloudflare_dns_records    = []
# cloudflare_pages_projects = {}
```

- [ ] **Step 2: Delete the development example**

```bash
git rm iac/development.tfvars.example
```

This root has no deployable and no development bucket. The artwork is byte-identical in
every environment, so a development bucket would duplicate 370 MB to serve the same
bytes. A committed example for an environment nobody applies promises a mechanism that
does not exist. Recreate it if a development environment ever gains resources.

- [ ] **Step 3: Regenerate and inspect the provider lock**

```bash
cd iac
rm -f .terraform.lock.hcl
terraform init -backend=false -input=false
cat .terraform.lock.hcl
```

Expected: exactly one provider block, `registry.terraform.io/cloudflare/cloudflare`,
down from five. If `kislerdm/neon`, `buildwithdeck/clerk`, `hashicorp/google-beta` or
`hashicorp/time` still appear, a module or resource referencing them survived Task 1 - go
back and find it rather than hand-editing the lock file.

Resolving fresh also moves `cloudflare/cloudflare` from `5.22.0` to `5.23.0`. That is
expected and in scope: the constraint is `~> 5`, the lock is being rewritten anyway, and
pinning a stale patch while dropping four dead providers in the same file would be an odd
half-measure. Say so in the commit body.

- [ ] **Step 4: Format the examples**

`terraform fmt` handles `.tfvars`, and `ci.yml` does **not** check them, so this is
deliberate rather than gated.

`terraform fmt` gates on the file extension and **refuses `.tfvars.example`** - passing
it directly exits 2, which is a rejection, not a formatting complaint (measured
2026-08-20 on Terraform 1.14.8). To canonicalise the example, copy it to a scratch
`.tfvars` outside the repo, run `terraform fmt` there, and diff the result back.

```bash
cd iac && terraform fmt -check -diff .
```

Expected: exit 0, no diff. This covers the `.tf` files, which is what CI checks.

- [ ] **Step 5: Confirm no secret and no non-ASCII is staged**

```bash
cd iac && LC_ALL=C grep -n '[^ -~]' production.tfvars.example backend.config.example
git diff --cached -- iac ':!iac/.terraform.lock.hcl' \
  | grep -nEi '(sk_|ak_|pk_|BEGIN [A-Z ]*PRIVATE KEY|[0-9a-f]{32,})' \
  || echo "no credential-shaped string staged"
```

Expected: no grep output from the first, and the fallback message from the second.
Placeholders like `<account_id>` are the point; a real 32-hex token is not.

**The lock file is excluded from the credential grep on purpose.** Its provider entries
are SHA-256 checksums, so every one of them matches `[0-9a-f]{32,}` and the check drowns
in ~76 false positives - a check that always fires is a check nobody reads. The lock holds
no secret by construction: it records provider versions and hashes, nothing else.

- [ ] **Step 6: Commit**

Rule-audit the staged diff first.

```bash
git add iac/production.tfvars.example iac/.terraform.lock.hcl
git add -u iac/development.tfvars.example
git commit -m "fix(iac): make the example var files match the root they document

Why: both examples still assigned neon, gcp and clerk variables that no longer
exist, so `terraform plan -var-file` on either fails on an undeclared variable.
They also declared another product's buckets, queue and DNS records.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Record the tailoring in CLAUDE.md

`CLAUDE.md` calls `iac/` an untouched scaffold and lists `neon_api_key` among the
provider tokens. Both stop being true when this lands, and a wrong sentence costs the
next reader more than a missing one - so the correction is part of this change, not
follow-up work.

**Files:**
- Modify: `CLAUDE.md:34-37` (the `iac/` bullet in **This project's choices**)
- Modify: `CLAUDE.md:58` (the provider tokens row)
- Modify: `CLAUDE.md:60-61` (the Environments line)

**Interfaces:**
- Consumes: the finished `iac/` from Tasks 1-4.
- Produces: nothing code reads.

- [ ] **Step 1: Replace the `iac/` bullet**

Find the bullet beginning `- **`iac/` is the untouched scaffold root**` and replace the
whole bullet with:

```markdown
- **`iac/` provisions exactly one thing: the artwork bucket.** The root composes only
  `tf-modules//cloudflare` (`v1.0.3`) and declares one R2 bucket, `fluent-emoji`, served
  at `https://fluent-emoji.zeroxsolutions.com`. The `neon`, `google_main` and `clerk`
  modules were scaffold from another product and are gone - a UI registry has no
  database, no Firebase project and no auth provider. `hyperdrive_configs` is passed
  empty because the module requires it, not because a Hyperdrive config is coming.
- **Only the `production` workspace is applied, and there is no development bucket.**
  The artwork is byte-identical in every environment, so a second bucket would duplicate
  370 MB to serve the same bytes; local dev reads the same public URL.
  `development.tfvars.example` was deleted rather than left empty.
```

- [ ] **Step 2: Correct the provider tokens row**

In the Configuration table, change the `provider tokens` row's first cell from:

```
| provider tokens (`cloudflare_api_token`, `neon_api_key`, ...) |
```

to:

```
| `cloudflare_api_token` |
```

It is now the only provider token this root takes.

- [ ] **Step 3: Correct the Environments line**

Append to the `Environments:` paragraph:

```markdown
`iac/` is the exception: it is applied in the `production` workspace only, because the
one resource it declares is environment-independent.
```

- [ ] **Step 4: Confirm no non-ASCII was introduced**

```bash
git diff -- CLAUDE.md | grep '^+' | LC_ALL=C grep -n '[^ -~]' || echo "added lines are plain ASCII"
```

Expected: the fallback message.

- [ ] **Step 5: Verify every claim in the new prose is true**

Read the new bullets against the files from Tasks 1-4. Specifically confirm: the module
ref really is `v1.0.3`, the bucket logical name really is `fluent-emoji`, the hostname
matches `production.tfvars.example`, and `development.tfvars.example` really is deleted.
A wrong claim here costs the next reader a debugging session and nothing will catch it.

- [ ] **Step 6: Commit**

Rule-audit the staged diff first.

```bash
git add CLAUDE.md
git commit -m "docs(claude): record what iac/ actually provisions

Why: the file still called the root an untouched scaffold and listed neon among
its provider tokens. Stale prose sends a reader somewhere confidently.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Apply to production - DONE 2026-08-20

Applied on the user's instruction: 2 added, bucket
`ui-sdk-fluent-emoji-production` and its custom domain, state at
`env:/production/ui-sdk/terraform.tfstate`. The root authenticates with the
account's Global API Key rather than the scoped token this plan assumed - see the
design spec.

**This task creates real infrastructure and costs money.** Everything above was
verified without a single credential; this step needs all of them.

**Files:**
- Create (gitignored, never committed): `iac/backend.config`, `iac/production.tfvars`

**Interfaces:**
- Consumes: everything from Tasks 1-4.
- Produces: bucket `ui-sdk-fluent-emoji-production`, and the outputs phase 2 reads -
  `r2_bucket_names` for `R2_BUCKET`, `r2_custom_domains` for the public base URL.

- [ ] **Step 1: Confirm the zone assumption before spending anything**

The module resolves the zone with `data "cloudflare_zone"` filtered by name, so
`zeroxsolutions.com` must already be a zone on this Cloudflare account. Check the
Cloudflare dashboard, or:

```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=zeroxsolutions.com" \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(r[0]['id'] if r else 'ZONE NOT FOUND')"
```

Expected: a zone id. If it prints `ZONE NOT FOUND`, **stop** and report. `apply` would
fail at the zone lookup, not at the bucket. The fallback is `r2_managed_domains`, which
serves the bucket at `pub-<bucketId>.r2.dev` with no zone and no DNS - but enabling it is
a design change, so bring it back to the spec rather than deciding it here.

- [ ] **Step 2: Fill the gitignored config from the examples**

```bash
cd iac
cp backend.config.example backend.config
cp production.tfvars.example production.tfvars
```

Replace every `<placeholder>` with a real value. Both files are gitignored
(`iac/.gitignore`); confirm with `git status --porcelain iac` showing neither.

- [ ] **Step 3: Initialise with the real backend**

```bash
cd iac && terraform init -backend-config=backend.config
```

Expected: `Terraform has been successfully initialized!`

- [ ] **Step 4: Select the production workspace**

```bash
cd iac && terraform workspace select production || terraform workspace new production
terraform workspace show
```

Expected: `production`. The workspace name is part of the bucket name, so a wrong
workspace here creates a wrongly-named bucket.

- [ ] **Step 5: Plan and read it**

```bash
cd iac && terraform plan -var-file=production.tfvars -out=tfplan
```

Expected: `Plan: 2 to add, 0 to change, 0 to destroy` - one `cloudflare_r2_bucket`
named `ui-sdk-fluent-emoji-production` and one `cloudflare_r2_custom_domain` for
`fluent-emoji.zeroxsolutions.com`. Anything to change or destroy means the workspace
already holds state; stop and read it before continuing.

`tfplan` contains sensitive values in plaintext and is gitignored - do not commit it.

- [ ] **Step 6: Apply**

```bash
cd iac && terraform apply tfplan
```

- [ ] **Step 7: Record the outputs phase 2 needs**

```bash
cd iac && terraform output r2_bucket_names && terraform output r2_custom_domains
```

Expected: `{ "fluent-emoji" = "ui-sdk-fluent-emoji-production" }` and
`{ "fluent-emoji.zeroxsolutions.com" = "https://fluent-emoji.zeroxsolutions.com" }`.

- [ ] **Step 8: Confirm the hostname actually serves**

DNS and the edge certificate take a few minutes. The bucket is empty at this point, so
404 is the **correct** answer - what matters is that it comes from Cloudflare rather
than failing to resolve.

```bash
curl -sS -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' \
  https://fluent-emoji.zeroxsolutions.com/3d/1f92f.webp
```

Expected: `404 0` - reached over a valid TLS certificate, no object yet. A connection
error or a TLS failure means the custom domain has not finished provisioning; wait and
retry before concluding anything is wrong.

- [ ] **Step 9: Integrate the branch**

```bash
cd /Users/tus/ZeroXSolutions/ui-sdk
git fetch origin
git rebase master
# open a PR from chore/tailor-iac-r2, or fast-forward master once the gate is green
```

If you took the optional worktree in Task 1 instead, rebase inside it and
`git worktree remove ../ui-sdk-iac-r2` when the branch is merged.

---

## What this plan deliberately leaves out

- **The sync tool.** Phase 2 in the spec. It gets its own plan once this bucket exists,
  because none of its tasks can be verified against a bucket that is not there.
- **`.gitignore` gaining `.env*`.** It belongs to phase 2, which is the change that first
  puts R2 secrets on a developer machine.
- **The `@nx/vitest` double registration in `nx.json`.** `CLAUDE.md` records it as a live
  defect. Every project with a `test` target sets `watch: false` in its own vitest
  config, so it does not hang this plan's commits; fixing it is its own change.
- **`cd.yml` asking `nx-deploy` for a `wrangler:deploy` target nothing declares.**
  Also recorded in `CLAUDE.md` as a live defect, also its own change.
- **Pinning `terraform_version` in `ci.yml`.** `hashicorp/setup-terraform@v4` installs
  latest there while `.tool-versions` pins 1.15.8, so the `fmt -check` gate and local
  formatting can disagree. Task 1 makes the local side match the pin; making CI match is
  a separate change to `.github/workflows/ci.yml`.
