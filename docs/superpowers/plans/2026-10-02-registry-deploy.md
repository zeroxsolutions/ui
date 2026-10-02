# Ship the Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@zeroxsolutions/registry-ui` the `wrangler:deploy` target `cd.yml` already calls, with an e2e that checks every registry item is served, so a push to `development` or `production` ships the worker.

**Architecture:** One nx target with a configuration per environment runs the OpenNext adapter's deploy against the existing `wrangler.jsonc` environments. One Playwright case reads the served registry the way `shadcn add` does. Secrets and the first deploys are a person's, after merge.

**Tech Stack:** nx 23 (`nx:run-commands`), `@opennextjs/cloudflare` (`opennextjs-cloudflare deploy --env`), wrangler, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-registry-deploy-design.md`

## Global Constraints

- The account is on Workers Paid; the worker is not cut (46168 KiB uncompressed, under the 64 MiB limit).
- `wrangler:deploy` depends on `wrangler:build`; configurations `development` (default) and `production`; runs `opennextjs-cloudflare deploy --env <configuration>` from the project root.
- `cd.yml` and `wrangler.jsonc` are unchanged.
- `wrangler:build` declares no env input (the app inlines no `NEXT_PUBLIC_*` value).
- Nothing is deployed from a session: no `wrangler:deploy` run, no `wrangler login`, no secret set.
- Plain ASCII in code and prose; commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; never `--no-verify` / `HUSKY=0`.
- Kill only processes you started, by PID; never `pkill`/`killall` by pattern (the user's `next dev` on :3000 runs `workerd`). Confirm `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing after an e2e run.

## Review Focus

- An item whose JSON lists a file with empty or missing `content`: `shadcn add` writes an empty file; the e2e must name the item and file (Task 1).
- An item listed in `registry.json` with no `/r/<name>.json` built: a consumer's add 404s; the e2e must name the item (Task 1).
- `nx run-many -t wrangler:deploy -c development` resolving to the right command: the target must select the configuration's command, not fall back to a default that deploys production (Task 2).
- A deploy run without `-c` (someone typing `nx run-many -t wrangler:deploy`): it must deploy development, never production (Task 2).
- AGENTS.md still telling a reader the worker is over a limit or that nothing ships: the next session would plan a size cut nobody needs (Task 2).

---

### Task 1: An e2e that reads every served item

**Files:**

- Create: `apps/registry-ui-e2e/src/registry.spec.ts`

**Interfaces:**

