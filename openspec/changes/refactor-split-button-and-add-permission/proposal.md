## Why

Two problems, one thread.

**1. `SplitButton` is not designed right - it fails twice.** The component's own docblock
quotes NN/G's split-button definition ("one-click access to the common choice while
consolidating related variants behind the arrow"), but the implementation delivers neither
the look nor the shape:

- **Visually it is not a split button.** It renders two separate `size="icon"` (9×9) buttons
  in a bare `flex items-center` - no shared border, no seam, no outer-only radius. The eye
  reads two adjacent icon buttons, not one divided control. The substrate to do it right
  already ships: `ButtonGroup` + `ButtonGroupSeparator` collapse adjacent buttons into one
  seamed unit, and the base `Button` cva already carries `in-data-[slot=button-group]:rounded-md`
  hooks for exactly this. The current code ignores it.
- **Structurally it is a prop-bag.** It takes its slots as props (`options`, `value`,
  `onPrimary`, `onValueChange`, `dropdownLabel`, `extraItems`, `filter`, `align`) - the exact
  anti-pattern `ui-compound-authoring` forbids: a consumer that must inject a control the
  author never foresaw cannot, so it hand-rolls a look-alike.
- **It conflates two components.** Today `onPrimary` runs the *current* option's action and the
  menu *switches which option is current* (`onValueChange`). That is a *remembered-default menu
  button* (a segmented toggle), not a split button (a fixed primary action plus related
  variants behind the caret).

**2. There is no way to render an AI permission request in chat.** When a chatbot needs the
user's consent before acting (run a command, edit a file, call a tool), the UI has to live
*inline in the message stream* - scannable in scrollback, legible after it resolves. The two
closest existing pieces do not fit: `Tool` models call status (`input-streaming -> available ->
output/error`) but has **no approval affordance**, and `ConfirmButton` gates behind a **modal**
`AlertDialog` that interrupts the chat flow and vanishes.

The thread that joins them: a permission request's core control is **"Approve, with scopes"** -
a safe default (`Allow once`) plus riskier graduated variants behind a caret (`Allow this
session`, `Always allow`). That is the canonical split-button use case. Fixing the button is
what lets the permission card be built from the design system instead of a hand-rolled
look-alike, so the two ship together.

## What Changes

- **Refactor `SplitButton` into a real, compound split button** authored per
  `ui-compound-authoring`: a Root composing `ButtonGroup` (which owns the seam, outer-only
  radius, and border collapse) with named sub-parts - `SplitButtonAction` (the primary
  `Button`), `SplitButtonMenu` (wrapping the Base UI `DropdownMenu` that owns the open state),
  `SplitButtonTrigger` (the caret `Button`), `SplitButtonContent`, `SplitButtonItem`. Each part
  carries `data-slot="split-button-*"`; polymorphism is Base UI `render`, never Radix `asChild`.
  It supports a **labelled** primary, not icon-only.
- **Adopt classic split-button semantics** (fixed primary action + related variant items),
  dropping the remembered-default `value` / `onValueChange` toggle semantic from `SplitButton`.
- **Add a separate `MenuButton`** for the remembered-default semantic (the primary repeats the
  currently-selected action; the caret menu *changes which action is current* via a radio group,
  it does not fire it - the GitHub-merge / VS Code Run pattern). The two are distinct components
  (maintainer decision): `SplitButton` = fixed default + fire-on-select; `MenuButton` = armed
  default + confirm-on-primary. A surface picks whichever fits.
- **`SplitButton` is a structural compound** - it delegates all visual styling to the
  `ButtonGroup` and `Button` primitives it composes and adds **no bespoke `cva`** of its own;
  the consumer sets a matched `variant`/`size` on the parts (or a shared default), and
  `ButtonGroup` joins them.
- **Add a new `Permission` compound component** to the composed layer - an inline, non-modal
  in-chat card: `Permission` (Root, host-driven `status` prop + `data-status`/`data-tone`),
  `PermissionHeader` (icon - title - status `Badge`), `PermissionDescription`,
  `PermissionPreview` (a `Collapsible` wrapping a read-only `CodeBlock`), `PermissionActions`
  (the decision row, shown only while `pending`), and `PermissionResolved` (the persisted
  outcome). It composes existing design-system primitives; it hand-rolls no look-alike.
