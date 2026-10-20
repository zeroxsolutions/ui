# zui web: the name, the `@zui` namespace and the `/r/styles/{style}/` layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The web registry is named `zui`, publishes every item under each of the eight `base-<style>`
paths, names its own dependencies as `@zui/<name>`, and documents installing through the `@zui`
namespace.

**Architecture:** `shadcn build` runs once into `public/r/styles/base-nova/`; a script copies that output
to the other seven base styles, since an item's own file is the same under every style for now and its
`@shadcn/*` primitives come in the consumer's style. The old `/r/<name>.json` redirects to
`base-nova`. Every install command the site shows becomes `shadcn add @zui/<name>`.

**Tech Stack:** shadcn CLI 4.22.1, Next.js on OpenNext/Cloudflare, Vitest, Playwright, nx.

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md` (section "The rename").
This is plan 1 of 4; the RN pipeline, `zui-cli` and the preview app each get their own plan.

## Global Constraints

- Registry name: `zui`. `homepage` stays `https://ui.zeroxsolutions.com`.
- Base styles, in this order: `vega`, `nova`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`; paths
  `/r/styles/base-<style>/<name>.json` and `/r/styles/base-<style>/registry.json`.
- Namespace line the docs show: `"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"`.
- Install command the docs show for an item: `pnpm dlx shadcn@latest add @zui/<name>`; for an upstream
  primitive it stays `pnpm dlx shadcn@latest add <name>`.
- An item's dependency on another zui item: `@zui/<name>`; on an upstream item: `@shadcn/<name>` (unchanged).
- Old `/r/<name>.json` (and `/r/registry.json`): permanent redirect to `/r/styles/base-nova/<same>`.
- `apps/registry-ui`, `@zeroxsolutions/registry-ui` and earlier `docs/superpowers/` files keep their names
  and text.

## Review Focus

1. A consumer on `base-vega` installs an item that depends on another zui item: the dependency must come
   from `base-vega` too, not `base-nova` (Task 4's install check).
2. A consumer with no `@zui` entry runs the documented command: shadcn must fail with its own "unknown
   registry" message, and the installation page must say up front that the entry is required (Task 3,
   asserted in `source.spec.ts`).
3. `/r/styles/base-nova/registry.json` must not be caught by the old-URL redirect (a redirect loop or a
   404): Task 2's e2e asserts a 200 there and a single hop from the old URL.
4. A stale `public/r/<name>.json` left from an earlier build would shadow the redirect: Task 2's build
   removes `public/r` entirely first, and the e2e asserts the redirect status, not just the final 200.
5. An item added later with a URL dependency: Task 1's spec rejects any `https://ui.zeroxsolutions.com/r/`
   string in `registry.json`.

---

### Task 1: name the registry `zui` and its dependencies `@zui/<name>`

**Files:**

- Modify: `apps/registry-ui/registry.json` (`name`, and the 105 `https://ui.zeroxsolutions.com/r/<name>.json` dependencies)
- Modify: `apps/registry-ui/registry/registry.spec.ts` (`ITEM_URL` and the fixtures at its lines ~345, ~365)

**Interfaces:**

- Produces: `registry.json` with `"name": "zui"` and every house dependency spelled `@zui/<name>`.

- [ ] **Step 1: Change the spec first.** In `registry.spec.ts`, rename `ITEM_URL` to `ITEM_PREFIX` with
      value `'@zui/'`, and build a dependency as `` `${ITEM_PREFIX}${owner}` `` (no `.json`). Update the two
      fixtures to `'@zui/chevron-right-icon'` and `'@zui/ai-provider-card'`, and the test named
      `names an animated icon by its house item URL` to `names an animated icon by its house item name`.
      Add:

```ts
it('is named zui and names no house item by URL', () => {
  const raw = readFileSync(join(APP, 'registry.json'), 'utf8');
  expect(JSON.parse(raw).name).toBe('zui');
  expect(raw).not.toContain('https://ui.zeroxsolutions.com/r/');
});
```

- [ ] **Step 2: Run it and see it fail.**
      Run: `pnpm nx test registry-ui -- registry/registry.spec.ts`
      Expected: FAIL, `declares exactly the files...` reporting URL dependencies, and the new test.

