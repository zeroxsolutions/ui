# AGENTS.md

The house design system: a shadcn **registry** plus the publishable UI packages the org's
frontends install. Nothing here is a product - no app is deployed for an end user.

## This project's choices

Where the generic rules name options, this repo selects. Only the pick, the deviation and
its cost are here.

- **Delivery - a shadcn registry, not a package.** `apps/registry-ui` serves `registry.json`
  (registry name `zeroxsolutions-ui`, 86 items: 42 `registry:component`, 1 `registry:block`,
  43 `registry:example`) at `https://ui.zeroxsolutions.com`, **which does not resolve yet**. Style
  `base-nova`, base color `neutral`, `lucide` icons, `rsc: false`. The registry publishes
  **composed items only**, so a consuming app takes primitives from shadcn's own registry.
- **`components.json` aliases deviate from the CLI defaults** - every alias points into
  `@/registry/bases/base-ui/*` rather than `@/components`, because this app *is* the registry
  source and its files must live where the registry serves them from.
- **`.prettierignore` names the vendored primitives at the alias paths too.** The stamped
  shadcn entries glob `apps/*/src/components/ui` and two files beside it, which the aliases
  above never write to, so three lines beside them name `registry/bases/base-ui/ui`,
  `hooks/use-mobile.ts` and `lib/utils.ts`; that is where this file departs from the stamp.
  Every primitive there is `shadcn add <item> -o` output, byte for byte, and imports `cn`
  from the `cn` package as upstream now does.
- **Animated icons come from `@lucide-animated`, addressed by full URL and never vendored.**
  467 MIT icons on Lucide + Motion, both already declared here. shadcn's public directory
  (`ui.shadcn.com/r/registries.json`) lists it, so `@lucide-animated/<icon>` resolves with no
  consumer config - but only for as long as shadcn keeps listing it, so composed items name
  `https://lucide-animated.com/r/<icon>.json` the way they already name this registry's own
  items. They stay out of `registry/` because they are `registry:ui` primitives and this
  registry publishes composed items only. **The cost:** their icons are documented as
  hover-animated; the `MenuIconHandle` ref (`startAnimation` / `stopAnimation`) that drives one
  from an open/closed state is exported and typed but undocumented, so any state-driven toggle
  built on them rests on an unpublished contract.
- **Build & test tooling** - `@nx/js/typescript` (build + typecheck), `@nx/vite`, `@nx/next/plugin`
  for the registry app; **vitest** for unit, **Playwright** for e2e, `@nx/eslint` for lint. One
  unit runner throughout - this repo has no jest, where the backend repos deliberately split.
  The e2e suite runs against the worker, not `next dev`. Its `webServer` starts
  `registry-ui:wrangler:dev` (the adapter's preview on port 8787), and the e2e target declares
  `wrangler:build` itself, because the Playwright plugin splits `wrangler:dev` at the colon and
  infers a target named `wrangler`. With `.open-next` deleted and `--skip-nx-cache`, the suite
  rebuilds the worker and passes (measured 2026-09-30).
- **The docs site is MDX through fumadocs, and every route is rendered at build.** `content/docs`
  is read by `fumadocs-mdx` 15.4.5 and `fumadocs-core` 16.15.17 on Next 16.3.7 (`fumadocs-mdx`
  needs Next >= 16.2.0, `@opennextjs/cloudflare` 1.20.7 >= 16.3.6), inside a shell built from this
  registry's own primitives. Two generated outputs are gitignored: `.source/` (target
  `fumadocs-generate`) and the demo index `examples/__index__.tsx` + `__components__.tsx` (target
  `examples-index`). `build`, `wrangler:build` and `test` depend on both; a `tsc` run by hand
  before them fails with `Cannot find module 'collections/server'`. Every route is prerendered,
  the search index, each page's `.md` and each share image included. The worker's incremental
  cache is `static-assets-incremental-cache`, which reads the build's output back and writes
  nothing, so a route rendered on a request has nowhere to be kept. `src/lib/source.spec.ts`
  holds each page to its registry item, its demo and its install command. `rehypeDocsCode` reads a
  demo's source from disk as its page compiles, so in `next dev` an edited demo shows its old
  source until the page's `.mdx` is saved again.
