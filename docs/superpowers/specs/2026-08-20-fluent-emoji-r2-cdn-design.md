# Serving fluent-emoji artwork from R2

Design for publishing `packages/fluent-emoji/assets/` to a Cloudflare R2 bucket and
serving it over a public custom domain, plus the sync tool that uploads it.

Status: every decision below is settled with the owner; the design as a whole is not
yet signed off and nothing is implemented. Lands as **two sequential changes** -
the Terraform root first, the sync tool second, on a bucket Terraform already owns.

## Why

`assets/` is 9217 files / 370 MB committed in the repo across five styles. Only the
four static styles ship in the npm tarball (~112 MB); `anim` (1852 files, 258 MB) is
excluded by `package.json#files` and today has no host at all, so animated glyphs fall
back to the native glyph for every consumer. Serving all five from R2 gives consumers
one base URL and removes the need to copy `dist/assets` into a public directory.

## Decisions

Recorded here because none is recoverable from the code, and each closed off an
alternative that looks equally reasonable from the diff alone.

| Decision | Choice | What it rules out, and why |
| --- | --- | --- |
| Upload scope | the whole `assets/` tree, five styles | `anim`-only keeps the tarball story but leaves consumers copying static assets by hand. R2 egress is free and 370 MB is under a cent per month, so the narrower scope saves nothing real. |
| Bucket | dedicated `fluent-emoji` bucket | A shared `cdn` bucket with per-package key prefixes needs one hostname per bucket anyway, and R2 API tokens scope **per bucket, not per key prefix** (verified in Cloudflare's R2 token docs), so a shared bucket hands the sync token write access to every other package's assets. |
| Environments | `production` workspace only | The artwork is byte-identical in every environment, so a `development` bucket would duplicate 370 MB to serve the same bytes. Consumers point local dev at the same public URL. |
| Hostname | `fluent-emoji.zeroxsolutions.com` | One R2 custom domain maps to exactly one bucket and serves from the bucket root, so `cdn.zeroxsolutions.com/fluent-emoji/*` is not reachable without putting a Worker in front. A dedicated bucket therefore forces a dedicated hostname. |
| How consumers learn the base | an env var per consuming app | Exporting a constant from the package, or changing `DEFAULT_BASE`, would make the package the source of truth but couples every consumer's asset host to a package release. |
| Sync implementation | Node + `@aws-sdk/client-s3` | `aws4fetch` means hand-rolling `ListObjectsV2` XML parsing, pagination and retry - the exact code whose failure mode is silent (a dropped page reads as "not uploaded yet"). `rclone` needs a binary outside `.tool-versions`. |
| Credentials | read from `process.env`, nothing else | `--env-file` makes a missing file exit 9 with an error about a file rather than a credential; `--env-file-if-exists` only pays off with startup validation, which is the part actually worth having. |
| Trigger | an nx target run by hand | The artwork is pre-generated and changes rarely, so a CI job on every push spends 9217 HEAD requests to discover nothing changed. CI can call the same target later. |

## Path and cache policy

Object keys sit at the bucket root as `<style>/<codepoint>.<ext>` (`3d/1f92f.webp`,
`flat/1f92f.svg`). `fluentEmojiUrl` already builds `<base>/<style>/<codepoint>.<ext>`,
so the base maps one-to-one and no code under `src/` changes.

Objects are uploaded with `Cache-Control: public, max-age=31536000, immutable`.

**No version prefix, deliberately.** Keys are codepoint-addressed, not content-hashed,
so re-sourced artwork at the same key would be served stale for a year. The answer if
that ever happens is to upload under a `v2/` prefix *at that point* and move each app's
env var: old URLs keep working, nothing needs purging, and it is not a breaking change.
Adding the prefix now costs a path segment forever to buy nothing today.

## Phase 1 - Terraform root

`iac/` is a partly-tailored scaffold from another product. Earlier passes on master
already renamed it to `ui-sdk` and pinned the modules at `v1.0.3`, but `main.tf` still
declares `neon`, `google_main` and `clerk` modules a UI registry does not use, and both
`*.tfvars.example` files still configure them. Nothing has ever been applied. Finishing
the tailoring is this phase.

1. **Strip the unused provider modules.** Drop the `neon`, `google_main` (and commented
   `google_admin`) and `clerk` blocks from `main.tf`, the outputs that read them from
   `outputs.tf`, and their inputs from `variables.tf`. All three files in one step:
   `terraform validate` fails on a dangling `module.neon` reference until the last one
   is gone, so there is no green state in between. `hyperdrive_configs` loses its source
   with `neon`, and the module declares `hyperdrive_configs`, `d1_databases`, `queues`
   and `r2_buckets` **without defaults**, so each must still be passed explicitly.

   **A default that creates.** `realtime_enabled` defaults to **`true`**, and the module's
   `realtime.tf` creates `cloudflare_calls_sfu_app.rooms` on
   `count = var.realtime_enabled ? 1 : 0`. It is the only resource in the module that
   creates with no input from the root, so a root that simply omits it gets a Realtime SFU
   app named `<project>-rooms-<workspace>`. This root must pass `realtime_enabled = false`.
   Composing a module is not only about the inputs it demands - it is about the ones whose
   defaults are not inert.
2. **Keep the module pin at `v1.0.3`.** This step used to read "bump from `v1.0.0`",
   written against a read of `main.tf` that master had already moved past: commit
   `4e7cd10` pins every module at `v1.0.3`, so there is nothing to bump. Step 1 must
   simply not regress it. The version analysis below is kept because it is still the
   evidence that `v1.0.3` is safe for this root, and nobody had recorded it. Verified
   non-breaking for this root by reading `v1.0.0...v1.0.3`: the Cloudflare provider constraint is unchanged
   (`~> 5`), every variable the root passes keeps its shape, and everything added is
   optional - `api_key` / `email` for Global API Key auth, `r2_managed_domains`, and
   per-worker fields on `worker_apps`, which this root does not use. The one behaviour
   change is `api_token` relaxing from `nullable = false` to `default = null`: a missing
   token now reaches the provider as unauthenticated and fails at plan time instead of
   at variable validation. This root always passes one, so it never sees that path.
3. **Wire `r2_custom_domains` through the root** - add a `cloudflare_r2_custom_domains`
   variable matching the module's object type (`bucket`, `domain`, `zone_name`, optional
   `min_tls`, optional `enabled`), pass it in `main.tf`, and surface the module's
   `r2_custom_domains` output, which is already `https://<domain>`. The root does not
   wire this through today at all.
