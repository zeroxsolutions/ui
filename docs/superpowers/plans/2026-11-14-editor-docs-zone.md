# Editor docs zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve `/docs/editor` and its pages from a zone of their own, `apps/registry-editor-docs-zone`,
on `ui.zeroxsolutions.com`, with the editor demos rendered on the server there and no editor code left
in `apps/registry-ui`.

**Architecture:** Three stacked PRs, as the native split went (`docs/superpowers/plans/2026-11-03-zui-zones.md`).
PR 1 moves the editor content into `packages/editor-docs-web` and gives `ComponentPreview` its demos
through a provider, with `registry-ui` still serving every editor page. PR 2 adds the zone, its routes
and e2e; `registry-ui` stays the fallback until the zone is seen answering. PR 3 removes the editor
pages from `registry-ui`.

**Tech Stack:** Next.js 16 on OpenNext Cloudflare, fumadocs-core 16.18.4 / fumadocs-mdx 15.5.3, nx with
inferred targets, oxlint `@nx/enforce-module-boundaries`, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-editor-docs-zone-design.md`

## Global Constraints

- Names: `packages/editor-docs-web` (`@zeroxsolutions/editor-docs-web`), `apps/registry-editor-docs-zone`,
  `apps/registry-editor-docs-zone-e2e`; worker `ui-sdk-registry-editor-docs-zone`. Tags
  `type:context-frontend` + `context:editor-docs` on the package, `context:editor-docs` on the zone.
- Zone routes, production, `zone_name: "zeroxsolutions.com"`: `ui.zeroxsolutions.com/docs/editor`,
  `/docs/editor/*`, `/og/docs/editor/*`, `/llms.mdx/docs/editor/*`, `/editor-static/*`. Asset prefix
  `/editor-static`. Dev port `8789`, inspector `9231`. Production `workers_dev: false`, `preview_urls: false`.
- Every worker passes `tools/check-worker-size.sh` (58982 KiB upload).
- `registry-ui` never imports `@zeroxsolutions/editor-docs-web`, and the zone never imports
  `@zeroxsolutions/ui-docs-web`; paths in the other zone are written in each app's own `src/routes/`.
- Every link into the other zone is a plain `<a>`, never `HostLink` or `next/link`.
- Projects created with nx generators (dry run first, read the file list), inferred targets; copy the
  native zone's `wrangler.jsonc`, `next.config.mjs`, `open-next.config.ts` and `nx:run-commands` targets.
- Locally run single targets only (`pnpm nx <target> <project>`), never `affected` or a broad `run-many`.
- PATH first: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH`.
- Never `pkill` by name; stop only PIDs you started (`lsof -tiTCP:<port>` and its cwd in your worktree).
- Commits: `git commit -F <file>`, subject at most 72 characters, ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` names paths; no hook skipped;
  never stage `apps/registry-ui/next-env.d.ts` or `apps/native-preview-uniwind/uniwind-types.d.ts`.
- PR bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Merge and the
  production push only when the user asks.

## Review Focus

1. A soft navigation across zones: the docs pager, a sidebar entry or a search result from a web page
   to `/docs/editor/...` (or back) goes through the host's `push` and lands on the wrong zone's 404.
   Task 5 (search) and Task 8 (pager, sidebar) pin it.
2. An editor zone asset outside `/editor-static`: a font or CSS chunk at `/_next/...` is answered by
   `registry-ui` and 404s. Task 4's build asserts nothing at `.open-next/assets/_next`; Task 6 fails on
   any failed request.
3. A demo rendered on the server differs from the client's first render (Tiptap, CodeMirror): React
   logs a hydration error and redraws. Task 6 fails on a console error naming hydration.
4. The same page twice in search while both zones index the editor pages (between PR 2 and PR 3).
   Task 5 dedupes by URL.
5. An editor page's `.md` address or share image answered by neither zone. Task 6 requests both.

---

## Part 1 - PR 1: the package (branch `refactor/editor-docs-package`)

### Task 1: Baseline

- [ ] **Step 1:** In a fresh worktree from `origin/master`: `CI=true pnpm install --frozen-lockfile`, then
      `pnpm nx wrangler:build @zeroxsolutions/registry-ui`.
- [ ] **Step 2:** Copy the two lines `check-worker-size.sh` printed (upload, handler) into the ledger
      workspace as `baseline.md`, headed with the commit SHA. Nothing is committed.

### Task 2: Demos through a provider

The generated `examples/__components__.tsx` holds every demo; `RegistryExample` imports it directly, so
whichever app renders a preview bundles all of them. After this task each app hands in the map it wants.
The spec speaks of a second pair of index files; only the component map splits, because `__index__.tsx`
holds names and paths and no import, and `rehypeDocsCode` and `ComponentSource` read it in both zones.

**Files:**

- Modify: `packages/ui/tools/build-examples-index.mts` — writes three component maps beside the
  unchanged `__index__.tsx` (names and paths only, no imports, so both zones keep reading the one index):
  - `__components__.tsx`: every entry outside the editor set, `lazy`;
  - `__editor-components__.tsx`: the editor set, `lazy` (the editor zone's, Task 4);
  - `__editor-components-client-only__.tsx`: the editor set, `dynamic(..., { ssr: false })`
    (`registry-ui`'s until Task 8 deletes it).
    The editor set is today's `clientOnly` set. Its docblock says why there are three.
- Modify: `packages/ui/package.json` `examples-index` outputs list the two new files.
- Modify: `packages/ui/src/site/components/data-display/registry-example.tsx`.
- Modify: `apps/registry-ui/src/providers/*` (whichever renders `AppProviders`): wraps the tree in
  `RegistryExamplesProvider` with `{ ...Components, ...EditorComponentsClientOnly }`.
- Modify: `apps/registry-native-ui-docs-zone` providers, only if `git grep -n RegistryExample` reaches a
  file it renders: `RegistryExamplesProvider` with `Components`.
- Test: `packages/ui/src/site/components/data-display/registry-example.spec.tsx`,
  `packages/ui/registry/bases/base-ui/examples/examples.spec.tsx`.

**Interfaces:**

- Produces: `RegistryExamplesProvider({ components, children }: { components: Record<string, ComponentType>; children: ReactNode }): ReactNode`
  and `RegistryExample({ name }: { name: string })`, both exported from
  `@zeroxsolutions/ui/site/components/data-display/registry-example`.
- Produces: exports `Components`, `EditorComponents`, `EditorComponentsClientOnly` from the three files.

- [ ] **Step 1: Failing specs.** `registry-example.spec.tsx`:
  - `renders the demo the provider holds under name` (provider with `{ 'x-demo': () => <p>x</p> }`, `findByText('x')`);
  - `throws naming the demo when no provider holds it` (`toThrow('No example named "y-demo"')`).
    `examples.spec.tsx`: `splits the demos between the maps`: the keys of `Components` and
    `EditorComponents` are disjoint, their union is the keys of `Index`, `EditorComponents` and
    `EditorComponentsClientOnly` have the same keys, and `EditorComponents` holds `document-editor-demo`
    and `chat-input-demo` and not `code-card-demo`.
- [ ] **Step 2:** `pnpm nx test @zeroxsolutions/ui -- --run registry-example examples` fails.
- [ ] **Step 3:** Implement; regenerate with `pnpm nx examples-index @zeroxsolutions/ui`.
- [ ] **Step 4:** The specs pass; `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- component-pages.spec.ts home.spec.ts`
      passes (every editor page still draws its demo).
- [ ] **Step 5:** Commit `refactor(ui): hand the demos to the preview through a provider`.

### Task 3: `packages/editor-docs-web`

**Files:**

- Create with the nx library generator, shaped as `packages/native-ui-docs-web` (private, `type: module`,
  subpath exports): `package.json` tags per Global Constraints; `src/routes/index.ts`.
- Move (`git mv`): `packages/ui-docs-web/content/docs/editor/**` to
  `packages/editor-docs-web/content/docs/editor/**`. Root `meta.json` stays in `ui-docs-web` and keeps
  `"editor"` in `pages`.
- Modify: `.oxlintrc.jsonc` adds `{ sourceTag: 'context:editor-docs', onlyDependOnLibsWithTags: ['context:editor-docs', 'type:ui'] }`.
- Modify: `apps/registry-ui/source.config.ts` adds `editorDocs = defineDocs({ dir: '../../packages/editor-docs-web/content/docs', docs: { async: true, postprocess: { includeProcessedMarkdown: true } } })`;
  `apps/registry-ui/src/lib/source.ts` loads `multiple({ docs: docs.toFumadocsSource(), editor: editorDocs.toFumadocsSource() })`
  (from `fumadocs-core/source`), so the tree and every page are as before.
- Modify: `apps/registry-ui/package.json` `fumadocs-generate`, `build`, `wrangler:build` inputs add
  `{workspaceRoot}/packages/editor-docs-web/content/**/*`. No package dependency: `registry-ui` is
  tagged `context:ui-docs` and may not depend on `context:editor-docs`; it reads the folder, it imports nothing.
- Modify: `apps/registry-ui/src/lib/source.spec.ts` reads editor page sources from the new folder.

**Interfaces:**

- Produces: `editorDocsRoute` (builds `/docs/editor`), `editorDocsPageRoute` (`/docs/editor/<name>`),
  `editorDocsShareImageRoute` (`/og/docs/editor/<slug>`) from `@zeroxsolutions/editor-docs-web/routes`,
  written with `@zeroxsolutions/routing` as `ui-docs-web`'s routes are, with a spec of their built values.

- [ ] **Step 1:** Routes spec `builds the editor paths`: `/docs/editor`, `/docs/editor/document-editor`,
      `/og/docs/editor/document-editor/image.png`. Fails; implement; passes.
- [ ] **Step 2:** Move the content; `pnpm nx test @zeroxsolutions/registry-ui -- --run source` passes,
      and `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- component-pages.spec.ts docs` passes.
- [ ] **Step 3:** Boundary check: a scratch `import '@zeroxsolutions/ui-docs-web/routes'` in
      `packages/editor-docs-web/src/routes/index.ts` fails `pnpm nx lint @zeroxsolutions/editor-docs-web`; delete it.
- [ ] **Step 4:** Commit `refactor(editor-docs-web): hold the editor docs in a package of their own`;
      push; open PR 1; wait for checks.

## Part 2 - PR 2: the zone (branch `feat/registry-editor-docs-zone`, stacked on PR 1)

### Task 4: `apps/registry-editor-docs-zone`

**Files:**

- Create with `@nx/next:application`, then copy from the native zone and adapt:
  `wrangler.jsonc` (Global Constraints), `open-next.config.ts`, `next.config.mjs`
  (`assetPrefix: '/editor-static'`, `output: 'standalone'`, `agentRules: false`, rewrites
  `/docs/editor.md` -> `/llms.mdx/docs/editor/content.md` and `/docs/editor/:path*.md` ->
  `/llms.mdx/docs/editor/:path*/content.md`), `source.config.ts` (one collection, `dir` as Task 3's,
  `rehypeDocsCode`), `src/lib/source.ts` (`loader({ baseUrl: '/docs', source })`), `postcss.config.mjs`.
- Create: `src/app/global.css` as `registry-ui`'s, keeping the `editor/styles.css` import, with `@source`
  for `packages/ui` and `packages/editor-docs-web`.
- Create: `src/app/layout.tsx` (same `<html>` attributes, fonts, `AppProviders`, `next-themes` key as
  `registry-ui`), `RegistryExamplesProvider` with `{ ...Components, ...EditorComponents }`.
- Create route files: `src/app/docs/editor/layout.tsx`, `[[...slug]]/page.tsx`, `not-found.tsx`,
  `sitemap.ts`, `llms.txt/route.ts`, `llms-full.txt/route.ts`, `api/search/route.ts`;
  `src/app/og/docs/editor/[...slug]/route.tsx`; `src/app/llms.mdx/docs/editor/[[...slug]]/route.ts`.
  Each renders what `registry-ui`'s counterpart renders, from `ui-docs-web`-free code: the page and
  layout components come from `packages/ui`'s site components; where `registry-ui` uses a
  `ui-docs-web` page component, copy the few lines into the zone rather than import it.
- Create: `src/routes/web-docs-paths.ts`: the web docs sections the sidebar links to, each `{ title, url }`:
  Introduction `/docs`, Installation `/docs/installation`, Components `/docs/components`,
  Packages `/docs/packages`, and Blocks `/docs/blocks` if `packages/ui-docs-web/content/docs/blocks`
  exists on master when this task runs.
- Create: `src/lib/docs-tree.ts`.
- Only if Step 3's size check fails: `packages/ui/tools/build-examples-index.mts` gains a named set,
  `CLIENT_ONLY_IN_EDITOR_ZONE`, holding the item whose import tips the worker over (spec, Size), whose
  demos `__editor-components__.tsx` writes with `dynamic(..., { ssr: false })`; its comment carries the
  measured upload with and without it.

**Interfaces:**

- Consumes: Task 2's `EditorComponents`; Task 3's routes.
- Produces: `docsTree(editor: Root, web: { title: string; url: string }[]): Root` — the web links as
  page nodes with `external: true`, then the editor folder from `editor`.
- Targets: `wrangler:build` command ends
  `mkdir -p .open-next/assets/editor-static && mv .open-next/assets/_next .open-next/assets/editor-static/_next && test ! -e .open-next/assets/_next && ../../tools/check-worker-size.sh`;
  `wrangler:dev`; `wrangler:deploy` (`production`, dependsOn `wrangler:build` and `check-zone-routes`);
  `check-zone-routes`; `fumadocs-generate`; `build`/`dev`/`wrangler:build` dependOn `^build`,
  `@zeroxsolutions/ui:examples-index`, `fumadocs-generate`. Dependencies: `@zeroxsolutions/ui`,
  `@zeroxsolutions/editor-docs-web`, `@zeroxsolutions/editor-core`, `@zeroxsolutions/fluent-emoji`, `@zeroxsolutions/routing`.

- [ ] **Step 1:** Spec `docs-tree.spec.ts`: `puts the web sections first, as external links` and
      `keeps the editor folder's pages in their order`. Fails; implement; passes.
