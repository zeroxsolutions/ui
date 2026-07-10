## 1. Build refactor + brands relocation (prove green in isolation)

- [x] 1.1 Branch onto `feat/material-icons` (current branch is `master`; see `worktree-per-task`).
- [x] 1.2 Move `src/github-mark.tsx` and `src/brand-marks/*` → `src/brands/*` (keep each mark's current API); delete the emptied `brand-marks/` dir.
- [x] 1.3 Rewrite `vite.config.mts` (D1): key each entry by the `src`-relative path minus extension (`brands/deepgram`), not `basename`; remove the basename-collision guard.
- [x] 1.4 Rewrite the `dts` config (D2): drop `beforeWriteFile` flattening + `flattenSpecifiers`; rely on `entryRoot: 'src'` to emit nested `dist/**/*.d.ts`.
- [x] 1.5 Update the 5 brand-mark imports in `apps/storybook/src/icons/brand-marks.stories.tsx` to `@zeroxsolutions/icons/brands/*`.
- [x] 1.6 Build the package and confirm nested output: `dist/brands/deepgram.js` + `.d.ts` exist; `build`/`typecheck`/`test @zeroxsolutions/icons` green with brands only (no `lint` target on this project — `typecheck` is its static gate).
- [x] 1.7 Verify D3: a smoke import of `@zeroxsolutions/icons/brands/deepgram` resolves against the nested `dist/` — `"./*"` matches nested subpaths, no `package.json` change needed.

## 2. One-time conversion pipeline (throwaway — scratchpad, not committed)

- [x] 2.1 Reuse the sparse clone of `material-extensions/vscode-material-icon-theme/icons` (already in scratchpad); confirmed 633 file icons (46 `_light` pairs), 270 `folder-*` excluded.
- [x] 2.2 Built a throwaway dependency-free Node transform (`scratchpad/convert.mjs`): per-icon `id` namespacing (`mi-<name>-`), React attribute casing, style filtered to a rendering-relevant allowlist → compound `.tsx` from one template (base; `.Light` where a `*_light` sibling exists). Not committed.
- [x] 2.3 Encoded the naming rule (D6): symbol = PascalCase + `Icon`, leading digit spelled (`3d` → `ThreeDIcon`); filename = kebab, `_` → `-`; `*_light` merged, never its own file.
- [x] 2.4 Verified representative outputs (typescript, 3d, bun `.Light`, aurelia gradient/id-prefixing, style-attr icons) against source.

## 3. Generate the `material/` set (subagent fan-out)

- [x] 3.1 Ran the transform → `src/material/*.tsx`: 587 base components, 46 with `.Light`, 0 collisions, 0 orphan lights.
- [x] 3.2 Fanned out 4 parallel sonnet auditor subagents over disjoint ranges (a–d/e–l/m–r/s–z): full-range greps for leaked attrs + dangling id refs, deep sample vs source (viewBox, paths, colors, id-prefix, `.Light`, symbol naming).
- [x] 3.3 All 4 auditors reported CLEAN (0 leaked attrs, 0 dangling refs, byte-identical paths/colors, correct `.Light` on all 46) — nothing to reconcile.

## 4. Storybook catalog + attribution

- [x] 4.1 Added `apps/storybook/src/icons/material.stories.tsx` — `Icons/Material` with an `Overview` grid (~43 icons) and a `LightVariants` story showing default vs `.Light` on dark/light surfaces.
- [x] 4.2 Rewrote `packages/icons/README.md`: `material/` + `brands/` categories, the compound API (`Icon` / `Icon.Light` / `Mark`), and the Material Icon Theme **MIT** attribution.

## 5. Validation

- [x] 5.1 `nx build typecheck test @zeroxsolutions/icons` green with the full set (643 tests). No `lint` target on this project.
- [x] 5.2 Retained smoke test (`src/material/material.spec.tsx`): every `material/*` module exports a renderable non-empty svg; the 46 `.Light`-bearing icons render `.Light`.
- [x] 5.3 Render-together check: all 587 icons rendered, every internal id globally unique — no cross-icon collision (D5).
- [x] 5.4 Category resolution: `brands/*` and `material/*` (incl. `3d`, `bun`+`.Light`, `aurelia`) resolve through the built package via the `./*` exports map.
- [x] 5.5 `nx build-storybook @zeroxsolutions/storybook` succeeded — both stories bundle and resolve.
- [x] 5.6 Rule-audit done (see plan Execution Notes / verification.md): compliant with `lib-public-exports-and-semver`, `naming-files-and-symbols`, `worktree-per-task`; no new deps (`house-libs-catalog-scope`, `stack-pnpm`); no new project (`gen-via-generator`). Pre-existing unrelated `@zeroxsolutions/ui:typecheck` error noted, out of scope.
