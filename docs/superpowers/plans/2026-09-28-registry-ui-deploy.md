# Registry UI Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `apps/registry-ui` as a Cloudflare Worker through OpenNext, on `*.workers.dev` for `development` and on `https://ui.zeroxsolutions.com` for `production`.

**Architecture:** The OpenNext adapter bundles `next build`'s standalone output into `.open-next/` (a `worker.js` plus an `assets/` directory that carries `public/r`). Four nx targets on the app build, preview, type and deploy that artifact; `cd.yml`'s existing `wrangler:deploy` job picks the project up unchanged. The e2e project drives the worker preview, so CI's e2e job builds the artifact that ships.

**Tech Stack:** Next.js 16, `@opennextjs/cloudflare` 1.20.6, wrangler 4 (workspace catalog `^4.105.0`), nx 23, Playwright, pnpm 10.33.0.

**Spec:** `docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md`

## Global Constraints

- Worker name `ui-sdk-registry-ui`; production custom domain `ui.zeroxsolutions.com`, `workers_dev: false`, `preview_urls: false`; development `workers_dev: true`, no route.
- Incremental cache `static-assets-incremental-cache`; no R2 bucket, Durable Object, queue override, tag cache or `WORKER_SELF_REFERENCE`.
- `iac/` is not touched. Nothing is deployed from a session; `wrangler:deploy` runs only in CI.
- Every build, test, lint and serve goes through `pnpm nx`, addressed by the scoped name `@zeroxsolutions/registry-ui` / `@zeroxsolutions/registry-ui-e2e`.
- Commits name their paths (`git commit -F <msg> -- <paths>`; `git add` a new file first) and end with the two trailers `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_0156cMCGsrqCUVe6KeduCBQ9`. Never `--no-verify`.
- Authored text is plain ASCII.

## Review Focus

