## Name Each Project by Its Kind or Role; Address It by Its Scoped Name
`[HIGH]` `naming-projects`

Name a **deployable app for what it is - its kind** - as an `apps/<kind>` project (`back-office`, `landing`, `admin`, `desktop`, `mobile`, ...) with a paired `<app>-e2e` sibling (except a **Storybook host**, which is covered by its own `test-storybook` target instead - see `e2e-pairs-each-app`). Kinds are an **open set**: a concept that isn't listed (a CLI, a VS Code extension, a Figma plugin) gets its own descriptive name and its own rule - never force-fit it into an existing label, since the kind name is the contract other rules dispatch on. **Worker apps are named by their role** - `*-gateway`, `*-service`, `*-cron`, `*-queue` - not their trigger mix; a worker keeps its role name even after it gains `scheduled`/`queue` handlers.

A project's **identity is its `package.json#name` - the scoped name** (`@scope/<project>`), never the folder basename. Every task-runner invocation (`nx <target> @scope/<project>`) and every `dependsOn` uses that scoped name; the nx graph is keyed on `package.json#name`, so a bare folder basename resolves to nothing and fails with *"project not found"*. Folders and URLs stay kebab-case and unscoped; only the project name carries the scope. The concrete app/worker inventory lives in `CLAUDE.md`.

**Incorrect - a role-mixed name, or a bare basename that won't resolve:**
```
apps/admin-gateway-with-cron       # 🔴 name a worker by role, not its trigger mix
nx build <project>                 # 🔴 bare folder basename -> "project not found"
dependsOn: ["api"]                 # 🔴 never resolves
```

**Correct - one kind/role per app + its e2e sibling; scoped names everywhere:**
```
apps/admin-gateway   apps/admin-gateway-e2e   # ✅ role name, stable across added triggers
nx build @scope/<project>                       # ✅ scoped package.json#name resolves
dependsOn: ["@scope/<project>"]
```
*"project not found" almost always means a folder basename slipped in - confirm with `nx show projects`.*

Reference: see `naming-files-and-symbols`, `structure-apps-packages`, `e2e-pairs-each-app`
