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

Keep the `@chiselart/source` export condition and omit the `"files"` field so
workspace consumers hot-iterate on `src/` (per nx-workspace.md).
