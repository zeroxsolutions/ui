## Manage Dependencies With pnpm
`[MEDIUM]` `stack-pnpm`

Install and manage every dependency with **`pnpm`** - never `npm` or `yarn`. Respect the workspaces declared in `pnpm-workspace.yaml`: add each package to the right workspace, and pin any version shared across projects through the workspace `catalog:` (see `house-libs-catalog-scope`). One package manager and one lockfile keep resolution deterministic across the monorepo; a stray second lockfile splits dependency resolution and corrupts it.

**Incorrect - a second package manager splits the lockfile:**
```
npm install           // 🔴 writes a second lockfile - resolution splits
yarn add react        // 🔴 not the workspace's package manager
```
**Correct - one manager, catalog-pinned shared versions:**
```
pnpm install
pnpm add react        // ✅ into the right workspace; shared/org versions pinned via catalog:
```

Reference: see `house-libs-catalog-scope`