- [ ] **Step 3: Rewrite `registry.json`.** `"name": "zui"`; every
      `"https://ui.zeroxsolutions.com/r/<name>.json"` becomes `"@zui/<name>"`. This is one mechanical rewrite
      over one file; open `making-a-sweeping-edit` before running it.

- [ ] **Step 4: Run it and see it pass, and validate.**
      Run: `pnpm nx test registry-ui -- registry/registry.spec.ts` then
      `pnpm nx run registry-ui:shadcn-build --skip-nx-cache`
      Expected: PASS; `Registry is valid.` (checked on a copy on 2026-10-21: 127 items valid, and the built
      `editor-tab.json` keeps `@zui/unsaved-indicator`).

- [ ] **Step 5: Commit** `registry.json` and `registry.spec.ts`:
      `feat(registry-ui)!: name the registry zui and its own dependencies @zui/<name>` with a
      `BREAKING CHANGE:` trailer saying an item with a house dependency now needs the `@zui` entry.

### Task 2: publish under `/r/styles/base-<style>/` and redirect the old paths

**Files:**

- Create: `apps/registry-ui/src/lib/registry-styles.ts`
- Create: `apps/registry-ui/tools/build-registry.mts`
- Modify: `apps/registry-ui/package.json` (`nx.targets.shadcn-build`)
- Modify: `apps/registry-ui/next.config.mjs` (`redirects`)
- Modify: `apps/registry-ui-e2e/src/registry.spec.ts`

**Interfaces:**

- Produces: `export const BASE_STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;`
  `export type BaseStyle = (typeof BASE_STYLES)[number];`
  `export const DEFAULT_BASE_STYLE: BaseStyle = 'nova';`
  `export function itemPath(name: string, style: BaseStyle = DEFAULT_BASE_STYLE): string` returning
  `` `/r/styles/base-${style}/${name}.json` ``.

- [ ] **Step 1: Write the e2e first.** Replace the body of `registry.spec.ts`'s one test with a loop over
      `BASE_STYLES` (imported by relative path from `apps/registry-ui/src/lib/registry-styles.ts`): for each
      style, `GET /r/styles/base-<style>/registry.json` is 200 with `name` `zui`, and every listed item is 200
      with every file's `content` set (keep the 60 s timeout; the fetch count is now 8x, so fetch each
      style's items with `Promise.all` per style). Add:

```ts
test('the old item and index paths redirect once to base-nova', async ({ request }) => {
  for (const [from, to] of [
    ['/r/status-indicator.json', '/r/styles/base-nova/status-indicator.json'],
    ['/r/registry.json', '/r/styles/base-nova/registry.json'],
  ]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers()['location'], 'http://x').pathname).toBe(to);
  }
});
```

- [ ] **Step 2: Run it and see it fail.**
      Run: `pnpm nx e2e registry-ui-e2e -- src/registry.spec.ts`
      Expected: FAIL with 404 on `/r/styles/base-vega/registry.json`.

- [ ] **Step 3: Add `registry-styles.ts`** with the Interfaces above, and **`tools/build-registry.mts`**:
      remove `public/r`, run `shadcn build -o public/r/styles/base-nova`, copy that directory to each other
      `base-<style>`, then run `shadcn registry validate registry.json`. It imports `BASE_STYLES` from
      `../src/lib/registry-styles.ts` and is run with `node`, as `tools/build-examples-index.mts` already is.
      Point the `shadcn-build` target's command at it, outputs unchanged (`public/r`).

- [ ] **Step 4: Add the redirects** to `nextConfig`, as permanent (308):
      `{ source: '/r/:name([^/]+\\.json)', destination: '/r/styles/base-nova/:name', permanent: true }`.
      The segment pattern excludes a slash, so nothing under `/r/styles/` matches.

- [ ] **Step 5: Run it and see it pass.**
      Run: `pnpm nx e2e registry-ui-e2e -- src/registry.spec.ts`
      Expected: PASS, both tests.

- [ ] **Step 6: Commit** the five files: `feat(registry-ui): serve every item under each base style's path`.

### Task 3: every install command the site and README show uses `@zui`

**Files:**

