# @zeroxsolutions/native-ui

zui's React Native items, and the build that publishes them as four shadcn registries:
`nativewind-vega`, `uniwind-vega`, `nativewind-nova` and `uniwind-nova`.

- `src/registry/` holds the items. A class written as a `cn-<slot>` token is replaced at build time by
  the classes that style draws for that slot, in the form each engine compiles; any other class ships as
  written, so it has to work in NativeWind 4 (Tailwind 3.4) and in Uniwind (Tailwind 4).
- `styles/upstream/` holds the pinned shadcn style and colour snapshots the tokens are read from.
  `nx run @zeroxsolutions/native-ui:sync-upstream-styles <commit>` refreshes them.
- `nx run @zeroxsolutions/native-ui:build-registry` writes the registries to `dist/r/styles/`.
  `@zeroxsolutions/registry-ui` copies them into its site, which serves them under `/r/styles/`.
