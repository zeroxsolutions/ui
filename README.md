<p align="center">
  <a href="https://ui.zeroxsolutions.com">
    <img src="apps/registry-ui/src/app/icon.svg" alt="ZeroX Solutions UI" width="96" height="96">
  </a>
</p>

<h1 align="center">ZeroX Solutions UI</h1>

<p align="center">
  Composed React components for shadcn, on Base UI. Copy them in, own the source.
</p>

<p align="center">
  <a href="https://github.com/zeroxsolutions/ui-sdk/actions/workflows/ci.yml"><img src="https://github.com/zeroxsolutions/ui-sdk/actions/workflows/ci.yml/badge.svg?branch=master" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@zeroxsolutions/icons"><img src="https://img.shields.io/npm/v/@zeroxsolutions/icons?label=icons" alt="@zeroxsolutions/icons on npm"></a>
  <a href="https://www.npmjs.com/package/@zeroxsolutions/fluent-emoji"><img src="https://img.shields.io/npm/v/@zeroxsolutions/fluent-emoji?label=fluent-emoji" alt="@zeroxsolutions/fluent-emoji on npm"></a>
  <a href="https://www.npmjs.com/package/@zeroxsolutions/editor-core"><img src="https://img.shields.io/npm/v/@zeroxsolutions/editor-core?label=editor-core" alt="@zeroxsolutions/editor-core on npm"></a>
</p>

<p align="center">
  <a href="https://ui.zeroxsolutions.com/docs"><strong>Documentation</strong></a> -
  <a href="https://ui.zeroxsolutions.com/docs/installation">Installation</a> -
  <a href="https://ui.zeroxsolutions.com/r/registry.json">Registry index</a>
</p>

## About

A [shadcn](https://ui.shadcn.com) registry of composed React components, and the npm packages they
build on. The components are drawn in shadcn's `base-nova` style on [Base UI](https://base-ui.com)
primitives, and the shadcn CLI writes them into your app as source you own.

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
