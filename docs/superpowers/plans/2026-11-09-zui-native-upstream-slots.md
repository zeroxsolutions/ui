# zui native: the slots upstream's base items write - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-09-zui-native-upstream-slots-design.md`

**Goal:** the native items write the `cn-<slot>` tokens upstream's base items write, and a spec keeps it so.

## Global constraints

- Pin stays `ba1503c64472b82256d9de95e2e62c5901a38e8b`; the slot snapshot is read at the same commit.
- Single-project nx targets only (`build-registry`, `test`, `typecheck`, `lint` on `@zeroxsolutions/native-ui`).
- An item's registry output may change only in the items the spec's table names; trace, sidebar and
  navigation-menu outputs do not change.

## Review focus

- A native-select or calendar dropdown that lost its accessibility role or label when its trigger stopped
  being a `SelectTrigger`.
- A disabled native-select still taking presses.
- A combobox item whose label runs under the absolute check mark.
- A context-menu sub-menu on a device, where it opens in place, drawn as a floating popup with a shadow.

## Task 1: the slot snapshot and the spec

- `tools/upstream-refresh.mts` writes `styles/upstream/base-item-slots.json`: for each
  `apps/v4/registry/bases/base/ui/<name>.tsx` at the commit (listed through the GitHub tree API), the sorted
  `cn-` tokens the file writes, keyed by `<name>`.
- Write the snapshot at the pin.
- `src/build/upstream-slots.spec.ts` with `NOT_DRAWN_ON_NATIVE: ReadonlyMap<string, string>` (slot to reason)
  and the spec's three checks; tokens no style sheet defines are ignored.
- Run it on today's items: it fails naming the slots of tasks 2-4. Commit.

## Task 2: native-select and calendar dropdowns

- `native-select`: trigger drawn from the select primitive's trigger with `cn-native-select`, `data-size`
  `sm` read as a state, chevron with `cn-native-select-icon`; wrapper dims while disabled.
- `calendar`: each dropdown's trigger is a box with `cn-calendar-dropdown-root`, holding
  `cn-calendar-caption-label` text and a 14px muted chevron; translate `has-focus:` as `focused` for
  `cn-calendar-dropdown-root`.
- Specs: field and chevron classes per size, disabled, the dropdown box, role and label kept. Commit.

## Task 3: combobox, context-menu, code-block, separator, progress

- Combobox item: check inside a view with `cn-combobox-item-indicator`, no `pr-2` override.
- Context-menu sub content: `cn-context-menu-content cn-context-menu-subcontent`.
- Code-block copy button: `cn-code-block-copy-button`.
- Separator: base's classes (`shrink-0 bg-border`, horizontal `h-px w-full`, vertical `w-px self-stretch`).
- Progress with no children: `cn-progress-track`.
- Specs updated. Commit.

## Task 4: trace, sidebar, navigation-menu

- Ruling: the three slots are listed as motion-only rather than written. The sidebar's gap and the trace's
  content are an `Animated.View`, whose className not every engine reads, and the native positioner draws
  no view. The spec fails if a style puts anything but motion in them.
- Also found by the spec in the other styles: `cn-accordion`, `cn-calendar-caption`,
  `cn-input-group-button-size-sm`, folded into task 3.

## Task 5: verify and open the PR

- `build-registry`, `test`, `typecheck`, `lint` on native-ui; compare `dist/r` with the master build.
- Push, open the PR.
