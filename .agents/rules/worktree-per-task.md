## Run Each Task and Session on Its Own Worktree; Serialize Scaffolding to One
`[HIGH]` `worktree-per-task`

Never do feature work on the releasable integration branch, and never share one working tree between concurrent tasks. Each task — and each concurrent session on the same repo — runs on its own `<type>/<short-kebab-desc>` branch (the same `<type>` as commits: `feat/attendance`, `fix/auth-token`, `chore/claude-rules`) in a dedicated **git worktree**: an isolated working copy with its own working directory, git index, and HEAD, so edits and `git add` / `commit` can't collide. A branch **alone** isn't enough — two branches in one working directory still share one index and one HEAD, so they step on each other; the worktree is the only safe way to run tasks concurrently. The `.git` object store + refs and the pnpm store are shared and safe, and each worktree carries its **own** installed `node_modules`. Automate the create/teardown where the toolchain offers a managed worktree. Integrate by rebasing onto the releasable branch to keep history linear, then merge and remove the worktree.

That isolation is **partial** — it covers each task's files, not the shared root config (`nx.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`), which is a single surface present in every worktree. A generator run or a dependency install edits that surface, and two of them on two branches conflict at merge even when the projects are unrelated. So worktrees buy parallel **code** work, not parallel **scaffolding**: serialize "create a project / add a dependency" to one session at a time across the whole repo, and integrate often so the shared-config window stays small.

**Incorrect — feature work on the releasable branch, or concurrent scaffolding:**
```
git switch <releasable-branch> && # …edit, commit…       # 🔴 the integration branch is no longer releasable
# session A: nx g @nx/js:library @scope/a
# session B (same time): nx g @nx/js:library @scope/b     # 🔴 guaranteed merge conflict on nx.json + the lockfile
```
**Correct — a worktree per task, scaffolding serialized:**
```
git worktree add ../<repo>-<app> -b feat/<app>           # ✅ isolated files, index, HEAD
# …work + review in it → rebase onto the releasable branch → merge → remove the worktree…
# run one generator/install, commit, integrate; then the next session scaffolds   # ✅ serialized
```

Reference: [git worktree](https://git-scm.com/docs/git-worktree) · see `gen-via-generator`
