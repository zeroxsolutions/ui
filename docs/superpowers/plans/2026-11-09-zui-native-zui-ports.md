# zui native: zui's own items on React Native - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-09-zui-native-zui-ports-design.md`

**Goal:** the 39 web-only zui components are in the 16 native registries, each with its demo, docs page and
spec, writing the same style tokens as its web twin.

## Global constraints

- One pull request per wave; this plan's tasks 1-2 land with wave 1. Nothing is deployed.
- An item is registered where the present ports are: `packages/native-ui/registry.json` (under
  `src/registry/components/<category>/<name>.tsx`, the web item's category), `src/examples/<name>-demo.tsx`
  and `src/examples/index.ts`, `packages/native-ui-docs-web/content/native/components/<name>.mdx`, its
  `meta.json` and `index.mdx` table, and the native e2e's page and registry lists.
- Every part and prop keeps the web item's name; a dropped one is named, with its reason, on the docs page.
- Icons are `lucide-react-native`'s static icons; animated web icons are not ported.
- Single-project nx targets on `@zeroxsolutions/native-ui`, `native-ui-docs-web` and the zone apps.

## Review focus

- A zui slot class the native build cannot draw (a `has-[...]` or `group-data-` variant), dropped by name for
  its slot rather than shipped as a class NativeWind ignores.
- A port that reads well in vega and breaks in lyra or sera (square corners, `text-xs`, sera's uppercase).
- A pressable part with no accessibility role or label where the web part has one.
- A demo that passes on NativeWind and fails on Uniwind.

## Task 1: zui's sheets in the native build

- `packages/native-ui` declares `@zeroxsolutions/ui` as a dev dependency. A `src/build/style-sheet.ts`
  exports `styleSheet(style): string`, upstream's sheet followed by zui's
  (`@zeroxsolutions/ui/registry/styles/style-<style>.css`); `tools/build-registry.mts` and
  `src/build/slot-tokens.testing.ts` read it in place of upstream's alone.
- Check: the 16 registries build unchanged (no item writes a zui slot yet); native-ui test, typecheck, lint.

## Task 2: the twin check

- `src/build/web-twins.spec.ts`: for each web `registry:component`, the native registry has an item of the
  same name or it is in `NOT_PORTED` (the block's name, with its reason); for each ported pair, the zui
  slots (tokens zui's sheets define) the native source writes equal the web source's, minus a written
  per-item list of slots a phone cannot draw, each with its reason.
- Run it on today's tree: it fails listing the 39 items, and the two present ports' missing zui slots.
- password-input and unsaved-changes-toolbar write `cn-password-input` and `cn-unsaved-changes-toolbar`;
  the build drops what it cannot draw by name. While waves are open the spec's missing-port case lists the
  later waves' items as pending, and the list shrinks to empty in wave 4.

## Task 3: wave 1 (22 items)

Ported in batches, dependencies first: status-indicator, unsaved-indicator, icon-media, icon-label, center,
page-container, panel-header, panel-row, panel-field-group; then collapsible-card, reasoning-collapsible,
copy-button (`expo-clipboard`), file-type-icon, font-preview, image-preview; then permission-card,
ai-provider-card, model-info-card, chat-message, chat-suggestion-item, floating-toolbar, editor-tab.

Each item: source and spec (parts, states, accessibility, the vega and lyra classes of its zui slots),
demo, docs page, registry entry, e2e lists. A batch ends with native-ui test, typecheck, lint and
build-registry, and a commit.

Then screenshots of the 22 in vega and nova from the web preview, push, and the pull request.

## Tasks 4-6: waves 2, 3 and 4

Planned in the same shape when their wave starts, from the spec's table. Wave 4 begins by asking the person
where emoji-picker's catalog comes from.
