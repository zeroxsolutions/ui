## Pin Shared Versions in the Catalog; Reach for the House Library Before Duplicating
`[MEDIUM]` `house-libs-catalog-scope`

Pin every dependency used by **two or more** workspace projects - external (`hono`, `zod`, `drizzle-orm`, `react`, `wrangler`, ...) or house-scoped (`@scope/*`) alike - in the pnpm **`catalog:`** once in `pnpm-workspace.yaml`, and reference it as `"<dep>": "catalog:"` in each package. Bump the one catalog entry to upgrade the whole monorepo at once; per-package pins drift and let two projects resolve different versions of the same dep. Named catalogs (`catalog:<name>`) group deps that must move together.

Before duplicating a helper or re-declaring a shared type, reach for the **house library that owns the concern** - the shared-utilities package, the house DB/domain toolkits, the design system (the catalog of which library owns what lives in `CLAUDE.md`) - and contribute genuinely cross-cutting code back to it rather than copying it project to project. House libraries publish under the **product-family's npm scope** (read from `CLAUDE.md` / the package `name`, never a hardcoded literal) with `publishConfig.access` set per package, released by Nx Release from conventional commits.

Treat every library reference in `CLAUDE.md` or a rule as a **pointer to the installed package, not a frozen API**: exact exports, component inventory, and peer ranges live in the installed package's types / `exports` plus the `catalog:`, and change each release - so verify against the installed artifact (and the library's Storybook, where it has one) rather than trusting the prose here as exhaustive or version-exact.

**Incorrect - per-package pins of a shared dep, or a hardcoded scope:**
```jsonc
// packages/<a>/package.json   "hono": "^4.12.0"
// packages/<b>/package.json   "hono": "^4.9.0"      // 🔴 two versions of one shared dep across the workspace
"@acme/common": "1.4.2"                              // 🔴 pinned per-package (drifts) + assumes a fixed scope
```

**Correct - one catalog entry; house scope from `CLAUDE.md`:**
```jsonc
// pnpm-workspace.yaml -> catalog: { "hono": "^4.12.12", "zod": "^4.0.0" }
// each package.json   -> "hono": "catalog:", "@scope/common": "catalog:"
// a published house lib -> "name": "@scope/common", "publishConfig": { "access": "restricted" }
```

Reference: see `lib-public-exports-and-semver`, `lib-house-toolkits`