4. **Rewrite the examples.** `production.tfvars.example` gets `project_name = "ui-sdk"`,
   `cloudflare_r2_buckets = ["fluent-emoji"]`, and one `cloudflare_r2_custom_domains`
   entry for `fluent-emoji.zeroxsolutions.com` in zone `zeroxsolutions.com`.
   `backend.config.example` is untouched - its key already reads `ui-sdk/`.
   Both examples currently assign `neon_*`, `gcp_*` and `clerk_*` variables that step 1
   deletes, so a `-var-file` run against either fails on an undeclared variable until
   this step lands. `development.tfvars.example` is **deleted**: this root has no deployable and no
   development bucket, so a committed example for an environment nobody applies promises
   a mechanism that does not exist - the same reason this design carries no
   `.env.example`. Recreate it if a development environment ever gains resources.
5. **Apply** in the `production` workspace only. The module names the bucket
   `${project_name}-${logical}-${terraform.workspace}`, so the real bucket is
   `ui-sdk-fluent-emoji-production`. Nothing in the root refuses the `default` workspace,
   which would silently yield `ui-sdk-fluent-emoji-default`; the plan step is the only
   guard, so read `terraform workspace show` before planning.

### How this phase is verified

`terraform init -backend=false -input=false` fetches the private modules and providers
with **no credentials at all** (measured 2026-08-20), and `terraform validate` then
checks the whole root. That is the red/green loop for steps 1 to 4: on the untouched
root `validate` reports `Success! The configuration is valid.`, and removing
`module "neon"` alone reports `Reference to undeclared module` at `main.tf:18,20,21` and
`outputs.tf:13`. Only step 5 needs credentials.

`ci.yml` runs `terraform fmt -check` over every directory holding a tracked `.tf`, so
the edited files must be formatted. Note it checks `.tf` only - `*.tfvars.example` is
not covered by that gate and has to be formatted deliberately.

**Toolchain discrepancy to settle first.** `.tool-versions` pins `terraform 1.15.8`, but
asdf has no terraform plugin installed, the binary on PATH is Homebrew's 1.14.8, and
`ci.yml` uses `hashicorp/setup-terraform@v4` with no version input, which installs
latest. Three different versions decide one `fmt -check` gate. Install the pinned
version before formatting anything.

**Applied 2026-08-20**, `production` workspace: bucket
`ui-sdk-fluent-emoji-production` and its custom domain, 2 added. The zone lookup the
module does with `data "cloudflare_zone"` resolves - `zeroxsolutions.com` is on this
account. `https://fluent-emoji.zeroxsolutions.com/3d/1f92f.webp` answers 404 over a
valid certificate, which is the empty bucket rather than a broken hostname.

The root authenticates with the account's **Global API Key + email**, not a scoped
token. That is the credential the org's other Terraform roots use, and wiring it meant
adding `cloudflare_api_key` / `cloudflare_email` to the root - the module already
accepted both styles. A scoped token limited to R2 plus this one zone is the better
credential and the root still takes one; nothing about the applied resources changes if
it is swapped in.

## Phase 2 - the sync tool

Depends on phase 1: the bucket name and public URL come from `terraform output`.

