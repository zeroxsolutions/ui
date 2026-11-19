# The full lucide-animated set and an Icons page: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** zui publishes 479 animated Lucide icons as the `lucide` set on web and native, and the docs
header gains an Icons page per platform where every icon plays, can be found by name and installed.

**Architecture:** The 73 icons move into `icons/lucide/` and items named `lucide-<glyph>-icon` first,
with every importer. Then 406 icons ported from lucide-animated land in two halves, each half carrying
both platforms so the parity check stays green. Last, one shared gallery component (search, grid,
install panel) serves a web page and a native page whose grid is a preview-app demo talking to the page
over the frame's message channel; the docs chrome swaps onto three of the icons.

**Tech Stack:** React 19.3, Motion (`motion/react`), Vitest; React Native 0.88, Reanimated 4,
`react-native-svg` 15.16, `lucide-react` and `lucide-react-native` 1.72.0, Jest (jest-expo) with RNTL;
Next.js docs zones; nx; shadcn registry.

**Spec:** `docs/superpowers/specs/2026-11-17-animated-icon-set-design.md`, which builds on
`docs/superpowers/specs/2026-11-16-animated-icons-design.md`.

## Global Constraints

- PATH first in every shell: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH`. Homebrew pnpm wipes `node_modules`; recover with `CI=true pnpm install --frozen-lockfile`.
- Never stage `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts` or `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: `git commit -F <file>`, subject of at most 72 characters, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Every authored file is plain ASCII.
- Typecheck with `pnpm nx run <project>:typecheck`, never `tsc` on a hand-picked tsconfig.
- Item name `lucide-<glyph>-icon`; web source `packages/ui/registry/bases/base-ui/icons/lucide/<glyph>-icon.tsx`, target `components/general/lucide/<glyph>-icon.tsx`; native source `packages/native-ui/src/registry/icons/lucide/<glyph>-icon.tsx`, which `appPath` lands at `components/general/lucide/<glyph>-icon.tsx`.
- `<glyph>` is the canonical Lucide 1.72.0 name: the file in `lucide-react/dist/esm/icons/` that is not a re-export of another. The export is that name in PascalCase plus `Icon` (`face-angry` gives `FaceAngryIcon`), with a `<Name>IconHandle` type.
- Port from lucide-animated at commit `0f9920917a5d45d1d263299d56f9015c69c21b70` (`https://raw.githubusercontent.com/pqoqubbw/icons/0f9920917a5d45d1d263299d56f9015c69c21b70/icons/<la-name>.tsx`), keeping its MIT header line.
- Paths: web from `lucide-react` 1.72.0, native from `lucide-react-native` 1.72.0. Where lucide-animated animates a part 1.72.0 drew differently, move the 1.72.0 part the same way.
- Web icon shape: as `icons/lucide/copy-icon.tsx` after Task 1 (`span` wrapper, `forwardRef`, `aria-hidden` svg, `useReducedMotion` checked in the start). Native icon shape: as `icons/lucide/copy-icon.tsx` (lucide-shaped, `useIconMotion` legs of at most 250 ms out and back, transforms through `transformProps` as a `matrix`, hidden from accessibility).
- No spec names the size of the set as a literal; counts come from the folder or the registry.
- The old names (`@zui/copy-icon`) get no alias item.

## Review Focus

1. A consumer installing an item that depends on an icon (`@zui/copy-button`) must get `@zui/lucide-copy-icon` installed beside it at `components/general/lucide/`, and the import inside the installed item must resolve there. Task 1 adds a registry spec case reading `copy-button`'s registryDependencies and its file's import path; Task 2 the same for native.
2. An icon ported from lucide-animated whose 1.72.0 path differs (a part renamed, split or merged) must still move every part it moves upstream. The native walker asserts every part moves; Task 3 adds a web walker case that every animated element in the svg changes between rest and mid-motion.
3. Typing in the Icons page search with capitals or spaces (`Arrow Up`) must still find `arrow-up`. Task 7 adds the case.
4. On the native page, a search typed before the frame has loaded must still reach the grid once it loads. Task 8 adds the case: the frame asks for the current query when it mounts.
5. Under reduced motion the gallery's Play-on-hover must not move any icon on either page. Task 7 and Task 8 each add a reduced-motion case for one tile.

---

## Branches

Four pull requests, each green on its own, stacked on #129 (`feat/animated-icons-native-controls`):

