# Package manager rules

Applies to dependency and script management across this Nx + pnpm monorepo.
Principles, not a command cookbook — check the target project before running.

## pnpm only

This workspace is pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). Never run
`npm` or `yarn` — a foreign lockfile or `node_modules` shape corrupts installs
and CI. There is one lockfile at the root; it is committed and authoritative.

## Add and remove deps through pnpm

Use `pnpm add` / `pnpm remove`, never hand-edit `dependencies` in a
`package.json`. Target the right project with `--filter <project>`; the root is
for workspace-wide devtools only. Workspace packages link via `workspace:*`, not
pinned versions copied by hand.

## Never hand-edit the lockfile

`pnpm-lock.yaml` is generated. Resolve conflicts by re-running the install, not
by editing the file. `autoInstallPeers` is on (see `pnpm-workspace.yaml`) — let
pnpm resolve peers rather than pinning them manually.

## Versions belong to `nx release`

Never hand-bump `version` in a publishable `package.json`. Cross-cuts
[nx-workspace.md](nx-workspace.md) — the release flow owns version + changelog +
tag + publish coherently across dependents.

## Run scripts through Nx targets

Invoke `build` / `test` / `serve` / `typecheck` via `pnpm nx`, not the raw tool
or a bare `pnpm <script>` that bypasses target ordering, env, and cache.
Exception: the user explicitly asks for the raw command. See
[nx-workspace.md](nx-workspace.md).

## Publishable `@chiselart/*` packages

Keep the generator's `"files"` field (`["dist", "!**/*.tsbuildinfo"]`) and do
**not** ship a `@chiselart/source` (source) export condition. Every consumer —
in-monorepo and cross-repo — resolves a package through its built `dist` (the
published contract); there is no source export condition anywhere.

- **`files`** scopes the *published* npm tarball to build output only, so
  `nx release` / `publish` **never ships `src/`**. A published package ships
  `dist/` (JS + `.d.ts`); consumers resolve it via `types` / `import` (dist).
- **In-monorepo dev** resolves siblings via **TypeScript project references**
  (`composite` + `references`, already wired), so the editor reads each
  package's `.d.ts` and `declarationMap` keeps Go-to-Definition into source.
  Hot-iterate a package by running its build in watch (`tsc -b -w` / `nx watch`)
  so its `dist` re-emits.

Do **not** re-introduce a `@chiselart/source` (or any source) export condition:
resolving every dependency to its `src/` collapses the whole workspace into one
giant TypeScript program (IDE RAM/lag), and makes a dist-only published package
advertise a condition it can't satisfy. Scaffold with the generator
(nx-workspace.md — "generators, never hand-scaffolding") and keep its
`dist`-only output.
