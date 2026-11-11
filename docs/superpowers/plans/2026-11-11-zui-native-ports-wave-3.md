# zui native, wave 3: the data items - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-11-zui-native-ports-wave-3-design.md`, under the first spec
`docs/superpowers/specs/2026-11-09-zui-native-zui-ports-design.md` and wave 2's test rules.

**Goal:** tree-item, file-tree, code-card, markdown-view, data-table, data-table-column-header, model-list and
resize-handle are in the 16 native registries, `PENDING` holding only wave 4's items.

## Global constraints

- One pull request, on `feat/native-zui-ports-wave-3`. Nothing is deployed.
- An item is registered where waves 1 and 2 registered theirs (registry.json, demo and `src/examples/index.ts`,
  docs page with `meta.json` and `index.mdx`, the native e2e's two lists, out of `PENDING`).
- Specs: behaviour only, `userEvent`, red first; a copied lib compared with its web source. What jest cannot
  press or type is a case in `apps/registry-native-ui-docs-zone-e2e/src/native-component-demos.spec.ts`.
- New packages: `@tanstack/react-table`, `unified`, `remark-gfm` and `remark-parse` to the default catalog,
  taken by every project declaring them.

## Review focus

- A markdown link that opens although react-markdown's filter would drop it.
- A port whose demo passes on NativeWind and breaks on Uniwind.
- A keyboard path (file-tree, tree-item, resize-handle) with no touch or screen-reader path to the same result.

## Tasks

1. Batch 1: tree-item, model-list, data-table-column-header, resize-handle (with `lib/resize-drag`). Commit.
2. Batch 2: data-table, with `@tanstack/react-table`. Commit.
3. Batch 3: code-card, with `lib/code-language`. Commit.
4. Batch 4: markdown-view, with the remark packages. Commit.
5. Batch 5: file-tree. Commit.
6. The browser cases the batches list, run in Chromium, Firefox and WebKit. Commit.
7. Screenshots of the eight in vega and nova from the web export, looked at; push; pull request with the
   Expo Go list.

Each batch ends with native-ui test, typecheck, lint, build-registry (16 valid) and native-ui-docs-web
typecheck.
