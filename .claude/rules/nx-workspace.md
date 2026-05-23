---
description: Nx monorepo rules — generators over hand-scaffolding, nx owns versioning/targets, IaC owns infra naming.
---

# Nx workspace rules

Applies to this Nx + pnpm monorepo and sibling chiselart repos. These are
principles, not a command cookbook — check the target repo before running.

## Generators, never hand-scaffolding

Create / remove / rename projects with `pnpm nx g …`. Hand-rolled config drifts
from TS references, target defaults, and lint/test wiring, and breaks
`nx sync` + CI. Plugin availability differs per repo — check before choosing a
generator.

## Keep framework defaults

A generated default is a deliberate choice. Don't narrow it without a concrete
reason it is wrong for this repo.

## `nx release` owns versions

Never hand-edit `version` in a publishable `package.json`. The release flow
bumps version + changelog + tag + publish coherently across dependents.

## `nx` targets, not raw CLIs

Run targets via Nx (`build` / `deploy` / `serve` / `test` / `typecheck`), never
the underlying tool — targets carry ordering, env, and cache contracts.
Exception: the user explicitly asks for the raw command.

## Publishable `@chiselart/*` packages

No `"files"` field; keep the `@chiselart/source` export condition so workspace
consumers hot-iterate on `src/`.

## IaC owns infra naming

Cloudflare data resources are provisioned via Terraform. Match the
terraform-computed names in wrangler config; never hand-name or hand-create.
