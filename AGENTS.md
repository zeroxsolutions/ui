# AGENTS.md

The house design system: a shadcn registry of composed components, and the UI packages the org's
frontends install. The registry site is the one app deployed; it serves the docs and the items' JSON.

## Workspace

- `apps/registry-ui` (+ `registry-ui-e2e`) - the registry: the composed items' source, `registry.json`,
  and the Next.js site on a Cloudflare worker that serves both, with the docs at `/docs`.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - editor primitives.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - Fluent emoji components, and the artwork
  they load from a public bucket.
- `packages/icons` (`@zeroxsolutions/icons`) - the org's icon set.
- `iac/` - Terraform, outside the nx graph: the one R2 bucket that serves the emoji artwork.

## This project's choices

- **The registry ships from `cd.yml`.** A push to `development` or `production` runs `wrangler:deploy`
  with that branch's configuration: `development` on the account's `*.workers.dev`, `production` on the
  custom domain `ui.zeroxsolutions.com` alone. Each GitHub environment holds `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID`; without them the deploy job fails on auth.
- **The registry publishes composed items only.** Every `components.json` alias points into
  `@/registry/bases/base-ui/*` instead of `@/components`, because the registry serves its files from
  where they live. The primitives there are `shadcn add -o` output and are never published, so an app
  that installs an item takes its primitives from shadcn's own registry.
- **Animated icons are `@lucide-animated` primitives, vendored and never published.** An item names
  each one in `registryDependencies` by its full URL, `https://lucide-animated.com/r/<icon>.json`,
  because the short form resolves only while shadcn's public directory lists that registry. The
  cost: a control that animates its icon drives the icon's `startAnimation` / `stopAnimation` handle,
  which is exported and typed but undocumented.
- **A target name with a colon cannot be run as `nx run <project>:<target>`.** nx splits it, so
  `wrangler:dev` is run as `nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`. The e2e
  project declares `wrangler:build` as its own dependency for the same reason: the Playwright plugin
  infers a target named `wrangler`.
- **`fluent-emoji` is keyed by its bare name in the graph.** Its `package.json` sets `nx.name`, so the
  sync runs as `nx rclone:sync fluent-emoji`, and the scoped name fails with `Could not find
  project`. Fixing it means renaming the project.
