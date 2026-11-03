# AGENTS.md

The house design system: a shadcn registry of composed components, and the UI packages the org's
frontends install. The registry site is two zones on one host, each its own worker: the web zone and
the native zone serve the docs and the items' JSON of their platform.

## Workspace

- `apps/registry-ui` (+ `registry-ui-e2e`) - the web zone: the Next.js site on a Cloudflare worker that
  answers every path the native zone does not claim, the web items' JSON, `/docs`, and the sitemap index
  and `llms.txt` that link the native zone's.
- `apps/registry-native-ui-docs-zone` (+ `registry-native-ui-docs-zone-e2e`) - the native zone: the
  Next.js site on its own worker that serves `/native`, `/native/*`, the native previews, and the
  `nativewind-*` and `uniwind-*` items' JSON, with its assets under `/native-static`.
- `apps/native-preview` (`@zeroxsolutions/native-preview`) - the Expo app that draws the native items'
  demos: exported for web into the native zone's `/native-preview`, and published per style as EAS
  updates that the docs' QR opens in Expo Go.
- `apps/native-preview-uniwind` (`@zeroxsolutions/native-preview-uniwind`) - the same demos drawn under
  Uniwind: exported for web into the native zone's `/native-preview-uniwind`, and published per style as
  EAS updates of its own Expo project, which a Uniwind page's QR opens.
- `packages/editor-core` (`@zeroxsolutions/editor-core`) - editor primitives.
- `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - Fluent emoji components, and the artwork
  they load from a public bucket.
- `packages/icons` (`@zeroxsolutions/icons`) - the org's icon set.
- `packages/ui` (`@zeroxsolutions/ui`) - the web items' source, `registry.json`, and the build that
  publishes them as the `base-*` registries the web zone serves.
- `packages/ui-docs-web` (`@zeroxsolutions/ui-docs-web`) - the web docs' content, the pages of `/`,
  `/docs`, `/blocks` and `/view`, and their route units; the web zone renders the pages.
- `packages/native-ui` (`@zeroxsolutions/native-ui`) - the React Native items and the build that
  publishes them as the `nativewind-*` and `uniwind-*` registries the native zone serves.
- `packages/native-ui-docs-web` (`@zeroxsolutions/native-ui-docs-web`) - the native docs' content,
  the pages of `/native`, `/native/docs`, `/native/components` and `/native/blocks`, and their route
  units; the native zone renders the pages.
- `iac/` - Terraform, outside the nx graph: the one R2 bucket that serves the emoji artwork.
