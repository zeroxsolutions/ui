# zui: animated icons in every control, on web and native

## Intent

The web registry publishes 38 animated icons (`packages/ui/registry/bases/base-ui/icons/*-icon.tsx`,
adapted from lucide-animated), and thirteen of zui's web items already start them from their controls
(copy-button, password-input, password-strength, tag-input, emoji-picker, editor-tab, collapsible-card,
reasoning-collapsible, permission-card, data-table, data-table-column-header, tree-item, file-tree).
The editor chrome, chat-input, avatar-picker and the positions listed below still draw static
`lucide-react` icons, and native has no animated icon at all. The owner asked (2026-11-16) for animated icons on native, and for every icon
still missing its motion to get it.

"Every icon" follows the rule the design system already holds (`animating-a-component`): an animated
icon goes where the reader acts, a button, a link, a toggle, a menu item, or an icon reporting a state
the reader's action caused (copied, saved, selected). An icon in content nobody acts on, a card title,
an empty state, a toast's status, a separator, stays static. My call: that rule decides scope, not the
count of static imports.

## Goals

1. Every icon in a control or a state report inside zui's own items is an animated icon, on web and on
   native, started by the control.
2. Native publishes an animated icon for every web animated icon, under the same name, so an item ported
   between platforms keeps its icons.
3. Under reduced motion no icon moves, on either platform.
4. Nothing changes for a reader using a screen reader: the icon stays hidden from assistive tech, and
   the control's label says what it does.

## Non-goals

- The upstream primitives (`ui/` on web, the native `ui/` ports of upstream). They mirror shadcn and
  react-native-reusables, which draw static icons; changing them forks upstream. My call.
- Static positions: card titles, empty states, toast and sonner statuses, breadcrumb and pagination
  separators, input adornments (search, file type), spinners, brand marks.
- The docs site's own chrome (`packages/ui/src/site`): the style picker's chevron and check, the
  preview's full page button. A follow-up if wanted.
- Docs pages for the icons themselves; they stay registry items other items depend on, as today.

## The inventory (from master, 2026-11-16)

### Web: control positions on a static icon

Seventeen positions already have a twin and only need the swap:

- avatar-picker's selected swatch (Check)
- permission-card's pending badge (Circle)
- chat-input's Send (ArrowUp)
- the toggle feature's slash item (ChevronRight)
- math's Apply (Check), Cancel (X) and View tab (Eye)
- the math and mermaid toolbars' export-done state (Check) and their two Copy menu items each (Copy)
- the standard toolbar's Bold, Italic and Underline
- mermaid's View tab (Eye)

Thirty-four icons have no twin and are authored, in the positions the inventory lists:

| Group                         | Icons                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor toolbar and slash menu | Strikethrough, Code, Highlighter, Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, TextQuote, Minus, Info, Image, Link, Table, Frame, Sigma, Radical, Omega, Workflow |
| Editor controls               | PencilLine, Download, Plus, Maximize, RotateCcw, GripVertical, Settings2                                                                                                        |
| Components                    | Trash2, CircleX, Plane, Dumbbell, Lightbulb, Hash, Flag                                                                                                                         |

### Native: control positions in zui's own components

These are all static today:

- copy-button (Copy, Check)
- password-input (Eye, EyeOff)
- password-strength (Circle, CircleCheck)
- permission-card (Circle, CircleCheck, CircleX)
- avatar-picker (Check, Trash2)
- tag-input (X)
- editor-tab (X)
- emoji-picker's nine category toggles
- reasoning-collapsible (Brain, ChevronUp, ChevronDown)
- collapsible-card (ChevronUp, ChevronDown)
- model-list (Trash2)
- data-table (ChevronLeft, ChevronRight, Settings2)
- data-table-column-header (ChevronsUpDown, ArrowUp, ArrowDown, EyeOff)
- tree-item and file-tree (ChevronRight)

One of these, ChevronUp, is in neither set yet; it is authored on both platforms.

## Shape

### One set, two renderers

The set is one list of names: the 38 icons, the 34 new ones and ChevronUp, 73 in all. Each name is a
registry item on web (`<name>-icon`, `registry:ui`, as today) and on native (`<name>-icon`, the same
name in `packages/native-ui/registry.json`). The native parity spec (`web-twins.spec.ts`) grows a
check that every web `*-icon` item has a native twin, so a web icon added later fails the build until
its native twin lands.

