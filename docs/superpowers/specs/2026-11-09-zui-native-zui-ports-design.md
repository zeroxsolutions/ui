# zui native: zui's own items on React Native

The web registry publishes 44 of zui's own components and one block; the native registries publish 5 of
them (code-input, password-input, password-strength, tab-bar, unsaved-changes-toolbar). This change ports
the other 39, so an app built with `@zui` on React Native composes
the same parts as one built on the web.

## What is ported

39 items, in four waves, each its own pull request:

| Wave                  | Items                                                                                                                                                                                                                                                                                                                                                    | What they need                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1, display and layout | status-indicator, unsaved-indicator, icon-media, icon-label, center, page-container, panel-header, panel-row, panel-field-group, collapsible-card, reasoning-collapsible, copy-button, permission-card, ai-provider-card, model-info-card, chat-message, chat-suggestion-item, file-type-icon, font-preview, image-preview, floating-toolbar, editor-tab | native primitives that exist; `expo-clipboard`, already a dependency                                     |
| 2, inputs             | number-field, tag-input, language-toggle-group, language-combobox, frontmatter-form, emoji-appearance-toggle-group, command-menu                                                                                                                                                                                                                         | native primitives that exist; the Fluent emoji's images (below)                                          |
| 3, data               | tree-item, file-tree, code-card, markdown-view, data-table, data-table-column-header, model-list, resize-handle                                                                                                                                                                                                                                          | `@tanstack/react-table` and `remark` with `remark-gfm`, pure JavaScript, which the web items already use |
| 4, pickers            | emoji-picker, avatar-picker                                                                                                                                                                                                                                                                                                                              | the Fluent emoji's images; `expo-image-picker` for avatar-picker's upload                                |

Not ported: **ai-provider-picker**, the one block, since the native registries publish no block and the
native docs have no blocks page. The spec below names it, so the next web item that is neither ported nor
named fails it.

resize-handle drags with a finger as native's resizable does, and editor-tab shows its close button at
all times, since a phone has no hover to reveal it.

## How a port follows the web item

- **Same name, parts and props.** Every part the web item exports is exported under the same name, with the
  same props. A prop the platform cannot honour, such as a hover state, is dropped and the item's docs page
  says why, as the present ports do. Pressing stands in for hovering, and a web keyboard shortcut is
  dropped.
- **Same style tokens.** A port writes the `cn-` tokens its web twin writes: upstream's slots, and zui's
  own (`cn-collapsible-card-surface`, `cn-tree-item`...). The native build reads zui's eight sheets from
  `@zeroxsolutions/ui` (`registry/styles/style-<style>.css`, a dev dependency) beside upstream's, and
  translates them per engine as it does upstream's. A class the build cannot draw is dropped by name for its
  slot, and any other one stops the build. The two present ports whose web twin writes a zui slot
  (password-input, unsaved-changes-toolbar) write it too.
- **Icons.** The web items' animated icons become their static `lucide-react-native` icons; the animation
  plays on hover, which a phone has not.
- **Every engine and style.** Each port is in all 16 registries, with a demo in `src/examples`, a docs page
  under `/native/components/<engine>/<name>`, and a preview in the native preview apps, as the present
  ports are.

## The Fluent emoji on native

The native items draw each emoji with `expo-image` straight from the house CDN (React Native's `Image` draws
no svg, which three of the five styles are),
`https://fluent-emoji.zeroxsolutions.com/<style>/<codepoint>.<ext>`, which serves every style's artwork,
through a small `fluent-emoji` registry lib in the native registries that turns a glyph into that URL.
They do not import `@zeroxsolutions/fluent-emoji`, whose URL module reads `import.meta.url`, which Metro
does not transform unless an app turns it on; the package does not change. emoji-appearance-toggle-group
needs only a few glyphs. emoji-picker also needs the emoji catalog (names and categories), which the CDN
does not serve today; where it comes from is decided with the person before wave 4 starts.

## What is checked

- Each port's spec covers its parts, its states and what a screen reader hears, as the present ports'
  do, on both engines.
- A spec fails when a ported item writes a different set of zui slots than its web twin, beyond the
  dropped classes it lists, and when a web item is neither ported nor in the not-ported list.
- The 16 registries build and validate; `upstream-coverage.spec.ts` keeps passing.
- Each wave's pull request carries screenshots of its items in vega and nova from the web preview, and
  lists them for a check on a phone in Expo Go, which the person merging does; nothing is deployed before.

Not in this change: native blocks, animated icons on native, and a desktop
target, which is Electron and draws the web registry.