- [ ] **Step 2:** Generator dry run, read the list, run it; add the files above.
- [ ] **Step 3:** `pnpm nx wrangler:build @zeroxsolutions/registry-editor-docs-zone` succeeds,
      `ls .open-next/assets` shows `editor-static` and no `_next`, and the size check passes. Add its two
      lines to `baseline.md`.
- [ ] **Step 4:** `tools/check-zone-routes.sh` prints nothing.
- [ ] **Step 5:** Commit `feat(registry-editor-docs-zone): serve the editor docs on their own`.

### Task 5: One search over both zones

**Files:**

- Modify: `packages/ui/src/site/components/navigation/docs-search.tsx`, its spec,
  `site-header.tsx`/`site-header-nav.tsx` where `searchApi` passes through.

**Interfaces:**

- `DocsSearchProps.api: string | string[]`; `nav.searchApi` the same.
- `DocsSearchProps.local?: (url: string) => boolean`: a result `local` refuses is opened with
  `window.location.assign(url)` instead of the host's `push`. Default: every URL is local.
- A merged client: asks every `api`'s static client, concatenates in `api` order, drops a result whose
  `url` an earlier one had.

- [ ] **Step 1: Failing specs** in `docs-search.spec.tsx` (msw serves two indexes):
  - `finds pages from every index` (a web page from `/api/search`, an editor page from `/docs/editor/api/search`);
  - `shows a page both indexes hold once`;
  - `opens a result outside this zone with a full load` (`local = (url) => !url.startsWith('/docs/editor')`;
    selecting the editor result calls `window.location.assign('/docs/editor/document-editor')` and not `push`).
