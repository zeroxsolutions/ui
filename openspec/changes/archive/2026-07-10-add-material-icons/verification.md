# Verification — add-material-icons

## Completion Decision

**Complete.** All tasks (1.1–5.6) done; build/typecheck/test/build-storybook green.
One out-of-scope, pre-existing failure noted under Residual Risks (does not block
this change).

## Commands Run

- `nx build @zeroxsolutions/icons` → ✓ nested output `dist/{brands,material}/*.js` (592 modules, ~3.2s).
- `nx typecheck @zeroxsolutions/icons` → ✓ (tsc over all 587 material + 5 brands).
- `nx test @zeroxsolutions/icons` → ✓ **643 tests** (587 render + 46 `.Light` render + id-uniqueness + 6 brand + counts).
- `node` ESM smoke import (from storybook node_modules): `material/typescript` → `TypescriptIcon`,
  `material/3d` → `ThreeDIcon`, `material/bun` → `BunIcon` + `.Light` (function), `material/aurelia` → `AureliaIcon`,
  `brands/deepgram` → `DeepgramMark` — all resolve via the `./*` exports map (nested, no package.json change).
- `nx build-storybook @zeroxsolutions/storybook` → ✓ built; both `Icons/Brand Marks` and `Icons/Material` bundle.

## Manual Checks

- **Conversion fidelity** — 4 parallel sonnet auditor subagents over disjoint ranges (a–d/e–l/m–r/s–z),
  full-range greps + deep sampling against source SVGs. All four returned **CLEAN**: 0 leaked un-cased
  attributes, 0 dangling id refs, viewBox/paths/colors byte-identical to source, id-prefix consistent
  (`mi-<name>-`, `.Light` uses `mi-<name>-l-`), `.Light` present iff a `_light` source sibling exists,
  symbol naming correct on edge cases (`3d`→`ThreeDIcon`, `d`→`DIcon`, `pm2-ecosystem`→`Pm2EcosystemIcon`).
- **Representative outputs** hand-checked (typescript, 3d, bun `.Light`, aurelia gradients, style-attr icons).

## Evidence

- Test run: `2 files passed, 643 tests passed`.
- Build: `dist/material/*.js` (587) + `dist/brands/*.js` (5), nested `.d.ts` mirrored.
- Storybook: `storybook-static/` built; “Storybook build completed successfully”.
- Set: 587 base components + 46 `.Light`; 270 `folder-*` excluded; 0 collisions, 0 orphan lights.

## Rule Audit (staged diff vs `.agents/rules/*`)

- `lib-public-exports-and-semver` — **compliant**: ESM `"./*"` dist-mirrored subpath map (no root barrel,
  no `export *`), declarations emitted nested. Breaking brand subpath rename is a deliberate surface change
  at v0.0.1 (nx release / SemVer handles the bump).
- `naming-files-and-symbols` — **compliant**: kebab-case files (`material/*`, `brands/*`), PascalCase
  symbols (`<Name>Icon` / `<Name>Mark`), no new barrels.
- `worktree-per-task` / `commit-conventions` — **compliant**: work on `feat/material-icons`; not committed
  (awaiting user request).
- `house-libs-catalog-scope` / `stack-pnpm` — **compliant**: no runtime deps added, no codegen tooling
  committed; conversion was a throwaway scratchpad script.
- `gen-via-generator` — **n/a**: no new project created; source added to the existing `packages/icons`.
- `ui-from-design-system` — **compliant**: the Storybook story adds no competing UI library; it composes
  the icon components + Tailwind utility classes only.

## Residual Risks

- **Pre-existing, out of scope:** `@zeroxsolutions/ui:typecheck` fails at `packages/ui/src/components/select-field.tsx`
  (`SelectTrigger` `variant` prop) — this branch touches no `ui` files and the file is unmodified, so the
  error predates this change. It may surface when running workspace-wide `typecheck`/pre-commit; fix belongs
  to a separate change.
- Adding `.Light` bundles the light SVG with its base (46 small icons) — negligible.
- Public surface grew by ~587 subpaths — intended; `./*` map covers them.