- A request for an item the registry does not have must answer `404`, never a `200` HTML page a CLI would try to parse as JSON (test in Task 2).
- Registry JSON must be served as `application/json`, since the shadcn CLI parses the body (test in Task 2).
- `public/r` must be inside the artifact even on a cold checkout where it was never built, because it is gitignored (Task 1 builds from a deleted `public/r` and `.open-next`).
- The production environment must not answer on a second hostname; `workers_dev` and `preview_urls` are both false there (Task 3 reads them back from the dry-run bundle's resolved config).
- A registry item removed from `registry.json` must not survive in the artifact; `shadcn-build` already `rm -rf public/r`, and `wrangler:build` starts with `rm -rf .open-next` (Task 1 command).

---

### Task 1: Build the worker artifact

**Files:**

- Modify: `pnpm-workspace.yaml` (catalog)
- Modify: `apps/registry-ui/package.json` (dependencies, `nx.targets`)
- Create: `apps/registry-ui/open-next.config.ts`
- Rename + modify: `apps/registry-ui/next.config.js` -> `apps/registry-ui/next.config.mjs`
- Create: `apps/registry-ui/wrangler.jsonc`
- Create (generated): `apps/registry-ui/cloudflare-env.d.ts`

**Interfaces:**

- Produces: nx targets `wrangler:build` (output `{projectRoot}/.open-next`) and `wrangler:typegen`; files `.open-next/worker.js` and `.open-next/assets/r/*.json`; `wrangler.jsonc` with `env.development` and `env.production`.

- [ ] **Step 1: Show the artifact does not exist today**

```bash
cd ~/ZeroXSolutions/ui-sdk
rm -rf apps/registry-ui/.open-next apps/registry-ui/public/r
pnpm nx show project @zeroxsolutions/registry-ui --json | python3 -c "import json,sys; print('wrangler:build' in json.load(sys.stdin)['targets'])"
```

Expected: `False`.

- [ ] **Step 2: Declare the adapter in the catalog and on the app**

Read the current versions first; do not type them from memory:

```bash
npm view @opennextjs/cloudflare version   # 1.20.6 when this plan was written
npm view wrangler version
```

In `pnpm-workspace.yaml`, add to `catalog:` beside the existing `wrangler` line:

```yaml
'@opennextjs/cloudflare': '1.20.6'
```

In `apps/registry-ui/package.json`, add to `dependencies` (keep keys sorted):

```json
    "@opennextjs/cloudflare": "catalog:",
    "wrangler": "catalog:",
```

Then install:

```bash
pnpm install
```

Expected: `Done in ...` and the two packages under `apps/registry-ui/node_modules`.

- [ ] **Step 3: Write `open-next.config.ts`**

Check the import path exists in the installed version before writing it:

```bash
ls apps/registry-ui/node_modules/@opennextjs/cloudflare/dist/api/overrides/incremental-cache/ | grep static-assets
```

```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Reads prerendered pages back through the ASSETS binding and writes nothing, which is all a site
// with no `revalidate` needs. The queue and tag cache stay "dummy": the queue's dummy throws
// "Dummy queue is not implemented" the first time a stored render goes stale, so the first route
// that sets `revalidate` has to bring a writable cache and a real queue with it.
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
```

- [ ] **Step 4: Move the Next config to ESM and wire the adapter**

```bash
git mv apps/registry-ui/next.config.js apps/registry-ui/next.config.mjs
```

Replace the file's contents with:

```js
// @ts-check

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Wires the Workers bindings into `next dev`, so local dev sees what the deployed worker sees.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The adapter bundles from this output; without it the adapter fails on a missing
  // pages-manifest.json rather than naming the setting that produces it.
  output: 'standalone',
};

export default nextConfig;
```

`.mjs` because the app's `package.json` sets no `"type"`, so a `.js` config loads as CommonJS and cannot `import` the adapter.

- [ ] **Step 5: Write `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ui-sdk-registry-ui",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-08-20",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "observability": { "enabled": true },
  // Both addresses `wrangler dev` binds. Unset, the server port silently becomes the next free
  // one, and the e2e suite drives this exact port.
  "dev": { "port": 8787, "inspector_port": 9229 },
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "env": {
    "development": {
      "workers_dev": true,
    },
    "production": {
      "workers_dev": false,
      // Absent, a versioned preview still gets a *.workers.dev hostname from the account's own
      // subdomain setting; the registry has one public host.
      "preview_urls": false,
      // A custom domain pattern is a bare hostname; wrangler rejects a wildcard or a path.
      "routes": [{ "pattern": "ui.zeroxsolutions.com", "custom_domain": true }],
    },
  },
}
```

- [ ] **Step 6: Declare `wrangler:build` and `wrangler:typegen`**

In `apps/registry-ui/package.json`, inside `nx.targets` (leave `build` and `shadcn-build` as they are):

```json
      "wrangler:build": {
        "executor": "nx:run-commands",
        "dependsOn": ["^build", "shadcn-build"],
        "outputs": ["{projectRoot}/.open-next"],
        "cache": true,
        "options": {
          "cwd": "{projectRoot}",
          "command": "rm -rf .open-next && next build && opennextjs-cloudflare build --skipNextBuild"
        }
      },
      "wrangler:typegen": {
        "executor": "nx:run-commands",
        "options": {
          "cwd": "{projectRoot}",
          "command": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
        }
      },
```

- [ ] **Step 7: Build from a cold tree and check the artifact**

```bash
rm -rf apps/registry-ui/.open-next apps/registry-ui/public/r
pnpm nx run @zeroxsolutions/registry-ui:wrangler:build --skip-nx-cache 2>&1 | tail -3
ls apps/registry-ui/.open-next/worker.js
ls apps/registry-ui/.open-next/assets/r | wc -l
```

Expected: `Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 4 tasks it depends on`; `worker.js` listed; `26` (25 items plus `registry.json`).

- [ ] **Step 8: Generate the environment types**

```bash
pnpm nx run @zeroxsolutions/registry-ui:wrangler:typegen
head -5 apps/registry-ui/cloudflare-env.d.ts
```

Expected: the file exists and declares `interface CloudflareEnv` with an `ASSETS` member.

- [ ] **Step 9: Run the gate**

```bash
LOG=$(mktemp); pnpm nx run-many -t lint typecheck build test > "$LOG" 2>&1; grep 'Successfully ran targets lint, typecheck, build, test for 5 projects' "$LOG"
```

Expected: the line prints.

- [ ] **Step 10: Commit**

```bash
git add apps/registry-ui/open-next.config.ts apps/registry-ui/wrangler.jsonc apps/registry-ui/cloudflare-env.d.ts
git commit -F msg.txt -- pnpm-workspace.yaml pnpm-lock.yaml apps/registry-ui/package.json apps/registry-ui/open-next.config.ts apps/registry-ui/next.config.js apps/registry-ui/next.config.mjs apps/registry-ui/wrangler.jsonc apps/registry-ui/cloudflare-env.d.ts
```

Subject: `build(registry-ui): build the app as a worker through opennext`. Body: why - the registry host needs a deployable artifact, and `public/r` only reaches it through `shadcn-build`.

---

### Task 2: Serve the registry from the worker preview under e2e

**Files:**

- Modify: `apps/registry-ui/package.json` (`nx.targets`)
- Modify: `apps/registry-ui-e2e/package.json`
- Modify: `apps/registry-ui-e2e/playwright.config.mts`
- Create: `apps/registry-ui-e2e/src/registry.spec.ts`

**Interfaces:**

- Consumes: `wrangler:build` and `wrangler.jsonc` `dev.port` 8787 from Task 1.
- Produces: nx target `wrangler:dev` (continuous); the e2e suite drives `http://localhost:8787`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui-e2e/src/registry.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('registry host', () => {
  test('serves the registry index', async ({ request }) => {
    const res = await request.get('/r/registry.json');

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(body.name).toBe('zeroxsolutions-ui');
    expect(body.items).toHaveLength(25);
  });

  test('serves a composed item with its file content', async ({ request }) => {
    const res = await request.get('/r/split-button.json');

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.files[0].content.length).toBeGreaterThan(0);
  });

  test('answers 404 for an item the registry does not have', async ({ request }) => {
    const res = await request.get('/r/does-not-exist.json');

    expect(res.status()).toBe(404);
  });
});
```

- [ ] **Step 2: Point the suite at the worker and run it red**

In `apps/registry-ui-e2e/playwright.config.mts`, replace the `baseURL` line and the `webServer` block:

```ts
// The worker's own wrangler.jsonc declares this port under `dev`, so the two stay one address.
const WRANGLER_DEV_PORT = 8787;
const baseURL = process.env['BASE_URL'] || `http://localhost:${WRANGLER_DEV_PORT}`;
```

```ts
  webServer: {
    command: 'pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:dev',
    ...(process.env['BASE_URL'] === undefined
      ? { port: WRANGLER_DEV_PORT, reuseExistingServer: false }
      : { url: baseURL, reuseExistingServer: true }),
    cwd: workspaceRoot,
    timeout: 300_000,
  },