- [ ] **Step 2:** Run `pnpm nx test @zeroxsolutions/ui -- --run docs-search`; fails; implement; passes.
- [ ] **Step 3:** The zone's layout passes `searchApi: ['/api/search', '/docs/editor/api/search']` and
      `local` = under `/docs/editor`. `registry-ui` is left alone until Task 8.
- [ ] **Step 4:** Commit `feat(ui): search every zone's docs from one box`.

### Task 6: Zone e2e

**Files:**

- Create: `apps/registry-editor-docs-zone-e2e` with `@nx/playwright`, `webServer` on the zone's
  `wrangler:dev` at `http://localhost:8789`, shaped as `registry-native-ui-docs-zone-e2e`
  (`reuseExistingServer: false`, `gracefulShutdown` SIGINT).
- Create: `src/editor-pages.spec.ts`, `src/zone.spec.ts`.

- [ ] **Step 1: Specs.**
  - `editor-pages.spec.ts` `every editor page renders its demo on the server, fits a phone, and throws nothing`:
    for each `registry.json` item in category `editor`, at 390x844: the response HTML of
    `/docs/editor/<name>` holds `data-slot="component-preview-stage"` with non-empty content
    (the demo's markup, not only a fallback), the page does not scroll sideways, no
    `[data-slot=component-preview-stage] > [data-slot=scroll-area-viewport]` has
    `scrollWidth > clientWidth`, no `pageerror`, no console error matching `/hydrat/i`.
    An item the size fallback keeps client-only is listed in the spec with that reason.
  - `zone.spec.ts` `loads every asset under its prefix`: on `/docs/editor` and
    `/docs/editor/document-editor` no request fails and every `_next` URL starts with `/editor-static/`.
  - `zone.spec.ts` `links out of the zone with plain anchors`: every sidebar and header link whose path
    is not under `/docs/editor` has its `href` and clicking it starts a document request.
  - `zone.spec.ts` `answers the editor pages' markdown, image, sitemap and llms`:
    `/docs/editor/document-editor.md`, `/og/docs/editor/document-editor/image.png`,
    `/docs/editor/sitemap.xml`, `/docs/editor/llms.txt`, `/docs/editor/llms-full.txt` answer 200 with
    the expected content type, and the sitemap lists every editor page.
- [ ] **Step 2:** `pnpm nx e2e @zeroxsolutions/registry-editor-docs-zone-e2e` passes. If a hydration
      error shows, fix the demo or the component's first render, not the spec.
- [ ] **Step 3:** `AGENTS.md`'s Workspace list gains `packages/editor-docs-web` and
      `apps/registry-editor-docs-zone` (+ `-e2e`), and the zone sentence names three zones.
- [ ] **Step 4:** Commit `test(registry-editor-docs-zone): cover the editor zone on its own`; push;
      open PR 2 based on PR 1's branch; wait for checks.

### Task 7: STOP - deploy and observe (needs the user)

- [ ] **Step 1:** Report what a production push deploys (every zone, as `cd.yml` deploys every
      `wrangler:deploy`) and stop until the user asks for the merges and the push.
- [ ] **Step 2:** After the deploy, on `https://ui.zeroxsolutions.com`, with `wrangler tail` on
      `ui-sdk-registry-editor-docs-zone-production` and `ui-sdk-registry-ui-production`: every Global
      Constraints path answers from the editor worker; `/docs/components/base/button`, `/docs` and
      `/r/styles/base-nova/document-editor.json` from `registry-ui`; `/editor-static/_next/static/...`
      answers 200; `pnpm dlx shadcn@latest add @zui/document-editor --dry-run` resolves; dark mode set on
      `/docs` holds on `/docs/editor`.
- [ ] **Step 3:** Rollback, if a check fails: delete the zone's routes; `registry-ui` still serves
      every editor page.

## Part 3 - PR 3: `registry-ui` without the editor (branch `refactor/registry-ui-without-editor`, after Task 7)

### Task 8: The editor leaves `registry-ui`

**Files:**

- Delete from `apps/registry-ui`: the `editorDocs` collection and `multiple`, the content input, the
  `editor/styles.css` import, `EditorComponentsClientOnly` from its provider.
- Modify `packages/ui/tools/build-examples-index.mts`: stop writing `__editor-components-client-only__.tsx`;
  delete the file; `next/dynamic` leaves the generator; its docblock drops `ssr: false`.
- Create: `apps/registry-ui/src/routes/editor-paths.ts` (`/docs/editor`, `/docs/editor/<name>`,
  `/docs/editor/sitemap.xml`, `/docs/editor/llms.txt`, `/docs/editor/api/search`), same values as
  Task 3's routes, no import.
- Create: `apps/registry-ui/src/lib/editor-nav.ts`.
- Modify: `(app)/docs/layout.tsx` passes `withEditorSection(source.pageTree, publishedItems())`;
  `(app)/layout.tsx` passes `searchApi: ['/api/search', '/docs/editor/api/search']` and `local` = not
  under `/docs/editor`.
- Modify: `packages/ui-docs-web`'s docs sidebar and pager render a node with `external: true` as a
  plain `<a>`; `components-list.tsx` renders an editor item's link as a plain `<a>`, and
  `writtenDocsPage` in `registry-ui` answers any href under `/docs/editor` as written.
- Modify: `sitemap.xml/route.ts` names `/docs/editor/sitemap.xml` too; `llms.txt/route.ts` adds
  `# Editor docs` linking `/docs/editor/llms.txt`.
- Move: the editor-only checks of `apps/registry-ui/src/lib/source.spec.ts` (the `editor/` slugs, the
  feature-host install line, the Manual-tab and typography checks over editor pages) to the zone's
  `src/lib/source.spec.ts`, run over the zone's own source; each still runs once.
- Modify: `registry-ui-e2e`'s `component-pages.spec.ts` visits items outside the `editor` category only.

**Interfaces:**

- `withEditorSection(tree: Root, items: PublishedItem[]): Root`: inserts, after the `Components`
  folder, a folder `Editor` whose index is `/docs/editor` and whose pages are the `editor` items in
  `registry.json` order, each `{ type: 'page', name: title, url: '/docs/editor/<name>', external: true }`.

- [ ] **Step 1: Failing specs.**
  - `editor-nav.spec.ts` `adds the editor section after Components, as external links`.
  - `registry-ui-e2e` `docs.spec.ts`: `links into the editor zone with plain anchors` — on `/docs` the
    sidebar's `Editor` links and on `/docs/components` every editor item link have `href`
    `/docs/editor...` and clicking one starts a document request; the pager on the page before the
    editor section does the same.
  - `registry-ui-e2e` `sitemap`/`llms` specs: `/sitemap.xml` names `/docs/editor/sitemap.xml`,
    `/docs-sitemap.xml` names no `/docs/editor` URL, `/llms.txt` links `/docs/editor/llms.txt`,
    `/llms-full.txt` holds no editor page.
- [ ] **Step 2:** They fail; implement; `pnpm nx test` for `registry-ui`, `ui`, `ui-docs-web`,
      `registry-editor-docs-zone`, and both e2e targets pass.
- [ ] **Step 3:** `pnpm nx wrangler:build @zeroxsolutions/registry-ui`; add its lines to `baseline.md`;
      the upload is below Task 1's. `git grep -n "base-ui/editor\|editor-components\|editor-docs-web" apps/registry-ui`
      finds nothing.
- [ ] **Step 4:** Commit `refactor(registry-ui): leave the editor docs to their zone`; push; open PR 3;
      wait for checks. Report the three upload figures to the user.
