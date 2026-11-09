# @zeroxsolutions/native-ui

zui's React Native items, and the build that publishes them as sixteen shadcn registries:
`nativewind-<style>` and `uniwind-<style>` for each of upstream's eight styles (vega, luma, lyra, maia,
mira, nova, rhea, sera).

- `src/registry/` holds the items. A class written as a `cn-<slot>` token is replaced at build time by
  the classes that style draws for that slot, in the form each engine compiles; any other class ships as
  written, so it has to work in NativeWind 4 (Tailwind 3.4) and in Uniwind (Tailwind 4).
- The tokens are read from `@zeroxsolutions/shadcn-upstream`'s snapshot of upstream's style sheets and
  colours, which the web registry reads too.
- `src/build/upstream-coverage.spec.ts` fails on an upstream item that has no registry item.
- `src/build/upstream-slots.spec.ts` fails on a slot upstream's base items write that no native item
  writes and the spec does not name as one a device cannot draw, and on a slot a native item writes that
  only another of upstream's bases writes.
- `nx run @zeroxsolutions/native-ui:build-registry` writes the registries to `dist/r/styles/`.
  `@zeroxsolutions/registry-ui` copies them into its site, which serves them under `/r/styles/`.
  It also writes each registry's sources to `dist/src/<engine>-<style>/` as an app holds them after
  `shadcn add`, with NativeWind's `global.css` and `tailwind-theme.json`, for the native preview to import.
- `src/examples/` holds one demo per drawn item, `<name>-demo.tsx`, importing the items through `@/` as an
  app does; `@zeroxsolutions/native-ui/examples` exports them by name for the native preview.
