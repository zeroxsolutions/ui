## Scaffold and Restructure Every Project Through an Nx Generator
`[HIGH]` `gen-via-generator`

Create every project — an `apps/<app>` deployable, a `packages/<lib>` library, or a scaffolded unit (component, hook, page) — with an **nx generator**, never hand-created files. A generator wires the project into the graph: tsconfig references, eslint, the test setup, target inference, tags, and the scoped `package.json` name — all invisible until a hand-rolled folder breaks them far from the change. Pass the **scoped import name** (`@scope/<x>` — nx derives the project name from it), and discover the right generator with `nx list` → `nx list <plugin>` → `nx g <plugin>:<gen> --help`. Pass **every** tooling flag the generator otherwise defaults to `none` — bundler, linter, unit-test runner, and (for an app) e2e runner — using this workspace's configured values (see `CLAUDE.md`); omit one and its build or test target silently vanishes. A worker app is generated the same way, then adapted into a thin wrangler shell.

Preview every run with **`--dry-run` first** and read the file list before writing — a generator edits shared root config (`nx.json`, `tsconfig.base.json`, the lockfile) alongside the new project, and undoing a mis-run is far more work than fixing an option up front. Steer the output with generator **options** (or an `nx.json > generators` default), never by hand-editing the generated `project.json` / `tsconfig` / config afterward — a hand-edit is invisible to nx and gets overwritten or fought by the next run. Regenerate an existing project in place with `--force`, never remove-then-recreate.

Move, rename, or delete a project with the **workspace generators** — `@nx/workspace:move`, `@nx/workspace:remove` — and add test/build tooling to an existing project with its **config generator** (`@nx/jest:configuration`, `@nx/vite:configuration`, `@nx/playwright:configuration`), never a raw `mv` / `rm` or a hand-copied config. A project's identity spans many files; only the generator rewrites every reference atomically, so a filesystem command leaves dangling tsconfig references and graph edges that break builds elsewhere.

**Incorrect — hand-rolled, bare name, or a filesystem move:**
```
mkdir -p packages/<lib>/src && touch packages/<lib>/package.json   # 🔴 drifts from the nx graph
nx g @nx/js:library foo                                            # 🔴 bare name → wrong/unscoped project
mv packages/<lib> packages/<other>                                # 🔴 dangling refs + graph edges
```

**Correct — generated, scoped, dry-run first, options not hand-edits:**
```
nx g @nx/js:library @scope/<lib> --dry-run     # inspect the file list, then run for real
nx g @nx/js:library @scope/<lib> --bundler=<bundler> --linter=<linter> --unitTestRunner=<runner> --tags=scope:shared
nx g @nx/workspace:move --project @scope/<lib> --destination packages/<other>
nx g @nx/workspace:remove @scope/<app>
```

Reference: see `naming-projects` · `structure-apps-packages` · `run-through-nx` · `worker-wrangler-config`