- Modify: `apps/registry-ui/src/app/(app)/page.tsx` (`homePageInstallCommand`)
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (`installCommand` and its fixtures, ~lines 154, 674, 682, 728, 751)
- Modify: `apps/registry-ui/content/docs/**/*.mdx` (46 pages with `shadcn@latest add https://ui.zeroxsolutions.com/r/...`)
- Modify: `apps/registry-ui/content/docs/installation.mdx`
- Modify: `apps/registry-ui-e2e/src/home.spec.ts` (`INSTALL_COMMAND`)
- Modify: `README.md` (lines 23, 43, 48)

**Interfaces:**

- Consumes: Task 1's names, Task 2's `itemPath`.

- [ ] **Step 1: Change the specs first.** `source.spec.ts`'s `installCommand` returns
      `` `pnpm dlx shadcn@latest add @zui/${name}` `` for an item; update its fixtures to match. Add a test
      that `installation.mdx` contains the exact namespace line
      `"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"` and the sentence
      `An item that uses another zui item installs only with this entry.` In `home.spec.ts`,
      `INSTALL_COMMAND = 'pnpm dlx shadcn@latest add @zui/status-indicator'`.

- [ ] **Step 2: Run and see them fail.**
      Run: `pnpm nx test registry-ui -- src/lib/source.spec.ts`
      Expected: FAIL listing every page whose CLI tab lacks `add @zui/<name>`.

- [ ] **Step 3: Rewrite the commands.** `homePageInstallCommand` returns
      `` `pnpm dlx shadcn@latest add @zui/${name}` ``. In the 46 pages, each
      `https://ui.zeroxsolutions.com/r/<name>.json` in a command becomes `@zui/<name>` (a sweeping edit;
      open `making-a-sweeping-edit`). README: the index link becomes
      `https://ui.zeroxsolutions.com/r/styles/base-nova/registry.json`, the command `@zui/status-indicator`,
      and it points to the installation page for the namespace entry.

- [ ] **Step 4: Rewrite `installation.mdx`** in this order: create `components.json` (any `base-` style;
      unchanged text); add the `@zui` entry under `registries` (the exact line above) and the required-entry
      sentence; install with `pnpm dlx shadcn@latest add @zui/status-indicator`; items that use other items
      (a zui item by `@zui/<name>`, which resolves in the app's own style; a primitive by `@shadcn/<name>`;
      Editor Tab names `@zui/unsaved-indicator` and `@shadcn/button`); colours (unchanged). Drop the
      "addressed by its URL" section. Open `writing-prose` and `cutting-ai-tells` before writing it.

- [ ] **Step 5: Run and see them pass.**
      Run: `pnpm nx test registry-ui` then `pnpm nx e2e registry-ui-e2e -- src/home.spec.ts`
      Expected: PASS.

- [ ] **Step 6: Commit** the files above: `docs(registry-ui): install every item through the @zui namespace`.

### Task 4: install check from a consumer on another style

No file in the repo changes; this is the check that the layout works for a consumer, run against the
local worker.

- [ ] **Step 1:** Start the worker: `pnpm nx run registry-ui:wrangler:dev` (port 8787).
- [ ] **Step 2:** In a new empty directory outside the repo, create a Vite React app, run
      `pnpm dlx shadcn@latest init --base base --preset vega`, then add to its `components.json`:
      `"registries": { "@zui": "http://localhost:8787/r/styles/{style}/{name}.json" }`.
- [ ] **Step 3:** Run `pnpm dlx shadcn@latest add @zui/editor-tab --yes`.
      Expected: the worker's log shows `GET /r/styles/base-vega/editor-tab.json` and
      `GET /r/styles/base-vega/unsaved-indicator.json`; `components/` gains `editor-tab.tsx` and
      `unsaved-indicator.tsx`; `components/ui/button.tsx` is the Vega button (`h-9` default size).
- [ ] **Step 4:** Remove the `registries` entry and run the same command.
      Expected: shadcn fails naming the unknown `@zui` registry; record its exact text in the PR body.
- [ ] **Step 5:** When the user asks for the push, the push hook is the gate (lint, typecheck, build);
      read the CI run it starts, test included, before opening the PR.
