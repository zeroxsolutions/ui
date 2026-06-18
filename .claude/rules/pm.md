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

Keep **both** the `@chiselart/source` export condition **and** the generator's
`"files"` field (`["dist", "!**/*.tsbuildinfo"]`) — they serve two unrelated
concerns, don't conflate them:

- **`@chiselart/source` → `src/`** lets consumers *inside this monorepo* (linked
  via `workspace:*`) hot-iterate on source through the package **symlink**, no
  rebuild. It resolves off the symlinked package directory (which always has
  `src/`) and has nothing to do with what gets published.
- **`files`** scopes the *published* npm tarball to build output only, so
  `nx release` / `publish` **never ships `src/`** — source is not leaked when a
  package goes to a public registry. `files` affects **only** the tarball, never
  in-monorepo resolution.

Do **not** drop `files` to "help hot-iterate" — it does not (the symlink + the
source condition already do), and dropping it leaks `src/` on publish. A
published package ships `dist/` (JS + `.d.ts`); cross-repo consumers resolve it
via `types` / `import` (dist). Scaffold with the generator (nx-workspace.md —
"generators, never hand-scaffolding"); it wires both correctly — keep its output.
