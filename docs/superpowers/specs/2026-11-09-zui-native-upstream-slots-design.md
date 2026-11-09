# zui native: the slots upstream's base items write

A native item follows a style only through the `cn-<slot>` tokens it writes. Upstream's base items
(`apps/v4/registry/bases/base/ui/` at the pin `ba1503c64472b82256d9de95e2e62c5901a38e8b`) write 396 of
the style sheets' slots, and the native items write 375 of those. Three native items write five slots
that only upstream's Radix base writes. This change makes the native items write what the base
items write, and adds a spec that keeps it so.

The rest of the style sheets' slots (the `*-aria` ones, `cn-drawer-content`, `cn-drawer-handle`,
`cn-combobox-item-text`, `cn-navigation-menu-viewport` and the like) belong to upstream's other bases,
and no base item writes them; they are not part of this change.

## Items that change

| Item                                       | Today                                                                                              | After                                                                                                                                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `native-select`                            | the field is a `SelectTrigger`, so it looks like Select's field                                    | the field is drawn with `cn-native-select`, 32px tall at `size="sm"` as upstream's `data-[size=sm]:h-8`, its chevron with `cn-native-select-icon` at the end, and the box around it is dimmed while disabled; the list it opens is still Select's |
| `calendar`, `captionLayout` with dropdowns | each dropdown is a small `SelectTrigger` with `cn-calendar-caption-label`                          | each dropdown is a box with `cn-calendar-dropdown-root` holding the label with `cn-calendar-caption-label` and a 14px muted chevron, as upstream draws it; the list is still Select's. `has-focus:` reads as the box's focused state              |
| `combobox`, an item                        | the check mark is drawn in the row, and the item's `pr-8` is replaced with `pr-2` to leave it room | the check mark is drawn with `cn-combobox-item-indicator`, at the item's end over the `pr-8` it keeps                                                                                                                                             |
| `context-menu`, a sub-menu's items         | `cn-context-menu-sub-content`, Radix's slot                                                        | the content's own `cn-context-menu-content` plus `cn-context-menu-subcontent`, as upstream's base composes it                                                                                                                                     |
| `code-block`, the copy button              | no slot                                                                                            | `cn-code-block-copy-button`, which luma and rhea fill with a hover background                                                                                                                                                                     |
| `trace`, a collapsible's content           | `cn-trace-collapsible-content-inner` only                                                          | `cn-trace-collapsible-content` on the outer view as well                                                                                                                                                                                          |
| `sidebar`, the gap beside the panel        | no slot                                                                                            | `cn-sidebar-gap`                                                                                                                                                                                                                                  |
| `navigation-menu`, the positioner          | no slot                                                                                            | `cn-navigation-menu-positioner`                                                                                                                                                                                                                   |
| `progress` with no children                | `cn-progress`, Radix's slot                                                                        | `cn-progress-track`, which holds the same classes in every style                                                                                                                                                                                  |
| `separator`                                | `cn-separator`, `cn-separator-horizontal`, `cn-separator-vertical`, Radix's                        | upstream base's own classes, which no style changes; a vertical separator stretches across its row (`self-stretch`) rather than taking `h-full`                                                                                                   |

The trace, sidebar and navigation-menu slots hold only transitions and a hover bridge, which the native
build drops, so each of those items draws as it does today. They are written so a class a style adds
there later reaches the native items. A class in any of these slots that the build cannot draw is
dropped by name for that slot, as the build already does for others, and any other one still stops the
build with `Untranslated <class> in <slot>`.

## Slots a native item does not write

Each of these is listed, with its reason, in the list the new spec reads:

- the eight `*-logical` slots of combobox, context-menu, dropdown-menu, hover-card, menubar, popover,
  select and tooltip, and the tooltip arrow's: they place a popup on an `inline-start` or `inline-end`
  side, and a native popup opens only on the top, right, bottom or left of its trigger;
- `cn-menu-translucent`: on the web a project's `menuColor` chooses it, and the native registries are
  built for the default, which leaves it out;
- `cn-scroll-area-scrollbar` and `cn-scroll-area-thumb`: the platform draws a ScrollView's scroll
  indicator, and an app cannot style it.

## The spec that keeps it so

`upstream-refresh` also saves the slots each upstream base item writes, from the same commit as the
style sheets, as a snapshot beside them. A spec in `src/build/` then fails when:

1. a slot an upstream base item writes is written by no native item and is not in the list above;
2. a native item writes a slot of the style sheets that no upstream base item writes;
3. a slot in the list above is no longer written by any upstream base item.

Tokens that name no slot in any of the eight style sheets, such as `cn-menu-target` or `cn-rtl-flip`,
are not counted.

## What is checked

- The 16 registries build. For each changed item, its registry output differs from today's in that
  item only, and the trace, sidebar and navigation-menu outputs do not differ at all.
- The changed items' specs cover the new drawing: the native-select field and chevron and its sm height,
  the calendar dropdown box, the combobox check over `pr-8`, the context-menu sub-menu classes and the
  vertical separator.
- Run against today's items, the new spec fails on each of the slots above.

Not in this change: a native picker for `native-select`, popups opening on a logical side, a styled
scroll indicator, and the motion durations these slots hold, which the items keep in code.
