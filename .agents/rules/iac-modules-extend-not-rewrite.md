## Extend Curated iac Modules; Never Delete or Rewrite Them to Reshape
`[HIGH]` `iac-modules-extend-not-rewrite`

The per-provider modules under `iac/modules/*` (cloudflare, neon, google, clerk, ...)
are **curated scaffold assets**: they ship in *every* product spawned from this
scaffold, and a task that deletes or rewrites one reshapes a shared contract for every
downstream product. Add to a module by **extending** it - a new `resource`, a new
`variable`, a new `for_each` branch - never by deleting what is there to "clean up" or
"simplify." To change a module's shape (add or remove a resource kind),
**parameterize**: drive the behavior from a `tfvars` variable so the module code stays
stable and the consumer flips it in config, not in code (`iac-terraform-root`). The
`modules/clerk` `applications` map is the model - a product declares its
per-domain apps in `tfvars`, the module fans out `for_each`, and the module file never
needs editing to add or remove an app.

A scaffold module is not the place to `rm` a file or run `terraform destroy` /
`terraform state rm` on a whim. Those **destructive** ops are hard-gated by
`.claude/hooks/block-iac-destruct.mjs` (regardless of whether the agent recalls this
rule); the only override is an explicit human-directed one (`IAC_ALLOW_DESTRUCT=1`).
And a resource whose `destroy` loses data irreversibly carries
`lifecycle { prevent_destroy = true }` (e.g. `clerk_application` - deleting the app
orphans its users and keys) - defense-in-depth under the hook. The same
extend-don't-reshape discipline applies to `.agents/rules/*`, enforced by the
rule-audit reminder at commit, not the hard gate.

**Incorrect - delete to reshape, or destroy on a whim:**
```hcl
# an agent "tidying up" removes clerk from main.tf and `rm -rf iac/modules/clerk`   // hard-gated; nukes a curated module
terraform destroy                                                                    // hard-gated + prevent_destroy on stateful resources
resource "clerk_application" "x" { ... } /* rewritten wholesale to "simplify" */      // rewrite, not extend
```

**Correct - extend behind a variable + for_each; the module code is stable:**
```hcl
# add a domain to an app in tfvars - no module edit:
clerk_applications = { main = { name = "Classify", domains = ["auth.example"] } }
# a genuinely new resource kind: ADD it to the module behind a variable, don't delete the old
# a human-directed destroy only, with the override:
#   IAC_ALLOW_DESTRUCT=1 terraform destroy
```

**Rules of thumb:**
- `iac/modules/*` are curated - extend (add a resource / variable / `for_each`), never delete or rewrite to reshape; parameterize new behavior in `tfvars`.
- `rm` / `git rm` of a module file and `terraform destroy` / `state rm` / `state mv` are hard-gated (`block-iac-destruct.mjs`); only an explicit human override (`IAC_ALLOW_DESTRUCT=1`) proceeds.
- A resource whose `destroy` loses data irreversibly carries `prevent_destroy = true` (e.g. `clerk_application`).
- `.agents/rules/*` follow the same extend-don't-reshape discipline (rule-audit at commit, not the hard gate).

**Why:**
- A scaffold module is shared contract: one task rewriting or deleting it propagates to every product, and a `terraform destroy` of an auth app loses users and keys irreversibly. Parameterized extension keeps the module stable across products, and the hard gate makes "the agent took initiative to clean up" impossible rather than merely discouraged.

Reference: see `iac-terraform-root`, `tf-state-and-secrets`, `gen-via-generator`, `green-before-commit`, `auth-verify-server-side`
