# zui: the full lucide-animated set, and an Icons page

## Intent

zui publishes 73 animated icons, on web and native, each started by the control that holds it
(`2026-11-16-animated-icons-design.md`). Those 73 are only the icons zui's own items draw. The owner
asked (2026-11-17) for zui to offer the whole set lucide-animated publishes (option 1 of three: that
set, all 2052 Lucide icons with a generated motion, or the 73 as they are), and for an Icons entry in
the docs header where a reader sees every icon move and takes the one they need.

## Goals

1. zui publishes an animated icon for every icon lucide-animated publishes, outside the exceptions
   below, on web and on native, under the same name on both.
2. Every icon belongs to a named set, and no set is the default. Lucide is the first set: each icon's
   registry item is `lucide-<glyph>-icon`, where `<glyph>` is the Lucide 1.72.0 name of the glyph it
   draws, and its export keeps Lucide's own name with `Icon` (`CopyIcon`), so a consumer swaps
   `as={Copy}` for `as={CopyIcon}` without looking up a second name.
3. The docs header has an Icons entry, on the web zone, the editor zone and the native zone. Its page
   shows every icon of the platform being read, moving when the reader points at, focuses or taps it,
   finds one by name, and gives the line that installs it.
4. The docs site's own chrome draws animated icons where it draws an icon in a control: the preview's
   "Open in a new tab" button (Maximize2) and the style picker's chevron and check.

## Non-goals

- Lucide glyphs lucide-animated has no icon for. A glyph with a generated motion moves like every
  other, which tells the reader nothing; the set grows as lucide-animated grows.
- Placing the new icons in any zui item. The placement rule of the earlier spec stands: an animated icon
  goes in a control, and zui's items already hold one wherever they draw an icon in a control. The new
  icons are for consumers.
- A docs page per icon.
- A second icon set (Tabler and the like). zui may offer others later, each laid out as Lucide is below.

## The inventory (lucide-animated `0f9920917a5d45d1d263299d56f9015c69c21b70`, 2026-11-15)

The port reads that commit, not `main`, so the inventory below holds while the set is built.
lucide-animated publishes 469 icons there. 46 are already zui icons, so 423 are new. Two groups of those
are not taken as they stand:

- **Brand marks, dropped.** chrome, discord, dribbble, facebook, figma, github, gitlab, instagram,
  linkedin, twitch, twitter, youtube. zui ships none of them today. Lucide 1.x ships no brand marks, so
  these have no glyph in the catalog's Lucide. A brand set, if zui offers one, is a set of its own,
  like the other icon sets zui may offer later.
- **Names Lucide 1.72.0 does not have, renamed.** airplane, align-horizontal, align-vertical,
  attach-file, cart, clap, connect, cursor-click, downvote, fingerprint, flask, key-circle, login,
  logout, upvote. Each takes the name of the Lucide 1.72.0 glyph it draws (login draws `log-in`, cart
  `shopping-cart`). One that draws a glyph zui already has is dropped, since zui's icon stays. One that
  draws no Lucide glyph is dropped. The builder settles each by comparing the drawing, and the plan
  lists the outcome.

The new set is then about 410 icons. The plan states the exact count.

## Shape

### The set's name

A shadcn registry's item names are one flat list, and the CLI finds an item by that name alone, so two
sets drawing `copy` need two names. The owner ruled (2026-11-17) that every set carries its name, Lucide
included, so zui favours none:

