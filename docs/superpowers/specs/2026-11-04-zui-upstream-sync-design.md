# zui against upstream: code-card, the overlaps, and the native parts

Upstream (shadcn-ui/ui `main` on 2026-11-04, the same component sources as the native pin
`ba1503c64472b82256d9de95e2e62c5901a38e8b`) now ships items zui wrote first, and ships parts of
components that zui's native ports lack. This change makes zui follow upstream wherever upstream has
the thing.

## Web (`packages/ui`, `packages/ui-docs-web`)

- **`code-block` becomes `code-card`.** zui's item is a code view on a `collapsible-card`: header,
  language, copy, line numbers. Upstream's `code-block` is a different component, and two items of one
  name on the same consumer's `components.json` read as one. Item, files, exports (`CodeBlock*` to
  `CodeCard*`), `data-slot`, docs page, demos, and every dependent (`markdown-view`, the docs site's
  own code views) move to the new name. `/r/styles/base-*/code-block.json` stops answering; no repo
  in the org installs it (GitHub code search, 2026-11-04).
- **`highlighted-code` leaves the registry and the docs, and stays in `packages/ui`.** Upstream's
  answer is the `use-highlighted-code` hook, whose highlighter loads thirteen languages under the
  GitHub themes. zui's highlighter carries the site's code theme, its language list and a Mermaid
  grammar, which the editor, the Mermaid viewer and `code-card` rely on, so `code-card` ships the
  highlighting files inside its own item instead of depending on a separate one.
- **`tool-call-card` is removed**, with its docs page and demos. Upstream's `trace` is the component
  for a tool call; a consumer installs `@shadcn/trace`.
- The editor's own `code-block` feature (a document node) is a different thing and keeps its name.

## Native (`packages/native-ui`, `packages/native-ui-docs-web`)

Each item gains the parts upstream's base-vega item has, with upstream's part names and props, styled
through the `cn-<slot>` tokens upstream's source uses, in all four registries:

| Item          | Parts added                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| `avatar`      | `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`                                            |
| `progress`    | `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`                      |
| `combobox`    | `ComboboxChips`, `ComboboxChip`, `ComboboxChipsInput` (multiple selection), `ComboboxClear` |
| `input-group` | `InputGroupTextarea`                                                                        |
| `tooltip`     | the arrow (`cn-tooltip-arrow`)                                                              |
| `toast`       | its root styled by `cn-toast` instead of a literal radius                                   |

Each new part gets a spec, a demo and a section on the item's native docs page. A part React Native
cannot draw the way the web does is adapted to the phone, as the existing items are, and the
adaptation is said on its docs page.

Not in this change: the slots that exist only for the DOM (`*-logical` for right-to-left placement,
`cn-menu-translucent`, the navigation menu's positioner, the scroll area's scrollbar), the styles
other than Vega and Nova on native, per-style restyling of zui's web items, and native ports of zui's
own composed items.