- **PR A** `feat/icon-set-lucide` from `docs/animated-icon-set-spec` (carries the spec and this plan): Tasks 1-2.
- **PR B** `feat/icon-set-lucide-a-g`: Tasks 3-4.
- **PR C** `feat/icon-set-lucide-h-z`: Tasks 5-6.
- **PR D** `feat/icons-page`: Tasks 7-9.

Web commands run in `packages/ui` (`pnpm exec vitest run <spec>`); native in `packages/native-ui` (`pnpm exec jest <spec>`). Project runs: `pnpm nx run @zeroxsolutions/ui:test`, `pnpm nx run @zeroxsolutions/native-ui:test`; registry builds `build-registry` on each. Before each PR: build both registries, then `git status --short` lists nothing unexpected.

---

### Task 1: Web, the 73 icons become the lucide set

**Files:**

- Move: `packages/ui/registry/bases/base-ui/icons/<name>-icon.tsx` to `icons/lucide/<glyph>-icon.tsx`, 73 files. Three take their canonical glyph: `bold` to `letter-b` (`LetterBIcon`), `smile` to `face-slightly-smiling` (`FaceSlightlySmilingIcon`), `trash-2` to `trash` (`TrashIcon`). The other 70 keep their name.
- Move: `icons/animated-icons.spec.tsx` to `icons/lucide/animated-icons.spec.tsx`, walking that folder.
- Modify: `packages/ui/registry.json` (73 items renamed, every `registryDependencies` entry `@zui/<name>-icon`), the 62 importers under `packages/ui/registry` and `packages/ui/src`, `packages/ui/registry/registry.spec.ts` (`HOUSE_ICON`, the icons case, the fixtures), the docs pages whose install lines or `ComponentSource` blocks name an icon (`packages/ui-docs-web/content`, `packages/editor-docs-web/content`).

**Interfaces:**

- Produces: `@/registry/bases/base-ui/icons/lucide/<glyph>-icon` exporting `<Glyph>Icon` and `<Glyph>IconHandle`; item `lucide-<glyph>-icon`.

- [ ] **Step 1:** In `registry.spec.ts`, make `HOUSE_ICON` match `^registry/bases/base-ui/icons/([a-z0-9-]+)/([^/]+)\.tsx$`, and the icons case assert each file under `icons/<set>/` is item `<set>-<file>` with target `components/general/<set>/<file>.tsx`, its count read from the folder. Add a case that `copy-button`'s registryDependencies include `@zui/lucide-copy-icon` and its source imports `@/registry/bases/base-ui/icons/lucide/copy-icon`. Run `pnpm exec vitest run registry/registry.spec.ts`. Expected: FAIL.
- [ ] **Step 2:** `git mv` the files, rename the three exports, update registry.json and every importer.
- [ ] **Step 3:** Run `pnpm exec vitest run registry/registry.spec.ts registry/bases/base-ui/icons`. Expected: PASS.
- [ ] **Step 4:** `pnpm nx run @zeroxsolutions/ui:build-registry`, then `pnpm nx run-many -t test -p registry-ui registry-editor-docs-zone` so `source.spec` checks the docs pages; fix each page it names. Expected: PASS.
- [ ] **Step 5:** `pnpm nx run @zeroxsolutions/ui:typecheck` and lint, then commit `feat(ui)!: move the animated icons into the lucide set`.

### Task 2: Native, the 73 icons become the lucide set, then PR A

**Files:**

- Move: `packages/native-ui/src/registry/icons/<name>-icon.tsx` to `icons/lucide/<glyph>-icon.tsx`, with the same three renames; `icons.spec.tsx` and `animated-icon.testing.ts` walk `icons/lucide/`.
- Modify: `packages/native-ui/registry.json`, the 33 importers under `packages/native-ui/src`, `src/build/web-twins.spec.ts` (parity by `<set>/<file>` on both sides), the examples spec's `-icon` suffix exemption (now: a file under `registry/icons/`), the native docs pages under `packages/native-ui-docs-web/content` that name an icon.

