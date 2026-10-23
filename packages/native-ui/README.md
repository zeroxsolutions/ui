# @zeroxsolutions/native-ui

zui's React Native items, and the build that publishes them as four shadcn registries:
`nativewind-vega`, `uniwind-vega`, `nativewind-nova` and `uniwind-nova`.

- `src/registry/` holds the items. A class written as a `cn-<slot>` token is replaced at build time by
  the classes that style draws for that slot, in the form each engine compiles; any other class ships as
  written, so it has to work in NativeWind 4 (Tailwind 3.4) and in Uniwind (Tailwind 4).
- `styles/upstream/` holds the pinned shadcn style and colour snapshots the tokens are read from, and
  `registry-ui-items.json`, the `registry:ui` names upstream's base-vega registry lists.
  `nx run @zeroxsolutions/native-ui:upstream-refresh [commit]` refreshes them from a shadcn-ui/ui commit,
  the head of `main` without one; the commit that lands a refresh names the commit it read.
- `src/build/upstream-coverage.spec.ts` fails on an upstream item that has no registry item.
- `nx run @zeroxsolutions/native-ui:build-registry` writes the registries to `dist/r/styles/`.
  `@zeroxsolutions/registry-ui` copies them into its site, which serves them under `/r/styles/`.
  It also writes each registry's sources to `dist/src/<engine>-<style>/` as an app holds them after
  `shadcn add`, with NativeWind's `global.css` and `tailwind-theme.json`, for the native preview to import.
- `src/examples/` holds one demo per drawn item, `<name>-demo.tsx`, importing the items through `@/` as an
  app does; `@zeroxsolutions/native-ui/examples` exports them by name for the native preview.
