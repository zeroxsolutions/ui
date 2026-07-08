## Ship a Deliberate Public Surface; Release With Nx Release + SemVer
`[HIGH]` `lib-public-exports-and-semver`

When authoring a **publishable library** — a package with an `exports` map and `dist/` output — its contract is its **deliberate public surface**: anything unexported is private, so you can refactor internals without a breaking bump. Ship an ESM `exports` map (add CJS only if a consumer needs it) pointing at `dist/`, a tsconfig that emits declarations (`.d.ts`), and a **deliberate surface** — either a curated `index.ts` that exports only the contract (never `export *` of everything) **or** a `./*` subpath map mirroring `dist/` (per-file entries, no root barrel, so the consuming side imports each module from its full subpath). Keep dependencies disciplined: peers for shared runtimes, and never depend on an `apps/<app>`.

Release with **Nx Release** (`nx release`) + SemVer, versioned by conventional commits — independent per-project versions and changelogs, where a patch is safe, a minor is additive, and a major is breaking. A published patch must never break a consumer's build.

**Incorrect — barrel-export everything:**
```ts
// index.ts
export * from './internals';   // 🔴 publishes internals; any internal move is a breaking change
```

**Correct — a deliberate surface + typed exports map:**
```ts
// curated index.ts — the contract only
export { createClient } from './client.js';
// package.json — curated single entry …
"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
// … or a dist-mirrored subpath map (no root barrel):
"exports": { "./*": { "types": "./dist/*.d.ts", "import": "./dist/*.js" } }
```

Reference: [Node package `exports`](https://nodejs.org/api/packages.html#exports) · [Nx Release](https://nx.dev/features/manage-releases) · [SemVer](https://semver.org/) · see `house-libs-catalog-scope`