- [ ] **Step 1:** Update `web-twins.spec.ts` and `sources.spec.ts` (`appPath` of `registry/icons/lucide/copy-icon.tsx` is `components/general/lucide/copy-icon.tsx`) and add the copy-button dependency case as in Task 1. Run them. Expected: FAIL.
- [ ] **Step 2:** Move, rename, update registry.json and importers.
- [ ] **Step 3:** Run `pnpm exec jest src/registry/icons src/build`. Expected: PASS.
- [ ] **Step 4:** Project test, typecheck, lint, `build-registry`, staleness check. Commit `feat(native-ui)!: move the animated icons into the lucide set`.
- [ ] **Step 5:** Push `feat/icon-set-lucide` and open PR A on base `feat/animated-icons-native-controls`. The body states for consumers: every icon item is now `@zui/lucide-<glyph>-icon` under `components/general/lucide/`; `bold`, `smile` and `trash-2` became `letter-b`, `face-slightly-smiling` and `trash`; a vendored copy keeps working, a re-add takes the new name.

### Task 3: Web, icons A-G (203)

**Files:**

- Create: `packages/ui/registry/bases/base-ui/icons/lucide/<glyph>-icon.tsx` for each name in Appendix A-G.
- Modify: `packages/ui/registry.json` (203 items), `icons/lucide/animated-icons.spec.tsx` (the Review Focus 2 case).

- [ ] **Step 1:** Add the walker case: for every icon, each svg element carrying a Motion variant has a different attribute or style at 120 ms after `startAnimation()` than at rest. Run it on the 73. Expected: PASS (it guards the new icons, not the old).
- [ ] **Step 2:** Add the 203 registry items. Run `pnpm exec vitest run registry/registry.spec.ts`. Expected: FAIL, files missing.
- [ ] **Step 3:** Port each icon from its lucide-animated file (the `from` name in the appendix where given), on 1.72.0 paths.
- [ ] **Step 4:** Run `pnpm exec vitest run registry/registry.spec.ts registry/bases/base-ui/icons`. Expected: PASS. Record the walker's run time in the commit body.
- [ ] **Step 5:** Typecheck, lint, commit `feat(ui): add the lucide-animated icons a-g`.

### Task 4: Native, icons A-G, then PR B

**Files:**

- Create: `packages/native-ui/src/registry/icons/lucide/<glyph>-icon.tsx` for each name in Appendix A-G.
- Modify: `packages/native-ui/registry.json` (203 items: `registry:ui`, dependencies `react-native-reanimated`, `react-native-svg`, registryDependencies `@zui/icon-motion`).

- [ ] **Step 1:** Port each icon from its web twin of Task 3, path data from `lucide-react-native` 1.72.0.
- [ ] **Step 2:** Run `pnpm exec jest src/registry/icons src/build/web-twins.spec.ts`. Expected: PASS. Note the walker's run time.
- [ ] **Step 3:** If the native or web walker would take more than 10 minutes on CI (local time times 4), shard it by set folder and letter into several spec files that each walk a slice; no icon leaves the walk. Otherwise leave it whole.
- [ ] **Step 4:** Project tests, typecheck, lint, both `build-registry`, staleness check. Commit `feat(native-ui): add the native twins of icons a-g`.
- [ ] **Step 5:** Push `feat/icon-set-lucide-a-g`, open PR B on base `feat/icon-set-lucide`.

### Task 5: Web, icons H-Z (203)

As Task 3 for Appendix H-Z, without Step 1. Commit `feat(ui): add the lucide-animated icons h-z`.

### Task 6: Native, icons H-Z, then PR C

As Task 4 for Appendix H-Z, reusing Task 4's sharding if it was made. Commit
`feat(native-ui): add the native twins of icons h-z`. Push `feat/icon-set-lucide-h-z`, open PR C on
base `feat/icon-set-lucide-a-g`.

### Task 7: The gallery and the web Icons page

**Files:**