### Units

| File | Responsibility | Pure |
| --- | --- | --- |
| `packages/fluent-emoji/tools/r2-sync/sync-plan.ts` | file path -> object key, extension -> content type, and `(local manifest, remote manifest) -> { upload, skip, orphan }` | yes |
| `packages/fluent-emoji/tools/r2-sync/sync-plan.spec.ts` | its tests | |
| `packages/fluent-emoji/tools/r2-sync/main.ts` | walk `assets/` and stream MD5, paginate `ListObjectsV2`, `PutObject` with bounded concurrency, parse flags, validate env, structured logs, exit code | no |

The split exists so the decision logic is testable without a network or credentials.

### How incremental works

R2 returns the object MD5 as the ETag for objects written by a single `PutObject`. The
tool calls `PutObject` directly and never `lib-storage`'s multipart `Upload`, so the
ETag is an MD5 by construction rather than by luck about file sizes - though the largest
asset is 1.33 MB (`flat/1f1f8-1f1fb.svg`, measured 2026-08-20), far under any multipart
threshold. So the plan compares the local file's MD5 against the remote ETag: equal
means skip. Listing 9217 objects is about ten
paginated calls; the second sync onward uploads nothing.

`--dry-run` prints the plan and uploads nothing. `--prune` deletes remote objects absent
from `assets/`, and is **off by default** - adding a file is safe, removing one is not.
The planner reports every remote key as an orphan when the local list is empty, which is
what a mistyped assets directory produces, so `main.ts` refuses `--prune` on an empty
local list rather than emptying the bucket.

### Configuration

Read from the environment; nothing loads a file. `main.ts` validates all four at startup
and exits non-zero naming the missing one, which is what keeps a forgotten variable from
surfacing as an opaque 403.

| Variable | Use |
| --- | --- |
| `R2_ACCOUNT_ID` | endpoint `https://<id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | SigV4 |
| `R2_SECRET_ACCESS_KEY` | SigV4 |
| `R2_BUCKET` | bucket name, from `terraform output r2_bucket_names` |

The token is **Object Read & Write scoped to this bucket**. Admin tokens cannot be
bucket-scoped, so an Admin token would carry account-wide R2 write access for a job that
writes one bucket.

Logs are structured JSON on stdout and never include a key or secret.

### nx target

```jsonc
// packages/fluent-emoji/package.json -> nx.targets
"r2:sync": {
  "executor": "nx:run-commands",
  "options": { "cwd": "{projectRoot}", "command": "node tools/r2-sync/main.ts" }
}
```

**The nx project name is `fluent-emoji`, not `@zeroxsolutions/fluent-emoji`** - its
`package.json` sets `nx.name`, which overrides the scoped name the graph would otherwise
key on. So the target is invoked as `nx r2:sync fluent-emoji`; the scoped form fails with
`Could not find project`. This departs from what `naming-projects` prescribes (a project
is addressed by its scoped `package.json#name`), and predates this design - fixing it
means renaming the project, which is its own change with its own blast radius.

Node 24.14.1 strips types natively, so the script runs without `jiti`, `tsx` or a build
step. No `dependsOn: ["^build"]`: the sync reads `assets/`, which is the committed
source, not the `dist/assets/` copy the vite plugin makes.

**Deviation from `deploy-via-nx-per-env`.** That rule puts environments under
`configurations` with `defaultConfiguration: development`. There is one environment here
by the decision above, so there is nothing to configure. Recorded in `CLAUDE.md` so the
missing block reads as a choice rather than an omission.

### Gate coverage

Two config files must widen or the new code is invisible to the gate:

- `vite.config.mts` `test.include` is `{src,tests}/**`, so `tools/**` must be added or
  `sync-plan.spec.ts` never runs.
- `tsconfig.spec.json` `include` must add `tools/**/*.ts`. `tsconfig.lib.json` has
  `rootDir: "src"` and will not cover `tools/`, so without this the script and its spec
  are never type-checked.

Tests cover: identical ETag skips, differing ETag uploads, absent remote uploads, remote
key with no local file becomes an orphan, content type follows the extension, object key
follows the path. Each must be seen failing for its own reason first.

## Prose this change falsifies

- `packages/fluent-emoji/README.md` - the section "Deploying the animated style to a
  CDN" documents a manual `aws s3 sync assets/anim` and the two-base setup via
  `setFluentEmojiStyleBase('anim', ...)`. Both become wrong: one base serves all five
  styles. Rewrite it in the same change, do not leave it for later.
- `CLAUDE.md` - the Configuration table gains the four `R2_*` rows; the choices section
  gains the bucket, environment and `configurations` deviations; the line calling `iac/`
  an untouched scaffold stops being true once phase 1 lands.
- `.gitignore` has no `.env*` entry. This is the change that first puts R2 secrets on
  developer machines, so it adds one.
