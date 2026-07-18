## Pair Every App With Its `*-e2e` Project and Keep It in Sync
`[HIGH]` `e2e-pairs-each-app`

Every app carries a paired `<app>-e2e` project (its scoped name is `@scope/<app>-e2e`) holding the end-to-end tests - they live in that sibling, never inside the app. Generate the app so the sibling scaffolds with it, and whenever you change the app, add or adjust its e2e coverage in the same change. The pairing is a project convention: don't ship an app without its `*-e2e` sibling.

The e2e **runner follows the app kind** - a browser app drives a browser, a worker/node app runs HTTP-level with no browser - and matches the workspace's configured e2e runner (see `CLAUDE.md`, encoded in `nx.json`); read that config rather than assuming it. Invoke through nx by the scoped e2e project name.

**Exception - a Storybook host.** A Storybook host app (one that owns a `.storybook/` config) is **not** paired with a `*-e2e` sibling: on modern Nx (v21+ removed the sibling `storybook-e2e` Cypress generator) a Storybook host is tested by its own on-project **`test-storybook`** target via `@storybook/test-runner` (Nx's `interactionTests`), not a separate e2e project. A Storybook host (any app owning a `.storybook/` directory) is exempt from the `*-e2e` pairing; keep that host's `test-storybook` target as its e2e-equivalent coverage.

**Incorrect - e2e specs inside the app, or an app with no sibling:**
```
apps/<app>/src/**.e2e.ts   # 🔴 e2e living in the app project
apps/<app>                 # 🔴 no apps/<app>-e2e sibling -> breaks the e2e-pairing convention
```
**Correct - a paired sibling, run by its scoped name:**
```
apps/<app>
apps/<app>-e2e             # ✅ @scope/<app>-e2e
# nx e2e @scope/<app>-e2e
```

Reference: see `naming-projects`, `gen-via-generator`, `green-before-commit`
