# CLAUDE.md

The house design system: a shadcn **registry** plus the publishable UI packages the org's
frontends install. Nothing here is a product - no app is deployed for an end user.

## This project's choices

Where the generic rules name options, this repo selects. Only the pick, the deviation and
its cost are here.

- **Delivery - a shadcn registry, not a package.** `apps/registry-ui` serves `registry.json`
  (registry name `zeroxsolutions-ui`, 25 items: 10 `registry:component`, 13 `registry:example`,
  1 block, 1 page) at `https://ui.zeroxsolutions.com`, **which does not resolve yet**. Style
  `base-vega`, base color `neutral`, `lucide` icons, `rsc: false`. The registry publishes
  **composed items only**, so a consuming app takes primitives from shadcn's own registry.
- **`components.json` aliases deviate from the CLI defaults** - every alias points into
  `@/registry/bases/base-ui/*` rather than `@/components`, because this app *is* the registry
  source and its files must live where the registry serves them from.
- **The stamped `.prettierrc` shadcn override reaches nothing here.** It globs
  `apps/*/src/components|hooks|lib/**`, but the aliases above put those files under
  `apps/registry-ui/registry/bases/base-ui/` - so the repo that *authors* the shadcn items is
  the one repo whose items that formatting never touches. Kept byte-identical to the stamp
  anyway; re-pointing the glob is a deviation that needs its own decision.
- **Build & test tooling** - `@nx/js/typescript` (build + typecheck), `@nx/vite`, `@nx/next/plugin`
  for the registry app; **vitest** for unit, **Playwright** for e2e, `@nx/eslint` for lint. One
  unit runner throughout - this repo has no jest, where the backend repos deliberately split.
- **No deployable target exists.** No project carries a `wrangler.*` config or a
  `wrangler:deploy` target, yet `cd.yml` asks `nx-deploy` for exactly that. The job is a
  **green no-op**, not a red pipeline - `nx run-many -t wrangler:deploy` matches no project and
  exits 0 with `No tasks were run` (measured on run 32446129678, branch `development`). That is
  the defect: nothing reports that the registry never shipped. Either give `registry-ui` a real
  deploy target or drop the job.
- **`iac/` provisions exactly one thing: the artwork bucket.** The root composes only
  `tf-modules//cloudflare` (`v1.0.3`) and declares one R2 bucket, `fluent-emoji`, served
  at `https://fluent-emoji.zeroxsolutions.com`. The `neon`, `google_main` and `clerk`
  modules were scaffold from another product and are gone - a UI registry has no
  database, no Firebase project and no auth provider. `hyperdrive_configs` is passed
  empty because the module requires it, not because a Hyperdrive config is coming.
  **`realtime_enabled = false` is passed deliberately**: it is the module's only input
  that defaults to creating something, so a root that simply omits it gets a Realtime SFU
  app named `<project>-rooms-<workspace>`. Composing a module is about the defaults that
  are not inert, not only the inputs it demands.
  Editing the root is verified with **no credentials**: `terraform init -backend=false`
  fetches the private modules and providers, and `terraform validate` then checks the
  whole root. Only `apply` needs a key.
- **Only the `production` workspace is applied, and there is no development bucket.**
  The artwork is byte-identical in every environment, so a second bucket would duplicate
  370 MB to serve the same bytes; local dev reads the same public URL.
  `development.tfvars.example` was deleted rather than left empty.
- **Artwork keys are codepoint-addressed at the bucket root, with no version prefix.**
  `<style>/<codepoint>.<ext>`, served `Cache-Control: public, max-age=31536000, immutable`.
  A key is not content-hashed, so re-sourced artwork at the same key would serve stale for
  a year. The answer then is to upload under a `v2/` prefix **at that point** and move each
  app's base URL: old URLs keep working and nothing needs purging. Adding the prefix now
  costs a path segment forever to buy nothing today.
- **The sync is `rclone copy`, and it carries no gate coverage.** A shell script that shells
  out to a binary has nothing the unit gate can hold, so it is verified by running it. It is
  `rclone` and not `@aws-sdk/client-s3` because the SDK sends a CRC32 header beside the
  `Content-MD5` and R2 accepts one non-default checksum - all 9217 objects failed with
  *"You can only specify one non-default checksum at a time"* (measured 2026-08-21). One
  client option fixed that one; the reason to move was that rclone absorbs the class of it
  upstream. `copy` and never `sync`: sync deletes whatever the source lacks, so a mistyped
  `assets/` would empty the bucket. There is no prune - removing an object is manual.
