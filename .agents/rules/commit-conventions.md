## Commit Only When Asked — Atomic, Conventional, Secret-Free
`[HIGH]` `commit-conventions`

Commit (and push) **only when the user explicitly asks** — never auto-commit; without a request, keep working. If you're on the releasable branch and need to commit, **branch first** onto a `<type>/<kebab>` task branch in its own worktree (see `worktree-per-task`). And **never commit a secret** — service-account keys, database URLs, and the like stay in the secret store; if one appears in the staged diff, move it out before committing (see `secrets-and-logging`).

Write each commit in the Conventional Commits form `type(scope): subject`, where `type` is one of `feat` `fix` `docs` `chore` `refactor` `test` `build` `ci` `perf`; `scope` is a workspace area (`claude`, `deps`, `nx`, `workspace`) or a project's basename, omitted for repo-wide changes; and `subject` is imperative, lowercase, no trailing period, ≤ ~72 chars. Keep commits **atomic** — one logical change each, split unrelated work — and let an optional body explain *why*, not what the diff already shows. Mark a breaking change as `type!: subject` with a `BREAKING CHANGE:` footer, and carry a `Co-Authored-By:` trailer on any commit made with AI assistance.

**Incorrect — unprompted, non-atomic, with a secret in the diff:**
```
git add . && git commit -m "updates"   # 🔴 no request; two features + a fix; a .env in the diff
```

**Correct — requested, on a task branch, atomic and conventional, secrets excluded:**
```
feat(<scope>): add per-session roster snapshot   # ✅ one logical change; keys stay in the secret store

Why: audit needs the roster as-of the session, not the live list.

Co-Authored-By: …
```

Reference: see `worktree-per-task` · `secrets-and-logging`
