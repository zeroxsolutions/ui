# Git commit rules

Applies to every commit in this repo. Principles, not a script — the goal is a
history that explains itself.

## Conventional Commits

Every subject is `type(scope): summary`, lowercase, imperative, no trailing
period. Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`,
`ci`, `perf`. Scope is the Nx project or area (`mcp`, `docs`, `nx`) — omit it
only when the change is genuinely workspace-wide.

## English only

Subject and body in English, even when the chat is Vietnamese. Mirrors the
documentation rule.

## One logical change per commit

A commit is the smallest reversible unit that still makes sense on its own.
Don't bundle an unrelated fix into a feature commit; don't split one change
across commits that each leave the tree broken.

## Body explains why, not what

The diff already shows what changed. Use the body for the constraint, the
decision, the thing the next reader can't reconstruct from the code. Reference
the driving rule or memory when one exists. Never write "previously this did X"
archaeology — the history owns that.

## The pre-commit hook must pass

`.husky/pre-commit` runs `pnpm nx run-many -t lint build`. Don't `--no-verify`
past a failing lint or build to land a commit — fix it or don't commit. If a commit is
legitimately allowed to skip the hook, say so explicitly and why.

## Commit only when asked

Don't commit or push on your own initiative. When you do commit, never bypass
review by force-pushing or amending shared history without being told to.