- Create: `packages/ui/src/site/components/data-display/icon-gallery.tsx` and its spec; `packages/ui/src/site/lib/icon-sets.ts` (the icons read from a registry's items); `packages/ui-docs-web/src/pages/icons-page.tsx`; `apps/registry-ui/src/app/(app)/icons/[base]/page.tsx`; a route unit `iconsRoute` (`/icons/:base`) in `packages/ui-docs-web/src/routes/index.ts`.
- Modify: `apps/registry-ui/src/lib/platform-nav.ts` (Icons after Blocks; `nativeCounterpart` maps an Icons page to the native one), `apps/registry-editor-docs-zone/src/lib/editor-nav.ts` (Icons after Blocks, a plain link), the web e2e projects (`registry-ui-e2e`, `registry-editor-docs-zone-e2e`).

**Interfaces:**

- Produces: `iconSets(items: RegistryItem[]): IconSet[]` with `interface IconSet { set: string; icons: { name: string; glyph: string }[] }`, grouping items whose file sits under `icons/<set>/`; `IconGallery({ sets, renderGrid, onPick? })` holding the search box and the install panel, where `renderGrid({ query, onPick })` draws the grid; `installLine(item: string): string` returning `pnpm dlx shadcn@latest add @zui/<item>`.

- [ ] **Step 1:** Spec `icon-gallery.spec.tsx`: typing `Arrow Up` narrows to names containing `arrow-up`; picking a tile shows `pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon` and its copy button copies it; a usage snippet names `ArrowUpIcon` from `@/components/general/lucide/arrow-up-icon`. Spec for the web grid: pointer enter and focus on a tile call its icon's `startAnimation`, leave and blur `stopAnimation`; under reduced motion the icon's svg does not change. Run. Expected: FAIL.
- [ ] **Step 2:** Implement `iconSets`, `installLine`, `IconGallery` and the web grid (each tile a `button` holding the icon's ref, as the earlier spec's controls do), the page and route, the two nav entries and the counterpart.
- [ ] **Step 3:** Run the specs, `platform-nav` and `editor-nav` specs. Expected: PASS.
- [ ] **Step 4:** E2E: in each web zone, the header's Icons entry opens `/icons/base` and shows the `lucide` set. Run `pnpm nx run registry-ui-e2e:e2e` and the editor zone's. Expected: PASS.
- [ ] **Step 5:** Typecheck, lint, commit `feat(docs): add the Icons page and its header entry`.

### Task 8: The native Icons page

**Files:**

- Create: `packages/native-ui/src/examples/icon-gallery-demo.tsx` and its spec; `packages/native-ui/src/preview/icon-gallery-channel.ts` (message names and the two posts); `packages/native-ui-docs-web/src/pages/native-icons-page.tsx`; `apps/registry-native-ui-docs-zone/src/app/native/icons/[engine]/page.tsx`; a route unit `nativeIconsRoute` (`/native/icons/:engine`).
- Modify: `packages/native-ui/src/examples/index.ts`, `native-preview-frame.tsx` (posting into the frame), `apps/registry-native-ui-docs-zone/src/lib/native-nav.ts` (Icons after Blocks on both platforms; `webCounterpart` maps it back), `registry-native-ui-docs-zone-e2e`.

**Interfaces:**

- Consumes: `IconGallery`, `iconSets`, `installLine` from Task 7.
- Produces: messages `{ type: 'zui:icon-gallery:query', query: string }` (page to frame), `{ type: 'zui:icon-gallery:ready' }` and `{ type: 'zui:icon-gallery:pick', name: string }` (frame to page), each posted with the page's origin as target and checked on receipt.

- [ ] **Step 1:** Demo spec: press-in on a tile starts its icon; a `query` message narrows the grid; mounting posts `ready`; tapping posts `pick`; under reduced motion press-in moves nothing. Page spec: on `ready` the page posts the current query; on `pick` it shows that item's install line. Run. Expected: FAIL.
- [ ] **Step 2:** Implement the channel, the demo, the frame's post, the page, the route, nav entries and counterpart.
- [ ] **Step 3:** Run the specs. Expected: PASS. E2E: the native header's Icons entry opens `/native/icons/<engine>` and the frame shows the grid. Expected: PASS.
- [ ] **Step 4:** Typecheck, lint, commit `feat(docs): add the native Icons page`.

### Task 9: The docs chrome, then PR D

**Files:**

- Modify: `packages/ui/src/site/components/data-display/example-preview.tsx` (`lucide-react`'s `Maximize2Icon` to the set's, from `registry/bases/base-ui/icons/lucide/maximize-2-icon`) and `packages/ui/src/site/components/navigation/style-picker.tsx` (`ChevronDownIcon` and `CheckIcon` to the set's), with their specs.

- [ ] **Step 1:** Specs: pointer enter and focus on the preview's "Open in a new tab" link and on the style picker trigger start their icon; leave and blur stop it; a picker item's check plays when it becomes the selected one, not on first draw. Run. Expected: FAIL.
- [ ] **Step 2:** Swap the three icons, starting each from its control.
- [ ] **Step 3:** Run, then project tests for `@zeroxsolutions/ui`, `registry-ui`, `registry-editor-docs-zone`, `registry-native-ui-docs-zone`. Expected: PASS.
- [ ] **Step 4:** Commit `feat(docs): animate the preview and style picker icons`. Push `feat/icons-page`, open PR D on base `feat/icon-set-lucide-h-z`.

---

## Appendix: the 406 new icons

Each line is `<glyph>`, or `<glyph> (from <la-name>)` where the lucide-animated file has another name.
Dropped from lucide-animated: the 12 brand marks; `airplane` (draws `plane`, which zui has);
`attach-file`, `cart`, `connect`, `flask` (draw no Lucide 1.72.0 glyph).

### A-G (Tasks 3-4)

- a-arrow-down
- a-arrow-up
- accessibility
- activity
- air-vent
- airplay
- alarm-clock
- alarm-clock-check
- alarm-clock-minus
- alarm-clock-plus
- alarm-smoke
- align-horizontal-space-around (from align-horizontal)
- align-vertical-space-around (from align-vertical)
- ambulance
- archive
- arrow-big-down
- arrow-big-down-dash
- arrow-big-left
- arrow-big-left-dash
- arrow-big-right
- arrow-big-right-dash
- arrow-big-up
- arrow-big-up-dash
- arrow-down-0-1
- arrow-down-1-0
- arrow-down-a-z
- arrow-down-left
- arrow-down-right
- arrow-down-z-a
- arrow-up-left
- arrow-up-right
- at-sign
- atom
- audio-lines
- axe
- badge-exclamation-point (from badge-alert)
- badge-percent
- ban
- banana
- battery
- battery-charging
- battery-exclamation-point (from battery-warning)
- battery-full
- battery-low
- battery-medium
- battery-plus
- bell
- bell-electric
- biceps-flexed
- binary
- blocks
- bluetooth
- bluetooth-connected
- bluetooth-off
- bluetooth-searching
- bone
- book-text
- bookmark
- bookmark-check
- bookmark-minus
- bookmark-plus
- bookmark-x
- bot
- bot-message-square
- box
- boxes
- briefcase-business
- calendar-check
- calendar-check-2
- calendar-cog
- calendar-days
- car
- cast
- cctv
- chart-bar-decreasing
- chart-bar-increasing
- chart-column-decreasing
- chart-column-increasing
- chart-line
- chart-no-axes-column-decreasing
- chart-no-axes-column-increasing
- chart-pie
- chart-scatter
- chart-spline
- check-check
- chess-bishop
- chess-king
- chess-knight
- chess-pawn
- chevron-first
- chevrons-down-up
- chevrons-left-right
- chevrons-right-left
- cigarette
- cigarette-off
- circle-chevron-down
- circle-chevron-left
- circle-chevron-right
- circle-chevron-up
- circle-dashed
- circle-dollar-sign
- circle-gauge
- circle-question-mark (from circle-help)
- clapperboard (from clap)
- clipboard-check
- cloud-backup
- cloud-cog
- cloud-download
- cloud-lightning
- cloud-rain
- cloud-rain-wind
- cloud-snow
- cloud-sun
- cloud-sync
- cloud-upload
- cog
- compass
- concierge-bell
- construction
- contrast
- cooking-pot
- corner-down-right
- corner-left-down
- corner-left-up
- corner-right-down
- corner-right-up
- corner-up-left
- corner-up-right
- cpu
- credit-card
- cup-soda
- database-backup
- delete
- disc-3
- dollar-sign
- droplet
- drum
- earth
- euro
- ev-charger
- expand
- external-link
- face-angry (from angry)
- face-expressionless (from annoyed)
- face-grinning (from laugh)
- face-neutral (from meh)
- face-slightly-frowning (from frown)
- face-slightly-smiling-plus (from smile-plus)
- fan
- feather
- file-chart-line
- file-check
- file-check-corner (from file-check-2)
- file-cog
- file-pen-line
- file-stack
- fingerprint-pattern (from fingerprint)
- fish-symbol
- flame
- folder-archive
- folder-check
- folder-clock
- folder-code
- folder-cog
- folder-dot
- folder-down
- folder-git
- folder-git-2
- folder-heart
- folder-input
- folder-kanban
- folder-key
- folder-lock
- folder-minus
- folder-open
- folder-output
- folder-plus
- folder-root
- folder-sync
- folder-tree
- folder-up
- folder-x
- folders
- gallery-horizontal-end
- gallery-thumbnails
- gallery-vertical-end
- gauge
- gavel
- georgian-lari
- git-branch
- git-commit-horizontal
- git-commit-vertical
- git-compare
- git-compare-arrows
- git-fork
- git-graph
- git-merge
- git-pull-request
- git-pull-request-closed
- git-pull-request-create
- graduation-cap
- grip
- grip-horizontal

### H-Z (Tasks 5-6)

- hammer
- hand
- hand-coins
- hand-fist
- hand-grab
- hand-heart
- hand-helping
- hand-metal
- hard-drive-download
- hard-drive-upload
- hat-glasses
- heart
- heart-handshake
- heart-pulse
- hourglass
- house (from home)
- id-card
- indian-rupee
- japanese-yen
- key
- key-round (from key-circle)
- key-square
- keyboard
- languages
- laptop-minimal-check
- layers
- layout-grid
- layout-panel-top
- leafy-green
- link-2
- loader
- loader-pinwheel
- locate
- lock-keyhole
- lock-keyhole-open
- lock-open
- log-in (from login)
- log-out (from logout)
- mail-check
- mailbox
- map-pin
- map-pin-check
- map-pin-check-inside
- map-pin-house
- map-pin-minus
- map-pin-minus-inside
- map-pin-off
- map-pin-plus
- map-pin-plus-inside
- map-pin-x-inside
- maximize-2
- message-circle
- message-circle-check
- message-circle-dashed
- message-circle-more
- message-circle-plus
- message-circle-x
- message-square-check
- message-square-dashed
- message-square-more
- message-square-plus
- message-square-x
- mic
- mic-off
- minimize
- monitor-check
- monitor-cog
- moon
- mouse-pointer-click (from cursor-click)
- nfc
- panel-left-open
- panel-right-open
- party-popper
- pause
- pen-tool
- philippine-peso
- phone
- phone-call
- phone-forwarded
- phone-incoming
- phone-missed
- phone-off
- pickaxe
- plane-landing
- plane-takeoff
- play
- plug-zap
- pound-sterling
- projector
- rabbit
- radio
- radio-tower
- receipt
- receipt-cent
- receipt-euro
- receipt-indian-rupee
- receipt-japanese-yen
- receipt-pound-sterling
- receipt-russian-ruble
- receipt-swiss-franc
- receipt-text
- receipt-turkish-lira
- redo
- redo-dot
- refresh-ccw
- refresh-ccw-dot
- refresh-cw
- refresh-cw-off
- rocket
- rocking-chair
- roller-coaster
- rotate-ccw-clock (from history)
- route
- router
- russian-ruble
- satellite-dish
- saudi-riyal
- scan-face
- scan-text
- send
- server
- server-cog
- server-crash
- settings
- shield-check
- ship
- ship-wheel
- shower-head
- shredder
- shrink
- smartphone-charging
- smartphone-nfc
- snowflake
- soup
- spray-can
- square-activity
- square-arrow-down
- square-arrow-left
- square-arrow-right
- square-arrow-up
- square-chevron-down
- square-chevron-left
- square-chevron-right
- square-chevron-up
- square-pen
- square-stack
- stamp
- stethoscope
- sun
- sun-dim
- sun-medium
- sunset
- swiss-franc
- switch-camera
- syringe
- telescope
- terminal
- text-align-center (from align-center)
- text-align-end (from align-right)
- text-align-start (from align-left)
- thermometer
- thumbs-down (from downvote)
- thumbs-up (from upvote)
- ticket
- timer
- tornado
- train-track
- tree-deciduous
- tree-pine
- trending-down
- trending-up
- trending-up-down
- truck
- turkish-lira
- undo
- undo-dot
- user
- user-check
- user-plus
- user-round-check
- user-round-cog
- user-round-plus
- users
- users-round
- vibrate
- volume
- wallet
- washing-machine
- waves-arrow-down
- waves-arrow-up
- waves-horizontal (from waves)
- waves-ladder
- waypoints
- webhook
- wifi
- wifi-cog
- wifi-low
- wifi-pen
- wifi-sync
- wind
- wind-arrow-down
- zap
- zap-off
