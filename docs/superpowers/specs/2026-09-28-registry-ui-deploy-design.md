# Deploy registry-ui to ui.zeroxsolutions.com

> The deploy target and its checks are `2026-10-02-registry-deploy-design.md`'s; where the two disagree, that one holds.

## Goal

`apps/registry-ui` ships as a Cloudflare Worker through the OpenNext adapter, so that a
consumer's `npx shadcn add https://ui.zeroxsolutions.com/r/<item>.json` resolves and
installs. Today the host does not resolve and `cd.yml`'s deploy job matches no project.

Success is two observations:

- a push to `production` goes green in `cd.yml` and
  `curl https://ui.zeroxsolutions.com/r/registry.json` answers `200` with
  `"name": "zeroxsolutions-ui"`;
- in a clean consumer on `base-vega`, `shadcn add` of one composed item from that host
  installs it without prompting to overwrite a primitive.

## Requirements this builds on

Set earlier in this working session, and still true of the code:

- **The registry publishes composed items only.** Primitives stay in
  `registry/bases/base-ui/ui/` so the docs can render and show them, and a consumer takes
  them from shadcn's own registry. A published primitive landed on the consumer's
  `components/ui/*` and `lib/utils.ts` and prompted to overwrite them, so `button` and
  `utils` were removed.
- **Items name each other by full URL**, `https://ui.zeroxsolutions.com/r/<name>.json`,
  because `@zeroxsolutions` is not in shadcn's public directory and a namespace would
  make every consumer configure it. This deploy is what makes those 11 URLs resolve.
- **Animated icons come from `@lucide-animated` by full URL**, never vendored
  (`CLAUDE.md`).
- **The docs site follows shadcn's docs, as designed in `ui.pen`**: components index,
  component detail, blocks index, charts index. It is not built yet. It is why the app
  keeps a server runtime (below) rather than a static export.

The `docs-site` capability deleted in `bea5fb0` required a static export on an
assets-only Worker. It is outdated and this design replaces it.

## Decisions

| Question      | Decision                                                                           | Why                                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime       | OpenNext (`@opennextjs/cloudflare`) on Workers                                     | the house pattern, as in travel's `marketing-site`; the docs site to come keeps server rendering available                                                              |
| Cache store   | `static-assets-incremental-cache`                                                  | no route declares `revalidate`; it reads the build output back through `ASSETS` and writes nothing, so no R2 bucket, Durable Object or self-reference binding is needed |
| `development` | `*.workers.dev` only, no custom domain                                             | a second registry hostname is one a consumer could write into `components.json`                                                                                         |
| `production`  | custom domain `ui.zeroxsolutions.com`, `workers_dev: false`, `preview_urls: false` | one public host for the registry                                                                                                                                        |
| Domain owner  | the app's `wrangler.jsonc`, shipped by its deploy                                  | routes and domains ship with the worker; `iac/` is not touched                                                                                                          |

## Files

All under `apps/registry-ui/` unless named otherwise.

| File                                         | Change                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open-next.config.ts`                        | new: `defineCloudflareConfig({ incrementalCache })` with the static-assets cache                                                                                                                                                                                                     |
| `next.config.mjs` (renamed from `.js`)       | call `initOpenNextCloudflareForDev()` in the development-server phase only; set `output: 'standalone'`                                                                                                                                                                               |
| `wrangler.jsonc`                             | new: worker `ui-sdk-registry-ui`, `main: ".open-next/worker.js"`, `assets` over `.open-next/assets` bound as `ASSETS`, `nodejs_compat` + `global_fetch_strictly_public`, a current `compatibility_date`, `dev` ports pinned, `env.development` and `env.production` as decided above |
| `package.json`                               | the four targets below; `@opennextjs/cloudflare` pinned in `dependencies` (the worker bundle imports its cache override) and `wrangler` in `devDependencies`                                                                                                                         |
| `cloudflare-env.d.ts`                        | generated by `wrangler:typegen`, committed so a `wrangler.jsonc` change shows in the diff; ignored by eslint and prettier                                                                                                                                                            |
| `apps/registry-ui-e2e/playwright.config.mts` | web server becomes `@zeroxsolutions/registry-ui:wrangler:dev`                                                                                                                                                                                                                        |
| `apps/registry-ui-e2e/src/registry.spec.ts`  | new spec, below                                                                                                                                                                                                                                                                      |
| `CLAUDE.md`                                  | replace the "No deployable target exists" choice; update the `CLOUDFLARE_API_TOKEN` row and add `CLOUDFLARE_ACCOUNT_ID`                                                                                                                                                              |

`.open-next` is already in `.gitignore` and `.prettierignore`.

## Targets

| Target             | Depends on               | Runs                                                                                                          |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `wrangler:build`   | `^build`, `shadcn-build` | `rm -rf .open-next && next build && opennextjs-cloudflare build --skipNextBuild`; output `.open-next`, cached |
| `wrangler:deploy`  | `wrangler:build`         | `opennextjs-cloudflare deploy --env <env>`; configurations `development` (default) and `production`           |
| `wrangler:dev`     | `wrangler:build`         | `opennextjs-cloudflare preview --env development`; `continuous: true`                                         |
| `wrangler:typegen` | -                        | `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`                                            |

`shadcn-build` is in `wrangler:build`'s `dependsOn` because `public/r` is copied into
`.open-next/assets` only if it exists when the adapter runs. The app reads no
`NEXT_PUBLIC_*` variable, so `wrangler:build` declares no env input.

## Delivery

`cd.yml` is unchanged: its `deploy` job already runs `wrangler:deploy` with
`-c <branch>`, and now finds this project.

Before the first deploy a person sets, in both the `development` and `production`
GitHub environments, the two secrets `nx-deploy.yml` forwards:

- `CLOUDFLARE_API_TOKEN`: Workers Scripts Write, the one permission Cloudflare's
  attach-a-domain endpoint accepts (`/api/resources/workers/subresources/domains/methods/update/`
  on developers.cloudflare.com, read 2026-09-28); the custom domain creates its own DNS
  record, so no DNS permission is added. The first deploy is what confirms it;
- `CLOUDFLARE_ACCOUNT_ID`.

Nothing is deployed from a session.

## Verification

- **The gate builds the shipped artifact.** The e2e project runs against `wrangler:dev`,
  which depends on `wrangler:build`, so CI's `e2e` job builds `.open-next` rather than
  only `next build`.
- **New spec, written to fail first:** against the worker, `GET /r/registry.json`
  answers `200`, `name` is `zeroxsolutions-ui` and `items` has 25 entries; `GET
/r/<one composed item>.json` answers `200` with a non-empty `files[].content`.
- **By hand after the first production deploy:** the `curl` and the clean-consumer
  `shadcn add` from the goal.

## Out of scope

- `/api/hello` stays as it is.
- A writable cache, a queue or a tag cache; they arrive with the first route that sets
  `revalidate`.
- The docs pages themselves.
