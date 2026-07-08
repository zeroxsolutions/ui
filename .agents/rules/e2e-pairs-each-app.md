## Pair Every App With Its `*-e2e` Project and Keep It in Sync
`[HIGH]` `e2e-pairs-each-app`

Every app carries a paired `<app>-e2e` project (its scoped name is `@scope/<app>-e2e`) holding the end-to-end tests — they live in that sibling, never inside the app. Generate the app so the sibling scaffolds with it, and whenever you change the app, add or adjust its e2e coverage in the same change. The pairing is a mechanically-gated invariant: an app with no `*-e2e` sibling fails the pre-tool hook.

The e2e **runner follows the app kind** — a browser app drives a browser, a worker/node app runs HTTP-level with no browser — and matches the workspace's configured e2e runner (see `CLAUDE.md`, encoded in `nx.json`); read that config rather than assuming it. Invoke through nx by the scoped e2e project name.

**Incorrect — e2e specs inside the app, or an app with no sibling:**
```
apps/<app>/src/**.e2e.ts   # 🔴 e2e living in the app project
apps/<app>                 # 🔴 no apps/<app>-e2e sibling → fails the pre-tool hook
```
**Correct — a paired sibling, run by its scoped name:**
```
apps/<app>
apps/<app>-e2e             # ✅ @scope/<app>-e2e
# nx e2e @scope/<app>-e2e
```

Reference: see `naming-projects` · `gen-via-generator` · `green-before-commit`