- **The worker is 5181 KiB gzipped**, measured with `wrangler deploy --dry-run --env production`
  on 2026-09-30. That is above the free plan's 3 MiB and below the paid plan's 10 MiB. Shiki runs
  in one server layer only: a docs page's code is highlighted as it compiles (`rehypeDocsCode`), so
  the RSC layer imports no grammar and the SSR layer holds the one set the registry's `CodeBlock`
  loads lazily. In the server output, gzipping a tar of each package directory, the Shiki grammars
  (`@shikijs/langs` 4.2.0) come to 1261 KiB, the `next` package to 3748 KiB, and the share images'
  `resvg.wasm` to 516 KiB; fumadocs-core's own Shiki 4.4.3 leaves only its manifests (3 KiB). The
  tar figure is of the whole copied directory, not of what the bundle pulls from it, and it does not
  compare with the 2710-2713 KiB recorded before, which gzipped the same directory file by file in
  `find`'s order. Each docs page also carries its whole Markdown in its RSC payload for the copy
  button, and a preview carries its highlighted lines twice (the teaser and the full source). The demos are
  lazy imports already, and a lazy chunk still ships in the worker. A deploy on the free plan needs
  that cut first.
- **No project carries a `wrangler:deploy` target yet.** `registry-ui` has its worker config
  and `wrangler:build`, but `cd.yml` asks `nx-deploy` for `wrangler:deploy`, and until that
  target exists the job is a **green no-op**: `nx run-many -t wrangler:deploy` matches no
  project and exits 0 with `No tasks were run` (measured 2026-08-21 on a `development` push).
  Nothing reports that the registry never shipped.
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
  out to a binary has nothing the unit gate can hold, so it is verified by running it - the
  first full copy moved all 9217 objects / 351.9 MiB in 15m35s from the `mac-mini` runner
  (2026-08-22). It is `rclone` and not `@aws-sdk/client-s3` because the SDK sends a CRC32
  header beside the `Content-MD5` and R2 accepts one non-default checksum - all 9217 objects
  failed with *"You can only specify one non-default checksum at a time"* (measured
  2026-08-21). One client option fixed that one; the reason to move was that rclone absorbs
  the class of it upstream. `copy` and never `sync`: sync deletes whatever the source lacks,
  so a mistyped `assets/` would empty the bucket. There is no prune - removing an object is
  manual.
- **Nothing in the sync is named for R2, so moving off it changes values and not names.**
  The target names its tool the way `wrangler:deploy` does, the variables are rclone's own
  or name the S3 API, and the only R2-specific things left are two flag values
  (`--s3-provider Cloudflare`, and `--s3-no-check-bucket` for an object-scoped token) plus
  the endpoint's value. A name that says `r2` would have to be renamed everywhere the day
  the store changes, and until that day it quietly claims the code knows something about R2
  that it does not.
- **`rclone:sync` is invoked as `nx rclone:sync fluent-emoji`, never by the scoped name.**
  `packages/fluent-emoji/package.json` sets `nx.name`, so the graph keys on `fluent-emoji`
  and the scoped form fails with `Could not find project`. A deviation from the house
  naming scheme that predates this work; fixing it means renaming the project. The target
  also carries no `configurations` block, where a deploy target elsewhere carries one per
  environment - there is one environment here, so there is nothing to configure.
- **The artwork ships from `cd.yml`'s own `rclone-sync` job, on `production` only.** It runs
  `nx run-many -t rclone:sync`, which names no project, so the job is copyable to the other
  repos the way the rest of that file is - but **until it is copied this repo's `cd.yml` is
  the one that differs**; the other 11 are still byte-identical to each other. It lived in
  its own workflow file first to get a `paths:` filter, which GitHub offers at workflow
  level and not at job level. That bought one skipped listing per production push and cost
  the copyability anyway.