```

Run:

```bash
pnpm nx e2e @zeroxsolutions/registry-ui-e2e 2>&1 | tail -15
```

Expected: FAIL - nx reports it cannot find target `wrangler:dev` on `@zeroxsolutions/registry-ui`.

- [ ] **Step 3: Declare `wrangler:dev` and the e2e dependency**

In `apps/registry-ui/package.json` `nx.targets`:

```json
      "wrangler:dev": {
        "executor": "nx:run-commands",
        "continuous": true,
        "dependsOn": ["wrangler:build"],
        "options": {
          "cwd": "{projectRoot}",
          "command": "opennextjs-cloudflare preview --env development",
          "tty": true
        }
      },
```

In `apps/registry-ui-e2e/package.json`, replace the `nx` block. `@nx/playwright` splits `nx run <project>:<target>` on every `:`, so the web server command alone infers a dependency on a `wrangler` target that does not exist; this declared `dependsOn` replaces it:

```json
  "nx": {
    "targets": {
      "e2e": {
        "dependsOn": ["^wrangler:build"]
      }
    },
    "implicitDependencies": ["@zeroxsolutions/registry-ui"]
  }
```

- [ ] **Step 4: Run the suite green**

```bash
pnpm nx e2e @zeroxsolutions/registry-ui-e2e 2>&1 | tail -8
```

Expected: every test passes on the three browser projects, including the existing `has title` spec, and `Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e`.

If `registry.spec.ts` fails on `content-type`, read the served header with `curl -sI http://localhost:8787/r/registry.json` while `wrangler:dev` runs, and report it rather than loosening the assertion.

- [ ] **Step 5: Run the gate**

```bash
LOG=$(mktemp); pnpm nx run-many -t lint typecheck build test > "$LOG" 2>&1; grep 'Successfully ran targets lint, typecheck, build, test for 5 projects' "$LOG"
```

- [ ] **Step 6: Commit**

```bash
git add apps/registry-ui-e2e/src/registry.spec.ts
git commit -F msg.txt -- apps/registry-ui/package.json apps/registry-ui-e2e/package.json apps/registry-ui-e2e/playwright.config.mts apps/registry-ui-e2e/src/registry.spec.ts
```

Subject: `test(registry-ui-e2e): drive the worker preview and check the registry it serves`.

---

### Task 3: Deploy target, checked without deploying, and the docs it makes untrue

**Files:**

- Modify: `apps/registry-ui/package.json` (`nx.targets`)
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: `wrangler:build` from Task 1.
- Produces: nx target `wrangler:deploy` with configurations `development` (default) and `production`, which `cd.yml` already calls as `wrangler:deploy -c <branch>`.