- **`r2:sync` is invoked as `nx r2:sync fluent-emoji`, never by the scoped name.**
  `packages/fluent-emoji/package.json` sets `nx.name`, so the graph keys on `fluent-emoji`
  and the scoped form fails with `Could not find project`. A deviation from
  `naming-projects` that predates this work; fixing it means renaming the project. The
  target also carries no `configurations` block where `deploy-via-nx-per-env` prescribes one
  per environment - there is one environment here, so there is nothing to configure.
- **The artwork ships on its own workflow, not through `cd.yml`.**
  `fluent-emoji-cd.yml` runs `nx r2:sync fluent-emoji` - a wrapper over `rclone copy` - on a
  push to `production` that touches `packages/fluent-emoji/assets/**`. It is the one workflow here that names a
  project, a path and a branch, which is exactly why it is not a job in `cd.yml` - that
  file stays identifier-free so it copies between repos. `nx-deploy` is also the wrong
  shape: it forwards only the two Cloudflare deploy secrets, so an R2 key it does not
  name never reaches the process, and it always passes `-c <env>`, which `r2:sync`
  has no configuration for.

## Workspace

- `apps/registry-ui` (`@zeroxsolutions/registry-ui`, private) - the Next.js registry host: the
  component source, `registry.json`, and the site that serves them.
- `apps/registry-ui-e2e` (`@zeroxsolutions/registry-ui-e2e`, private) - its Playwright pair.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - publishable.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - publishable.
- `packages/icons` (`@zeroxsolutions/icons`) - publishable.
- `iac/` - Terraform root, standalone (**not** an nx project). See `iac/README.md`.

Toolchain is pinned in `.tool-versions`: nodejs 24.14.1, pnpm 10.33.0, terraform 1.15.8,
rclone 1.75.0. mise installs all four, in CI too, so `iac/` and the R2 sync run the versions
this file names rather than whatever the machine happens to carry.

## Configuration

One row per environment input (see `env-input-inventory`).

| Input | Consumer | Mechanism | Required | Absent means |
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy job (reusable `nx-deploy.yml`) | CI env secret, reaching the job through `secrets: inherit`, scoped by the `development` / `production` environment | not yet | **it is already absent** - no environment here holds it (the `production` environment holds only the R2 rows below), so the deploy job runs with the value empty (measured 2026-08-21). Harmless only while `wrangler:deploy` matches no project; the first real deploy target 401s. |
| R2 backend keys | `terraform init` | `iac/backend.config` (gitignored, `*.example` committed) | yes | state cannot be read or written; no plan runs |
| `cloudflare_api_key` + `cloudflare_email` | `terraform apply` | `iac/<env>.tfvars` (gitignored, `*.example` committed) | yes | the provider 401s at plan time. The root also accepts a scoped `cloudflare_api_token` instead; it runs on the account's Global API Key because that is the credential the org's other roots already use. |
| `R2_ACCOUNT_ID` | `nx r2:sync fluent-emoji` | CI **variable**, `production` environment | yes | the tool exits 1 with `r2.config.missing` naming it, before any request |
| `R2_BUCKET` | same | CI **variable**, `production` environment | yes | same. Value is `ui-sdk-fluent-emoji-production`, from `terraform output` |
| `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` | same | CI env secrets, `production` environment | yes | **both hold the placeholder `REPLACE_ME` today.** So the run does not report a missing variable - it reports `r2.failed` with a signature error from R2. Replace with an Object Read & Write token scoped to that one bucket; an Admin token cannot be bucket-scoped and would carry account-wide R2 write. |

Environments: `development`, `production` - the branch name is the environment name, so
`cd.yml` deploys the pushed branch to the environment it is named after.
`iac/` is the exception: it is applied in the `production` workspace only, because the
one resource it declares is environment-independent.

## House libraries (catalog)

```sh
# pnpm does not hoist scoped deps to the repo root - read from a project that depends on one:
cat <project>/node_modules/@zeroxsolutions/<lib>/README.md
```

| Asset | Concern | Used by | This repo's choice |
| --- | --- | --- | --- |
| `@zeroxsolutions/icons` | the org's icon set | any frontend | authored here, not consumed here |
| `@zeroxsolutions/fluent-emoji` | Fluent emoji assets | any frontend | authored here, not consumed here |
| `@zeroxsolutions/editor-core` | editor primitives | any frontend | authored here |
| shadcn registry | composed UI items | any frontend | this repo **is** the registry - see the first choice above |

`@zeroxsolutions/ui` is gone: the package was deleted upstream and the registry replaced it.
