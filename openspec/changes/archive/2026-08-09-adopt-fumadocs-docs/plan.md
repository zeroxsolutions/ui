## Scope

The whole change: rename `apps/registry` -> `apps/docs`, adopt fumadocs as the
docs framework (manual install + CLI), make it multi-section (general docs +
component docs), ship the component docs as a skeleton (template + MDX
components) with an "Install the library" guide for primitives, keep shadcn
primitives off per-component pages, theme to the monochrome tokens, keep
`registry.json` + `registry:example` + the iframe `/preview` routes, add a
docs-authoring rule, and rewrite the e2e.

## Covers

Tasks `1.1`-`8.4`. Validation Focus items carried forward: app renamed to
`docs` with no stale `registry` project name, static-export with no server
binding, `lint typecheck build test` green, `docs-e2e` green,
primitives-have-no-page (install guide instead), seeded page renders
Preview+Install+Props, doc-authoring rule + submodule bump committed.

## Plan Type

full - cross-module (app rename, app shell, e2e, rules submodule) and
validation-intensive.

## Execution Strategy

standard - a rename + docs-framework migration; the retained e2e is the
real-browser verification, not unit TDD.

## Ordered Steps

1. Rename `apps/registry` -> `apps/docs` (+ e2e) via `@nx/workspace:move`;
   repoint `shadcn-build` output, `registry.json#homepage`, the wrangler
   `custom_domain` (`ui.zeroxsolutions.com`), and the CLAUDE/AGENTS inventory.
2. Resolve **Q1** (theme seam) and **Q4** (seed item) with the user.
3. Add `fumadocs-core`/`fumadocs-mdx`/`fumadocs-ui` to `apps/docs`; wire the
   fumadocs Tailwind plugin; verify the version vs Next 16 / React 19 (Q3).
4. Pull the docs layout + UI components via `npx fumadocs`.
5. Add the two `loader` sources (`docs` -> `/docs`, `registry` -> `/registry`),
   the root + docs/registry layouts per Q1, the monochrome token remap, and the
   `_meta.json` sidebar groups.
6. Build `<Preview>`, `<Install>`, `<Props>`; wire them into `mdx-components`;
   seed one template page (the Q4 item); add the "Install the library" guide.
7. Delete `app/(main)/**` + `components/docs/**`; keep `app/preview/**`; fix
   `app/layout.tsx` + routing for `/`, `/docs`, `/registry`.
8. Author the docs-authoring rule in the rules repo; tag + bump the
   `.agents/rules` submodule; commit the gitlink.
9. Rewrite `apps/docs-e2e` to the `/docs` + `/registry` IA and fumadocs DOM.

## Validation Per Step

1. `nx build @zeroxsolutions/docs` resolves; `nx graph` shows no `registry`
   project; `shadcn-build` writes to `apps/docs/public/r`.
2. Q1/Q4 answers recorded in `design.md`.
3. `pnpm nx build @zeroxsolutions/docs` resolves fumadocs imports; no type
   errors against Next 16 / React 19.
4. The CLI-generated layout renders at a temp route before wiring content.
5. `/docs` and `/registry` render with generated sidebar/TOC/search; tokens are
   monochrome (no fumadocs default hue).
6. `<Preview>` shows a live example; `<Install>` shows the toggle + command;
   `<Props>` shows the TS-derived table; the install guide shows the
   `@zeroxsolutions/ui` import.
7. `app/preview/**` still builds + serves; `app/(main)` + `components/docs`
   gone; `nx build` emits `/docs` + `/registry` only.
8. `git submodule status` shows the new rules SHA; the rule file exists in
   `.agents/rules/`.
9. `pnpm nx e2e @zeroxsolutions/docs-e2e` green; specs cover the seeded page,
   the install guide, and primitives-have-no-page.

## Files / Owners

- `apps/docs` (from `apps/registry`) - rename; new `lib/source.ts`,
  `app/docs/**`, `app/registry/**`, root layout, `mdx-components`; removed
  `app/(main)/**`, `components/docs/**`.
- `apps/docs-e2e` (from `apps/registry-e2e`) - renamed; rewritten specs.
- `content/docs/**`, `content/registry/**` - new MDX + `_meta.json`.
- `packages/ui` - `shadcn-build` output repointed; `registry.json#homepage`
  updated; payload otherwise unchanged.
- `apps/docs/wrangler.jsonc` - `custom_domain` -> `ui.zeroxsolutions.com`.
- `.agents/rules` submodule - new doc-authoring rule + bump.
- `CLAUDE.md`/`AGENTS.md` - workspace inventory `apps/registry` -> `apps/docs`.

## Completion Checkpoint

All tasks `1.1`-`8.4` checked; the app is renamed `docs`; Q1/Q4 resolved;
`pnpm nx run-many -t lint typecheck build test` green; static export emits
`/docs` + `/registry` with no server binding at `ui.zeroxsolutions.com`;
`pnpm nx e2e @zeroxsolutions/docs-e2e` green; the doc-authoring rule is in
`.agents/rules/` and the submodule bump is committed; no `components/ui`
primitive has a per-component page (install guide instead).

## Completion Verification

Retained evidence before the change is called done: green gate output, green
e2e output, the static-export route list (no server binding, custom domain
`ui.zeroxsolutions.com`), the committed doc-authoring rule file +
`git submodule status`, a content-tree check confirming only the seeded
component item + the install guide are documented (zero primitive pages), and
`nx show projects` showing `@zeroxsolutions/docs` (no `registry`).