- [ ] **Step 1: Show `cd.yml` finds nothing to deploy today**

```bash
pnpm nx run-many -t wrangler:deploy --dry-run 2>&1 | tail -3
```

Expected: `No tasks were run`.

- [ ] **Step 2: Declare `wrangler:deploy`**

In `apps/registry-ui/package.json` `nx.targets`:

```json
      "wrangler:deploy": {
        "executor": "nx:run-commands",
        "dependsOn": ["wrangler:build"],
        "options": { "cwd": "{projectRoot}" },
        "defaultConfiguration": "development",
        "configurations": {
          "development": { "command": "opennextjs-cloudflare deploy --env development" },
          "production": { "command": "opennextjs-cloudflare deploy --env production" }
        }
      },
```

- [ ] **Step 3: Check both environments resolve without deploying**

`--dry-run` here is nx's: it prints the task graph and runs nothing.

```bash
pnpm nx run-many -t wrangler:deploy -c production --dry-run 2>&1 | grep -E 'wrangler:(build|deploy)'
```

Expected: `@zeroxsolutions/registry-ui:wrangler:deploy:production` and its `wrangler:build` dependency are listed.

Then read the environment config wrangler resolves, with no credentials and no upload:

```bash
cd apps/registry-ui && pnpm exec wrangler deploy --env production --dry-run --outdir /tmp/registry-ui-dry 2>&1 | tail -12; cd -
```

Expected: exits 0, names `ui-sdk-registry-ui-production` and the `ASSETS` binding. Then confirm the production switches in the config itself:

```bash
grep -n '"workers_dev": false\|"preview_urls": false\|"custom_domain": true' apps/registry-ui/wrangler.jsonc
```

Expected: three lines, all under `production`.

This is the one direct wrangler call in the plan: a read-only validation that no target owns. Do not run it without `--dry-run`.

- [ ] **Step 4: Update `CLAUDE.md` in the same change**

Replace the bullet that starts `- **No deployable target exists.**` with:

```markdown
- **`registry-ui` deploys as a worker through OpenNext, and it is the only deployable.**
  `wrangler:deploy` ships `development` to `*.workers.dev` and `production` to the custom
  domain `ui.zeroxsolutions.com`, declared in the app's `wrangler.jsonc`, not in `iac/`.
  Development gets no custom domain on purpose: a second registry hostname is one a consumer
  could write into `components.json`. The cache is the adapter's static-assets one, which
  writes nothing - so the first route that sets `revalidate` has to bring a writable cache and
  a real queue, or it throws the first time a stored render goes stale.
```

In the Configuration table, replace the `CLOUDFLARE_API_TOKEN` row with these two rows:

```markdown
| `CLOUDFLARE_API_TOKEN` | `wrangler:deploy` via the reusable `nx-deploy.yml` | CI env secret, `development` and `production` environments, through `secrets: inherit` | yes | the deploy job fails at authentication. Workers Scripts Write, the permission Cloudflare's attach-a-domain endpoint accepts; the custom domain creates its own DNS record |
| `CLOUDFLARE_ACCOUNT_ID` | same | same | yes | wrangler cannot tell which account to deploy to |
```

In the first bullet of `## This project's choices`, change `at \`https://ui.zeroxsolutions.com\`, **which does not resolve yet**.`to`at \`https://ui.zeroxsolutions.com\`.` only after the first production deploy answers; until then leave it.

- [ ] **Step 5: Run the gate**

```bash
LOG=$(mktemp); pnpm nx run-many -t lint typecheck build test > "$LOG" 2>&1; grep 'Successfully ran targets lint, typecheck, build, test for 5 projects' "$LOG"
```

- [ ] **Step 6: Commit**

```bash
git commit -F msg.txt -- apps/registry-ui/package.json CLAUDE.md
```

Subject: `build(registry-ui): deploy the registry to ui.zeroxsolutions.com`. Body: why - `cd.yml`'s deploy job matched no project, so the registry never shipped; name the two secrets a person must set before the first run.

---

### After the plan (a person, not a task)

1. Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the `development` and `production` GitHub environments.
2. Push `master`, fast-forward `development`, read the `cd.yml` run.
3. Fast-forward `production`, then:
   `curl -s https://ui.zeroxsolutions.com/r/registry.json | head -c 200`
   and, in a clean `base-vega` app, `pnpm dlx shadcn add https://ui.zeroxsolutions.com/r/split-button.json`.
4. Drop "which does not resolve yet" from `CLAUDE.md` once step 3 answers.