## Workspace

- `apps/registry-ui` (`@zeroxsolutions/registry-ui`, private) - the Next.js registry host: the
  component source, `registry.json`, and the site that serves them with its docs at `/docs`.
- `apps/registry-ui-e2e` (`@zeroxsolutions/registry-ui-e2e`, private) - its Playwright pair.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - publishable.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - publishable.
- `packages/icons` (`@zeroxsolutions/icons`) - publishable.
- `iac/` - Terraform root, standalone (**not** an nx project). See `iac/README.md`.

Toolchain is pinned in `.tool-versions`: nodejs 24.14.1, pnpm 10.33.0, terraform 1.15.8,
rclone 1.75.0. mise installs all four, in CI too, so `iac/` and the R2 sync run the versions
this file names rather than whatever the machine happens to carry.

## Configuration

One row per environment input.

| Input | Consumer | Mechanism | Required | Absent means |
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy job (reusable `nx-deploy.yml`) | CI env secret, reaching the job through `secrets: inherit`, scoped by the `development` / `production` environment | not yet | **it is already absent** - no environment here holds it (the `production` environment holds only the R2 rows below), so the deploy job runs with the value empty (measured 2026-08-21). Harmless only while `wrangler:deploy` matches no project; the first real deploy target 401s. |
| R2 backend keys | `terraform init` | `iac/backend.config` (gitignored, `*.example` committed) | yes | state cannot be read or written; no plan runs |
| `cloudflare_api_key` + `cloudflare_email` | `terraform apply` | `iac/<env>.tfvars` (gitignored, `*.example` committed) | yes | the provider 401s at plan time. The root also accepts a scoped `cloudflare_api_token` instead; it runs on the account's Global API Key because that is the credential the org's other roots already use. |
| `RCLONE_S3_ENDPOINT` | `nx rclone:sync fluent-emoji` | CI **variable**, `production` environment | yes | the wrapper exits 1 with `rclone.config.missing` naming it, before any request. Without that guard rclone reaches **AWS** and returns 403, which reads as a bad credential (measured 2026-08-22). Value is `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | same | CI **variable**, `production` environment | yes | same guard. The one input that keeps a house name, because rclone has no variable for it: there is no `--s3-bucket` flag, and `RCLONE_S3_BUCKET` is read by nothing - set it and leave the destination bare and rclone calls `ListBuckets` on the root (measured 2026-08-22). The bucket is the destination path, `:s3:<bucket>`. Value is `ui-sdk-fluent-emoji-production`, from `terraform output` |
| `RCLONE_S3_ACCESS_KEY_ID` + `RCLONE_S3_SECRET_ACCESS_KEY` | same | CI env secrets, `production` environment | yes | same guard. A **wrong** value fails differently and later - rclone reports a signature error per object, so the job goes red mid-transfer rather than at the first line. The token is Object Read & Write scoped to that one bucket; an Admin token cannot be bucket-scoped and would carry account-wide R2 write. |

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
| `@zeroxsolutions/icons` | the org's icon set | any frontend | authored here; the AI Provider Picker block and the docs' icons page import it |
| `@zeroxsolutions/fluent-emoji` | Fluent emoji assets | any frontend | authored here; the emoji picker and emoji appearance toggle group components, and the editor's callout block, import it |
| `@zeroxsolutions/editor-core` | editor primitives | any frontend | authored here |
| `@zeroxsolutions/routing` | route units: a path's pattern and its URL builder | any frontend | `0.0.7`, one declarer; `src/routes/app-routes.ts` declares each path the site links to, and `app-routes.spec.ts` holds each to a page |
| shadcn registry | composed UI items | any frontend | this repo **is** the registry - see the first choice above |
| `@lucide-animated` | animated icons | any frontend | consumed as a registry dependency, never vendored - see the choice above |

`@zeroxsolutions/ui` is gone: the package was deleted upstream and the registry replaced it.
