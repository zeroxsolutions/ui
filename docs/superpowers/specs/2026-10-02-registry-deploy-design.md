# Spec (c7): ship the registry

Date: 2026-10-02. Finishes `2026-09-28-registry-ui-deploy-design.md`, whose worker config, OpenNext
adapter, `wrangler:build` and `wrangler:dev` landed; its deploy target never did. Where the two
disagree, this one holds.

## Why

`https://ui.zeroxsolutions.com` does not resolve, so every item's `registryDependencies` URL and
every install command on the docs site point at nothing. `cd.yml`'s `deploy` job already runs
`wrangler:deploy` for the pushed branch's environment, and no project declares that target, so it
exits 0 with `No tasks were run`.

Success is three observations:

- a push to `production` turns `cd.yml` green, and `curl https://ui.zeroxsolutions.com/r/registry.json`
  answers `200` with `"name": "zeroxsolutions-ui"`;
- the docs site at that host serves `/`, a docs page and its share image;
- in a clean consumer app, `pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/<item>.json`
  installs one composed item and its `registryDependencies`, and prompts to overwrite no primitive.

## The plan's limits

The account is on Workers Paid. Cloudflare's limits page (read 2026-10-02) has no compressed size
limit any more: "There is no compressed size limit. Only the uncompressed bundle size counts", 64 MiB
on both plans. The worker is 46168 KiB uncompressed (6410 KiB gzip), so it fits with no cut. Paid
gives each request 30 s of CPU where Free gives 10 ms, which covers the share image's `resvg` render
at request time.

## The deploy target

`apps/registry-ui/package.json` gains `wrangler:deploy` beside the targets that exist:

| Target            | Depends on       | Runs                                                                          |
| ----------------- | ---------------- | ----------------------------------------------------------------------------- |
| `wrangler:deploy` | `wrangler:build` | `opennextjs-cloudflare deploy --env <configuration>`, from the project's root |

It has the one configuration `production` and no default, so a run that names no environment
deploys nothing. `cd.yml` triggers on a push to `production` alone and calls the repository's own
`.github/workflows/nx-deploy.yml`, which runs `nx run-many -t wrangler:deploy -c production` on a
GitHub-hosted runner with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The workflows live in
this repository because it is public, and a public repository can neither call a reusable workflow
from a private one nor safely run a fork's pull request on a self-hosted runner.
`wrangler:build` declares no env input: the app inlines no `NEXT_PUBLIC_*` value, so one artifact
serves every environment.

## Environments

The registry deploys to production alone. `wrangler.jsonc` keeps its `development` environment for
`wrangler:dev`, the local preview the e2e suite runs against, which deploys nothing.

| Environment  | Host                                                                     | Ships on push to |
| ------------ | ------------------------------------------------------------------------ | ---------------- |
| `production` | `ui.zeroxsolutions.com` (custom domain), no workers.dev, no preview URLs | `production`     |

The custom domain creates its own DNS record, which works only on a zone the account owns
(Cloudflare's custom-domains page, read 2026-10-02).

## Before the first deploy (by a person)

Nothing is deployed from a session. A person:

1. confirms the `zeroxsolutions.com` zone is on the same Cloudflare account as the worker, and that no
   CNAME or other record already holds `ui.zeroxsolutions.com`;
2. creates an API token able to deploy a worker and attach its custom domain on that zone;
3. sets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the `production` GitHub environment.

The first `git push origin master:production` proves the token, the account and the domain. A 401 or
403 names the missing permission, which goes on the token.

## Checks

**E2e (one case, written to fail first).** `apps/registry-ui-e2e/src/registry.spec.ts`, against the
worker: `GET /r/registry.json` answers `200` with `name` `zeroxsolutions-ui`, and every item it lists
answers `GET /r/<name>.json` with `200` and a non-empty `content` in each of its `files`. This is the
payload a consumer's `shadcn add` reads, and today nothing checks an item's own file is served.

**After the production deploy, by hand.** On `ui.zeroxsolutions.com`: `/`,
`/docs/components/tag-input`, `/og/docs/components/tag-input` and `/r/registry.json` answer `200`, the
worker's logs show no error for them, and the three observations under Why hold.

## Docs

`AGENTS.md` under "This project's choices":

- "Nothing ships the registry yet" becomes how it ships: `wrangler:deploy` per environment, the hosts
  above, and the two secrets each environment holds.
- "The worker is over the free plan's limit" is deleted: the limit it describes no longer exists.
  Whether the worker's size still costs startup time is a question for when it shows.

`2026-09-28-registry-ui-deploy-design.md` gets one line at its top pointing here for the deploy.

## Out of scope

- Cutting the worker's size.
- A writable incremental cache, a queue or a tag cache; they arrive with the first route that sets
  `revalidate`.
- The components and blocks that fall short of the registry's requirements (spec c6).
- An automated check after deploy in `cd.yml`.
