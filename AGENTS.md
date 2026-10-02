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
