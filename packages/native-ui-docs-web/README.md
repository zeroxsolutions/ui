# @zeroxsolutions/native-ui-docs-web

The native platform's docs: `content/native`, the pages of `/native`, `/native/docs`,
`/native/components` and `/native/blocks` with their components, and the route units of those paths.
`@zeroxsolutions/registry-ui` compiles the content and renders each page from its route file.

- `@zeroxsolutions/native-ui-docs-web/pages/<name>-page` is the page a route renders, taking what the route loaded.
- `@zeroxsolutions/native-ui-docs-web/routes` builds and matches the native paths, and imports no React.
- `pnpm nx test @zeroxsolutions/native-ui-docs-web` runs the package's specs.