- Consumes: the worker on `http://localhost:8787` (Playwright's `webServer` starts `wrangler:dev`); `/r/registry.json` and `/r/<name>.json`, built by `shadcn-build` into `public/r`.
- Produces: nothing later tasks import.

Load `gundam:writing-e2e-tests` with the Skill tool before writing the spec.

- [ ] **Step 1: Write the case, wrong on purpose first**

Write the spec with the registry's name deliberately wrong (`'zeroxsolutions-ui-wrong'`), so the run proves the case can fail:

```ts
import { expect, test } from '@playwright/test';

interface RegistryIndex {
  name: string;
  items: { name: string }[];
}

interface RegistryItem {
  name: string;
  files?: { path: string; content?: string }[];
}

test('the registry serves every item it lists, each file with its content', async ({ request }) => {
  // 90 items fetched from a cold worker on a shared runner outrun the default deadline.
  test.setTimeout(60_000);
  const index = await request.get('/r/registry.json');
  expect(index.status()).toBe(200);
  const registry = (await index.json()) as RegistryIndex;
  expect(registry.name).toBe('zeroxsolutions-ui-wrong');
  expect(registry.items.length).toBeGreaterThan(0);

  const problems: string[] = [];
  for (const { name } of registry.items) {
    const response = await request.get(`/r/${name}.json`);
    if (response.status() !== 200) {
      problems.push(`${name}: ${response.status()}`);
      continue;
    }
    const item = (await response.json()) as RegistryItem;
    if (!item.files?.length) problems.push(`${name}: no files`);
    for (const file of item.files ?? []) if (!file.content) problems.push(`${name}: ${file.path} has no content`);
  }
  expect(problems).toEqual([]);
});
```

- [ ] **Step 2: Run it and see it fail on the name**

Check first: `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing (if something you did not start is there, stop and report).
Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/registry.spec.ts --project=chromium`
Expected: FAIL, `Expected: "zeroxsolutions-ui-wrong"`, `Received: "zeroxsolutions-ui"`.

- [ ] **Step 3: Set the real name**

Change `'zeroxsolutions-ui-wrong'` to `'zeroxsolutions-ui'`.

- [ ] **Step 4: Run it in all three browsers**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/registry.spec.ts`
Expected: 3 passed (chromium, firefox, webkit). Then `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.

- [ ] **Step 5: Commit**

Load `gundam:landing-a-change` first.

```bash
git add apps/registry-ui-e2e/src/registry.spec.ts
git commit -m "test(registry-ui-e2e): read every served registry item as shadcn add does

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The deploy target and the docs that describe it

**Files:**

- Modify: `apps/registry-ui/package.json` (`nx.targets`, after `wrangler:dev`)
- Modify: `AGENTS.md` (two bullets under "This project's choices")
- Modify: `docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md` (one line at the top)

**Interfaces:**

- Consumes: `wrangler:build` (existing target), `wrangler.jsonc`'s `env.development` and `env.production`.
- Produces: `wrangler:deploy` with configurations `development` and `production`, which `nx-deploy.yml@v1` runs as `nx run-many -t wrangler:deploy -c <environment>`.

Load `gundam:deploying-a-frontend-app` (and read its `references/nx.md`) before editing `package.json`.

- [ ] **Step 1: See the target is missing**

Run: `pnpm exec nx show project @zeroxsolutions/registry-ui --json | node -e "const p=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(p.targets['wrangler:deploy']))"`
Expected: `undefined`.

- [ ] **Step 2: Add the target**

In `apps/registry-ui/package.json`, inside `nx.targets`, after `wrangler:dev`:

```json
"wrangler:deploy": {
  "executor": "nx:run-commands",
  "dependsOn": [
    "wrangler:build"
  ],
  "defaultConfiguration": "development",
  "options": {
    "cwd": "{projectRoot}"
  },
  "configurations": {
    "development": {
      "command": "opennextjs-cloudflare deploy --env development"
    },
    "production": {
      "command": "opennextjs-cloudflare deploy --env production"
    }
  }
},
```

- [ ] **Step 3: Read the target back from nx, per configuration**

Run: `pnpm exec nx show project @zeroxsolutions/registry-ui --json | node -e "const t=JSON.parse(require('fs').readFileSync(0,'utf8')).targets['wrangler:deploy'];console.log(t.defaultConfiguration, t.dependsOn, t.options.cwd, t.configurations.development.command, '|', t.configurations.production.command)"`
Expected: `development [ 'wrangler:build' ] apps/registry-ui opennextjs-cloudflare deploy --env development | opennextjs-cloudflare deploy --env production` (the `cwd` may print as `{projectRoot}`; either is right).

Do not run the target: it deploys.

- [ ] **Step 4: Check the production configuration builds what it would ship**

Run: `cd apps/registry-ui && pnpm exec wrangler deploy --dry-run --env production 2>&1 | grep -i 'total upload'`
Expected: a `Total Upload` under 65536 KiB (about 46168 KiB). This uploads nothing.

- [ ] **Step 5: Rewrite the two AGENTS.md bullets**

Load `gundam:writing-prose` first. Replace the bullet starting `**Nothing ships the registry yet.**` with:

```md
- **The registry ships from `cd.yml`.** A push to `development` or `production` runs `wrangler:deploy`
  with that branch's configuration: `development` on the account's `*.workers.dev`, `production` on the
  custom domain `ui.zeroxsolutions.com` alone. Each GitHub environment holds `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID`; without them the deploy job fails on auth.
```

Delete the bullet starting `**The worker is over the free plan's limit.**` entirely: the compressed limit it describes no longer exists, and the worker fits the 64 MiB uncompressed one on any plan.

Also change the file's second line, "No app here is deployed for an end user.", to "The registry site is the one app deployed; it serves the docs and the items' JSON."

- [ ] **Step 6: Point the old spec here**

At the top of `docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md`, under its title, add:

```md
> The deploy target and its checks are `2026-10-02-registry-deploy-design.md`'s; where the two disagree, that one holds.
```

- [ ] **Step 7: Gate and commit**

Run: `pnpm nx run-many -t lint typecheck test build`
Expected: `Successfully ran targets lint, typecheck, test, build for 5 projects`.

Load `gundam:landing-a-change` first.

```bash
git add apps/registry-ui/package.json AGENTS.md docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md
git commit -m "feat(registry-ui): deploy the worker per environment from cd

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## After merge (a person, not a task)

These follow the spec's "Before the first deploy" and "Checks"; the executor lists them in the final report and does none of them:

1. Confirm the `zeroxsolutions.com` zone is on the worker's Cloudflare account and nothing holds `ui.zeroxsolutions.com`.
2. Create the API token; set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the `development` and `production` GitHub environments.
3. Push `master:development`; on the workers.dev host check `/`, `/docs/components/tag-input`, `/og/docs/components/tag-input` and `/r/registry.json` answer `200`, and the worker's logs show no error.
4. Push `development:production`; check `curl https://ui.zeroxsolutions.com/r/registry.json`, the docs pages, and `shadcn add` of one item in a clean consumer.
