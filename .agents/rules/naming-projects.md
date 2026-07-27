## Name Each Project by Its Kind or Role; Address It by Its Scoped Name
`[HIGH]` `naming-projects`

Name a **deployable app for what it is - its kind** - as an `apps/<kind>` project (`back-office`, `landing`, `admin`, `desktop`, `mobile`, ...) with a paired `<app>-e2e` sibling (except a **Storybook host**, which is covered by its own `test-storybook` target instead - see `e2e-pairs-each-app`). Kinds are an **open set**: a concept that isn't listed (a CLI, a VS Code extension, a Figma plugin) gets its own descriptive name and its own rule - never force-fit it into an existing label, since the kind name is the contract other rules dispatch on. The concrete app/worker inventory for *this* product lives in `CLAUDE.md`.

**Worker apps are named by their behavioral role, never by a trigger mechanism or a platform binding.** The four roles are `*-gateway` (edge composition), `*-service` (synchronous HTTP), `*-consumer` (asynchronous message consumer), and `*-job` (scheduled/periodic task). `consumer` and `job` name the *behavior* (consume messages / run a scheduled task), not a platform binding (`queue`) or a scheduler mechanism (`cron`), so they stay accurate on any target platform - which is also why each role is split into its own worker (see `boundary-worker-composition-only`). A worker keeps its role name even after it gains an additional handler of a different trigger kind (a gateway that also enqueues stays `*-gateway`; producing does not change its role); only a worker whose *primary* purpose is consuming messages (or running on a schedule) is named `*-consumer` (`*-job`).

**A multi-deployable surface names every project `<surface>-<role>`, never a bare surface name.** A gateway worker is `<composition-package>-gateway` (its composition package name plus `-gateway`); the original surface is un-prefixed (the default) and each additional surface carries its prefix. The role suffix on *every* project is what keeps a surface's gateway, frontend, and contract package from colliding on a bare surface name.

**Classify a new requirement before creating projects:**
1. **A bounded context with its own data and business logic** -> `packages/<domain>` + `apps/<domain>-service`, plus `apps/<domain>-consumer` *only* if it consumes messages and `apps/<domain>-job` *only* if it runs on a schedule; the gateway adds composition routes over the domain's `hc<XxxApp>` surface.
2. **Otherwise (it re-faces existing domains): a new audience needing its own deploy, scale, or auth** -> a new gateway surface (`packages/<surface>-api` + `apps/<surface>-api-gateway` + `packages/<surface>-api-specs`, and `apps/<surface>-web-app` if it has a frontend); if not, extend the existing gateway with a route group.

A project's **identity is its `package.json#name` - the scoped name** (`@scope/<project>`), never the folder basename. Every task-runner invocation (`nx <target> @scope/<project>`) and every `dependsOn` uses that scoped name; the nx graph is keyed on `package.json#name`, so a bare folder basename resolves to nothing and fails with *"project not found"*. Folders and URLs stay kebab-case and unscoped; only the project name carries the scope.

**Incorrect - a trigger-mechanism name, a bare surface name, or a bare basename that won't resolve:**
```
apps/payments-queue                      # 🔴 names the binding, not the role -> apps/payments-consumer
apps/reports-cron                        # 🔴 names the scheduler, not the role -> apps/reports-job
apps/admin                               # 🔴 bare surface name collides with admin-web-app / admin-api
nx build <project>                       # 🔴 bare folder basename -> "project not found"
dependsOn: ["api"]                       # 🔴 never resolves
```

**Correct - role-based worker names; surface-prefixed multi-deployable surfaces; scoped names:**
```
apps/payments-consumer   apps/reports-job        # ✅ role names (consume messages / run a scheduled task)
apps/admin-gateway   apps/admin-gateway-e2e      # ✅ un-prefixed default surface; role stable across added triggers
apps/partner-api-gateway   apps/partner-web-app  # ✅ a second surface: <surface>-<role>, no collision
nx build @scope/<project>                         # ✅ scoped package.json#name resolves
dependsOn: ["@scope/<project>"]
```
*"project not found" almost always means a folder basename slipped in - confirm with `nx show projects`.*

Reference: see `naming-files-and-symbols`, `structure-apps-packages`, `e2e-pairs-each-app`, `boundary-worker-composition-only`
