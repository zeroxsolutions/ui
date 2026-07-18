## Place Deployables in `apps/*`, Libraries in `packages/*`, and Keep Non-Nx Roots Outside the Graph
`[HIGH]` `structure-apps-packages`

In an nx monorepo, split every project by role: **deployables** (things you ship - web apps, worker apps) live in `apps/*`, and **shared libraries** (code another project imports - `packages/<domain>` bounded contexts, UI, utilities) live in `packages/*`. This placement is what keeps a library reusable by any number of deployables without moving files. Create each project with an nx generator so it's wired into the graph, and refer to it by its **scoped** `package.json` name.

Some top-level roots are **standalone - not nx projects** (the `iac/` Terraform layer). They have their own toolchain, live outside the nx graph, and nx never builds or tests them: don't run `nx` targets against them, and don't fold them into `apps/*` or `packages/*`.

**Incorrect - a library placed as an app, a hand-rolled project, or nx run against a standalone root:**
```
apps/<domain>/          # 🔴 a shared library isn't a deployable - the workers import it
mkdir packages/<lib>    # 🔴 hand-rolled folder drifts from the nx graph
nx build iac            # 🔴 iac is not an nx project - "project not found"
```

**Correct - role-placed, generated, scoped; standalone roots on their own tools:**
```
apps/<worker>                        # deployable worker
packages/<domain>                    # shared library, imported by the deployables
nx g @nx/js:library @scope/<lib>     # generator wires tsconfig refs, tags, scoped name
# drive iac/ with terraform (its own toolchain), not nx
```

**Rules of thumb:**
- If another project imports it -> `packages/*`; if you deploy it -> `apps/*`; a top-level root with no scoped `package.json` in the graph -> standalone, its own toolchain owns it.
- The concrete inventory (which apps/packages/roots exist) lives in `CLAUDE.md`; this rule is only the placement scheme.
- Never `mkdir` a project - generate it (see `gen-via-generator`).

**Why:**
- Hand-placed or mis-placed projects drift from nx's target inference and dependency graph, breaking `affected` builds and module boundaries in ways tedious to debug; forcing a non-nx toolchain into the graph produces phantom projects and broken targets.

Reference: see `naming-projects`, `gen-via-generator`, `boundary-worker-composition-only`, `iac-terraform-root`
