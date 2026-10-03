# ZeroX Solutions UI

A [shadcn](https://ui.shadcn.com) registry of composed React components, and the npm packages they
build on. The components are drawn in shadcn's `base-nova` style on [Base UI](https://base-ui.com)
primitives, and you install them as source you own.

Docs and live previews: [ui.zeroxsolutions.com/docs](https://ui.zeroxsolutions.com/docs)

## Install a component

The app needs a `components.json` on a Base UI style. Create one with:

```bash
pnpm dlx shadcn@latest init --base base --preset nova
```

Then add any item by its URL:

```bash
pnpm dlx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json
```

The CLI writes the item's files under your `components.json` aliases, and pulls in every shadcn
primitive and registry item it composes. The full index is
[`/r/registry.json`](https://ui.zeroxsolutions.com/r/registry.json); each item's page in the docs
shows its preview, its source and its API.

## Packages

| Package                                                 | What it is                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`@zeroxsolutions/icons`](packages/icons)               | Inline-SVG React icons: brand marks and file-type icons, one import path per icon             |
| [`@zeroxsolutions/fluent-emoji`](packages/fluent-emoji) | Microsoft Fluent Emoji as a React component, with the Unicode catalog and self-hosted artwork |
| [`@zeroxsolutions/editor-core`](packages/editor-core)   | A headless, block-based rich-text editing engine with no React dependency                     |

```bash
pnpm add @zeroxsolutions/icons
```

Each package's README covers its API.

## Repository layout

| Path                   | Contents                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `apps/registry-ui`     | The registry items' source, `registry.json`, and the Next.js docs site that serves both |
| `apps/registry-ui-e2e` | Playwright tests against the built site                                                 |
| `packages/*`           | The npm packages above                                                                  |
| `iac/`                 | Terraform for the bucket that serves the emoji artwork                                  |

## Development

Requires Node.js and pnpm 10.

```bash
pnpm install
pnpm nx run-many -t lint typecheck test build      # the gate CI runs
pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui   # the site on the Workers runtime, port 8787
pnpm nx e2e @zeroxsolutions/registry-ui-e2e
```

Tasks run through [Nx](https://nx.dev); `pnpm nx show project <name>` lists a project's targets.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for how issues and
commits are written.
