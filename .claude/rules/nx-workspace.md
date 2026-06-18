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

Keep the generator's `"files"` field (`["dist", …]`) so `publish` ships only the
build output and never leaks `src/`. Do **not** add a `@chiselart/source` (source)
export condition — every package resolves through its built `dist` (cross-repo via
`types`/`import`, in-monorepo via TypeScript project references + a `tsc -b -w`
watcher). A source-everywhere condition collapses the workspace into one TS
program (IDE RAM) and lies about what a dist-only tarball ships. See
[pm.md](pm.md) for the full rationale; scaffold via the generator (above).

## IaC owns infra naming

Cloudflare data resources are provisioned via Terraform. Match the
terraform-computed names in wrangler config; never hand-name or hand-create.

## Read the live docs, don't trust stale memory

Nx moves fast and this workspace is pinned (`nx` is **22.7.1** — confirm in the
root `package.json` before relying on a version-specific feature). Before any
non-trivial Nx operation — choosing a generator, changing target defaults,
touching `nx release` or `nx sync`, debugging the cache — fetch the current
official docs rather than answering from training data, which lags the pinned
version.

- **Docs index for agents:** <https://nx.dev/llms.txt> — lists every section.
- **Raw Markdown:** append `.md` to any `nx.dev` doc URL to fetch the page as
  clean Markdown (e.g. `https://nx.dev/reference/project-configuration.md`).
  Prefer this over the rendered HTML when reading programmatically.
- **AI / agent integration:** <https://nx.dev/features/enhance-AI> and the MCP
  reference at <https://nx.dev/docs/reference/nx-mcp>. The Nx MCP server (set up
  via `npx nx configure-ai-agents`) exposes the project graph and generators to
  agents live — use it when available instead of guessing project structure.