Each icon's motion is designed once and drawn twice. The web icon keeps its lucide-animated shape
(Motion variants, a `span` wrapper, an `aria-hidden` drawing). The native icon draws the same lucide
paths with `react-native-svg` and plays the same motion with `react-native-reanimated`'s animated
props, the two libraries native already ships. My call: the same timing values on both platforms (the
web icon's spring or duration, translated), so an icon reads the same on both.

My call: parity covers all 73, the editor-only icons (Strikethrough, Sigma and the like) included,
although native has no editor yet. The native editor is the next project, and it needs them.

Each native icon copies its path data from `lucide-react-native` at the version the catalog pins
(1.72.0), as the web icons copy theirs. A file that read lucide's icon nodes at runtime could not ship
alone through the registry.

**Colour and size on native.** A native animated icon is lucide-shaped: it takes `LucideProps` (`size`,
`color`, `strokeWidth`, `style`) and is drawn through the existing `Icon` as its `as`, so the classes,
`TextClassContext` and `IconClassContext` colour and size it exactly as they do a static icon, dark
mode and a disabled button included. A swap is then `as={Copy}` to `as={CopyIcon}` plus a ref. The ref
reaches the icon through `Icon`'s props (React 19 passes `ref` as a prop). If Uniwind's `withUniwind` or
NativeWind's `cssInterop` drops it, `Icon` forwards it; `Icon` is our own port, and forwarding a ref
does not change what it draws. My call.

A new icon follows lucide-animated's own icon (lucide-animated.com, source github.com/pqoqubbw/icons)
where that set has one, adapted as the existing 38 were.
Where it has none, it is authored in that set's manner: one short motion of the glyph's own parts
(the pencil writes a stroke, the trash lid lifts, the download arrow drops), under 600 ms, ending where
it started. The builder may pick each motion; the spec fixes the manner, not each icon.

### The handle and the trigger

Both platforms' icons expose `startAnimation()` and `stopAnimation()` through a ref, as the web icons
do today.

- **Web:** the control starts the icon on pointer enter and on focus, and stops it on leave and blur
  (`animating-a-component`). A control that changes a state, such as Copy turning into Check, plays the
  new icon once as it appears.
- **Native:** there is no hover. My call: the control starts the icon on press-in and on focus (a
  hardware keyboard or a TV remote). A state icon plays once as it appears, as on web. Press-out does
  not cut the motion short; it finishes.

The control holds the icon's ref and starts it from handlers it passes to the primitive it renders,
as copy-button does on web today; the web primitives and native `Button` already forward those
handlers. My call: where a native port does not forward `onPressIn`, `onFocus` or `onBlur` to its
`Pressable`, the port gains the forwarding. That adds no icon to the primitive, so it stays inside the
non-goal.

A state icon "plays once as it appears" through the parent: when the state flips, the parent calls
`startAnimation()` in an effect. The icon's own reduced-motion check covers it, and an icon unmounted
mid-motion simply stops. My call.

The icon never starts itself from its own box on either platform: a native icon has no `onPressIn` of
its own, and a web icon given a ref drops its own hover handling, as today.

### Reduced motion

On web, the existing check stays: each icon reads Motion's `useReducedMotion` in its start.

On native, each icon reads `useReducedMotion` from `lib/motion` in its start and starts nothing when it
is true. That hook already follows the system setting live, with the first render holding the setting
as of app start.

### Accessibility

- **Web:** the icon renders phrasing content and is `aria-hidden` beside a labelled control, unchanged.
- **Native:** the icon's view carries `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"`, and the control keeps its `accessibilityLabel`.

## Order

Three pull requests, each green on its own:

1. **Web.** Author the 35 new icons (the 34, plus ChevronUp), swap the 17 positions onto twins, and wire
   every control in the inventory to start its icon. The web icon spec (`animated-icons.spec.tsx`)
   already walks every `*-icon.tsx`, so the new icons are covered as they land.
2. **Native set.** The 73 native icons, their registry items, a shared spec that walks every native
   icon (it starts, it stays still under reduced motion, it is hidden from accessibility), and the
   parity check from web to native icons.
3. **Native components.** Swap every native position in the inventory onto its animated icon, started
   by its control.

## Testing

- **Web:** the existing icon spec, plus a case per wired control that the control's pointer enter and
  focus start its icon, and its leave and blur stop it. The data-table column header already has such a
  case.
- **Native:** one spec walks all 73 icons:
  - it mounts and its handle starts and stops;
  - under reduced motion (`AccessibilityInfo.isReduceMotionEnabled` mocked true, as other native specs
    do) the start does nothing;
  - the drawing is hidden from accessibility.

  Each wired native control gets a case that press-in and focus start its icon.

- **Parity:** `web-twins.spec.ts` fails for a web `*-icon` with no native twin.

## Left to the builder

- Each new icon's motion, within the manner above.
- How the native set shares its timing and its reduced-motion start: a small helper in `lib/` is fine,
  but each icon stays one self-contained file the registry can ship alone.
- The order of icons inside each pull request.
