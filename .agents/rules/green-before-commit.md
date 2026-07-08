## Ship Green and Rule-Audit the Diff Before Every Commit
`[HIGH]` `green-before-commit`

A change isn't done until **lint, build, and test are all green**. Write to the TDD loop — red → green → refactor — and treat the change as unfinished until its tests pass. The husky pre-commit hook runs `pnpm nx run-many -t lint build test` and **fails the commit** if any project fails any of the three; a standalone non-nx root runs its own toolchain's checks through the same hook. Never bypass with `--no-verify` or `HUSKY=0` — that bypass is itself hard-gated by a `.claude/hooks/*` PreToolUse check — fix the failing project instead.

Lint follows `eslint.config.mjs`. Don't add an inline `eslint-disable` without a stated reason: an unexplained disable hides the exact problem the rule exists to catch, so every disable carries a one-line `-- why`.

The gate proves the code *runs*; it can't prove the change *honors the rules*. So before every commit, **rule-audit the staged diff**: walk each file in `.claude/rules/*`, map the actual staged diff against it (at commit time, not from memory at session start), and state the result — compliant, or what you fixed. This is the only check that catches the semantic rules a tool can't gate: thin handlers, logic kept in the services, the `lib/` layer folders, naming, generator-scaffolded projects, every app carrying its `*-e2e`. The `.claude/hooks/*` PreToolUse checks are a backstop for the mechanical rules only and do not replace the audit.

**Incorrect — bypass a red gate:**
```ts
git commit --no-verify -m "…"   // 🔴 blocked by the hook; would leave the tree red
```
**Correct — fix, run green, audit, then commit:**
```ts
pnpm nx run-many -t lint build test   // ✅ lint + build + test green
// rule-audit: walk .claude/rules/* vs the staged diff → "compliant" / "fixed X"
git commit -m "…"                      // the hook re-runs and passes
```
Green keeps the releasable branch releasable; the audit keeps an un-thinned handler or a hand-scaffolded project out of history.

Reference: see `structure-lib-layers` · `hono-openapi-routes` · `gen-via-generator` · `e2e-pairs-each-app` · `CLAUDE.md`