- **The decision row is deliberately asymmetric.** `Deny` is a plain, low-emphasis `Button`
  (the safe, reversible default kept frictionless); the graduated scopes live entirely on the
  `Allow` side as a `SplitButton`. `Permission` composes the `Allow` control through children,
  so a single-scope request uses a plain `Button` and a multi-scope request uses `SplitButton`
  - `Permission` takes no hard dependency on it.
- A `tone` axis (`default` | `danger`) on `Permission` inverts emphasis for a genuinely
  dangerous request (deny-first) without changing the structure.

## Success Criteria

- `SplitButton` renders as **one divided control**: a shared rounded outline with a visible
  seam, outer corners rounded and inner corners squared, built by composing `ButtonGroup` - not
  two loose buttons in a `flex`.
- `SplitButton` is a **compound** (Root + named `data-slot` parts), not a prop-bag; the caret's
  open state rides the Base UI `DropdownMenu`; a consumer can compose an arbitrary control into
  the group. It carries no bespoke `cva` and lives in the composed layer, never `components/ui/*`.
- `Permission` renders **inline in the message stream** (no `AlertDialog`/modal), resolves to a
  persisted `approved` / `denied` state that stays in scrollback and is non-interactive, and
  composes design-system primitives only (no look-alike popover/menu/badge).
- The `Allow` control is a `SplitButton` when multiple grant scopes exist; `Deny` is a plain,
  non-destructive `Button`; the row reads as one safe default plus one considered action.
- `nx run-many -t lint build test` is green and Storybook builds; stories cover `SplitButton`
  (labelled + icon primary, single vs multi item) and `Permission` (pending / approved / denied,
  single vs multi scope, default vs danger tone).

## Non-Goals

- **No third split variant** - beyond `SplitButton` (classic) and `MenuButton` (remembered
  default), no further variant (e.g. a toggle-split) is in scope.
- **No block-list / "always deny" management UI** - permanent deny policy belongs to a
  Settings/Permissions surface, not the in-message hot row; it is out of scope.
- **No host/runtime wiring** - `Permission` is presentational (like `Tool`): the host owns the
  `status`, supplies the preview and scope handlers, and maps its own consent lifecycle onto it.
  No dispatcher, store, or transport is added.
- **No change to `Tool`, `ConfirmButton`, `Button`, or `ButtonGroup`** beyond composing them;
  the vendored `components/ui/*` layer is not edited.
- **No worktree/branch** - work proceeds on `master` per the maintainer's explicit instruction
  (a deliberate, recorded deviation from `worktree-per-task`).

## Capabilities

### New Capabilities

- `ui-split-button`: `@zeroxsolutions/ui` ships a compound split button - a single divided
  control built on `ButtonGroup` with a fixed primary action and related variants behind a
  caret whose open state rides the Base UI menu - authored as `data-slot` parts, not a prop-bag,
  with no bespoke `cva`.
- `ui-permission`: `@zeroxsolutions/ui` ships a `Permission` compound - an inline, non-modal
  in-chat AI-consent card with a host-driven status, an asymmetric decision row (plain `Deny` +
  a graduated-scope `Allow`), and a persisted resolved state - composing design-system
  primitives only.
- `ui-menu-button`: `@zeroxsolutions/ui` ships a `MenuButton` compound - a "remembered default"
  split control on `ButtonGroup` whose caret menu is a radio group that changes the current
  action (armed, not fired) and whose primary repeats/fires the current one - distinct from
  `SplitButton`.

## Impact

- **Package** - `@zeroxsolutions/ui`: `split-button.tsx` is rewritten in place (public API
  changes); `permission.tsx` (+ spec) is added to `packages/ui/src/components/`, beside where
  `tool.tsx` lands after the in-flight `relocate-code-editor-and-flatten-ai-elements` flatten.
- **Public surface** - the package uses a per-file `./*` subpath map, so rewriting
  `SplitButton`'s exported API is a **breaking** change (major bump via `nx release`), and
  `./components/permission` is an additive new subpath.
- **Consumers today** - `SplitButton`'s only real consumers are its own story
  (`apps/storybook/src/split-button.stories.tsx`) and spec; no production surface imports it, so
  the internal migration off the remembered-default semantic is trivial. `Permission` is net-new.
- **Rules realised** - closes the `ui-compound-authoring` gap `SplitButton` currently violates,
  and gives the in-chat consent surface a design-system home instead of a future hand-rolled
  look-alike (`ui-from-design-system`, `ui-primitive-fidelity`).