|        | Item (the CLI's id)     | Source in the repo                                              | Installed at                              |
| ------ | ----------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| web    | `@zui/lucide-copy-icon` | `packages/ui/registry/bases/base-ui/icons/lucide/copy-icon.tsx` | `components/general/lucide/copy-icon.tsx` |
| native | `@zui/lucide-copy-icon` | `packages/native-ui/src/registry/icons/lucide/copy-icon.tsx`    | `components/general/lucide/copy-icon.tsx` |

The 73 icons zui ships today move to this layout before any icon is added, with every zui item that
imports one, its registry dependencies, the docs pages' install lines and the parity check. 38 of them
are published on master under the old names (`@zui/copy-icon`). Those names stop resolving: an app
that vendored one keeps its copy, and adding it again takes the new name. There is no alias item under
the old name, since an alias is the unprefixed default this ruling removes. The pull request says so
for consumers. My call.

### The icons

Each new icon is made as the earlier spec makes one, unchanged:

- **Web:** adapted from lucide-animated's own file, with a `span` wrapper, an `aria-hidden` drawing, a
  `startAnimation`/`stopAnimation` handle and Motion's reduced-motion check in its start.
- **Native:** lucide-shaped, drawn through `Icon` as its `as`, moving through `lib/icon-motion`'s legs
  of at most 250 ms out and back, and still under reduced motion.

Both platforms draw the paths of Lucide 1.72.0, the version the catalog pins: web from `lucide-react`,
native from `lucide-react-native`. A web icon and its native twin then draw the same glyph. Where
lucide-animated's file draws an older path and its motion moves a part that path changed, the builder
moves the 1.72.0 part the same way.

The checks that hold the 73 hold the new icons, with no per-icon test:

- The web icon spec walks every icon under `icons/<set>/`.
- The native walker (`icons.spec.tsx`) checks every native icon: it starts, every part moves, it rests
  within 600 ms, it stays still under reduced motion, it is hidden from accessibility.
- The parity check (`web-twins.spec.ts`) fails for a web icon with no native twin.

A check that names the size of the set reads it from the registry, so adding an icon edits no spec.
The walkers grow from 73 icons to about 480. The plan measures their run time on the first icon pull
request, and if it would break CI's time budget the walkers are sharded; no icon drops out of a walk.

### The Icons page

One page per platform, beside Blocks: `/icons/:base` on the web tree and `/native/icons/:engine` on the
native tree. The web registry has one base, `base`, which is the only one the page is built for; a
second base gets its page when its icons exist. The editor zone has no page of its own: its header
entry is a plain link to the web page, as its Components and Blocks entries are. Each page:

- shows every icon of its platform, each under its name, and plays an icon when the reader points at
  it, focuses it or, on native, taps it;
- has a search box that narrows the icons by name as the reader types;
- gives, for the icon the reader picks, the install line
  (`pnpm dlx shadcn@latest add @zui/lucide-<glyph>-icon`) with a copy button, and a short usage snippet.

The page groups icons by set, with one set today; the set's name heads its grid.

The native icons are drawn by the preview app in a frame, as every native preview is, so the native
page's grid is a demo of the preview app. The search box and the install line stay on the page, shared
with the web page. The page posts the search to the frame, and the frame posts back the icon the reader
tapped, over the message channel the frame already uses to report its height. My call: one search and
one install panel for both platforms, rather than a second copy inside the preview app.

Both pages read the icon names from the registry at build, as the Blocks page reads its blocks, so a
new icon reaches the page with no list to edit. The icons have no docs pages, so they reach neither the
docs sidebar nor the docs search.

The header lists Icons after Blocks, and before Editor on the web zones. Switching platform on an
Icons page lands on the other platform's Icons page.

### The docs chrome

The preview's "Open in a new tab" button draws `lucide-maximize-2-icon`, and the style picker draws
`lucide-chevron-down-icon` and `lucide-check-icon`, each started by its control as the earlier spec starts any icon.
The earlier spec left this chrome out; the owner asked for it on 2026-11-17.

## Order

The pull requests stack on #129. Each is green on its own, and each icon pull request carries both
platforms' copies of its icons so the parity check holds at every step:

1. **The rename**: the 73 icons move to the `lucide` set, on both platforms, with every importer.
2. **Icons A-L** and **Icons M-Z**: the new icons, web and native, in two pull requests by name. 400
   icons on two platforms do not review as one diff.
3. **The Icons page and the chrome**: the two pages, the header entry on the three zones, the
   platform switch, and the chrome swap.

## Testing

- The icons: the three walking checks above, reading the set folders.
- The rename: the registry spec fails for an icon item outside `icons/<set>/` or whose name does not
  start with its set's name.
- The page, web: a component spec that searching narrows the grid, that pointer enter and focus on a
  tile start its icon, and that the install line copies. One end-to-end case per zone that the header's
  Icons entry opens the page.
- The page, native: the gallery demo's spec that a tile's press-in starts its icon.
- The chrome: the preview button's and the style picker's pointer enter and focus start their icons.

## Left to the builder

- Which Lucide glyph each renamed icon draws, and so whether it stays.
- Each icon's motion where the 1.72.0 path differs from the one lucide-animated animates.
- The page's layout.
- How the icons split between the two icon pull requests, as long as each holds both platforms.
