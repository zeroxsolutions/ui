# AGENTS.md

The house design system: a shadcn registry of composed components, and the UI packages the org's
frontends install. The registry site is the one app deployed; it serves the docs and the items' JSON.

## Workspace

- `apps/registry-ui` (+ `registry-ui-e2e`) - the Next.js site on a Cloudflare worker that serves the
  registry's items and their docs, with the web docs at `/docs` and the native docs at `/native/docs`.
- `apps/native-preview` (`@zeroxsolutions/native-preview`) - the Expo app that draws the native items'
  demos: exported for web into the site's `/native-preview`, and published per style as EAS updates
  that the docs' QR opens in Expo Go.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - editor primitives.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - Fluent emoji components, and the artwork
  they load from a public bucket.
- `packages/icons` (`@zeroxsolutions/icons`) - the org's icon set.
- `packages/ui` (`@zeroxsolutions/ui`) - the web items' source, `registry.json`, and the build that
  publishes them as the `base-*` registries the registry site serves.
- `packages/native-ui` (`@zeroxsolutions/native-ui`) - the React Native items and the build that
  publishes them as the `nativewind-*` and `uniwind-*` registries the registry site serves.
- `iac/` - Terraform, outside the nx graph: the one R2 bucket that serves the emoji artwork.
