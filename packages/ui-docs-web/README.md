# @zeroxsolutions/ui-docs-web

The web platform's docs: `content/docs`, the pages of `/`, `/docs`, `/blocks` and `/view` with their
components, and the route units of those paths. `@zeroxsolutions/registry-ui` compiles the content and
renders each page from its route file.

- `@zeroxsolutions/ui-docs-web/pages/<name>-page` is the page a route renders, taking what the route loaded.
- `@zeroxsolutions/ui-docs-web/routes` builds and matches the web paths, and imports no React.
- `pnpm nx test @zeroxsolutions/ui-docs-web` runs the package's specs.
