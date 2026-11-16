# @zeroxsolutions/editor-docs-web

The editor docs: `content/docs/editor`, the pages of `/docs/editor`, and the route units of those paths.
`@zeroxsolutions/registry-editor-docs-zone` compiles the content, reading the folder itself, and renders each page.

- `@zeroxsolutions/editor-docs-web/routes` builds and matches the editor paths, and imports no React.
- `pnpm nx test @zeroxsolutions/editor-docs-web` runs the package's specs.
