# Native ToggleGroup: the same roles on the web as on a phone

## The defect

On a phone, `@rn-primitives/toggle-group` 1.5.2 announces a single-select group as a `radiogroup` of `radio` items,
each with `aria-checked`, and a multi-select group's items as `checkbox`es. Its web file wraps Radix's
ToggleGroup, whose single-select root is a `radiogroup` and whose items are `radio`s with `aria-checked`, but it
sets `role='button'` on each item, which overrides Radix's. So in a browser a screen reader hears plain buttons
inside a radio group. It cannot tell which choice is selected, nor that only one can be.

Nothing records a reason for the web `role='button'`; the pull request that gave the native file its roles left
the web file untouched. Radix chose radio semantics so that a screen reader learns only one item can be selected
and hears "1 of 3" (radix-ui/primitives #951, #3189). Base UI, which zui's web items use, gives toggles
`aria-pressed` instead, on the ground that a pressed toggle can be pressed again to clear it, which a radio cannot
(mui/base-ui #3525).

## The change

The native registry's `ToggleGroupItem` gives every item the role rn-primitives gives it on a phone, `radio` in a
single-select group and `checkbox` in a multi-select one, with `aria-checked` following the pressed state, on
every platform. A caller's own `role` or `aria-checked` still wins. On a phone nothing changes. The group's root
keeps the role Radix and rn-primitives give it.

This follows rn-primitives, not Base UI: the native items read the same on every platform, and
language-toggle-group and emoji-appearance-toggle-group, which refuse to clear their selection, are radio groups
by Base UI's own test.

## Tests

The defect shows only in a browser, since jest runs the phone's file. A case in the native zone's e2e opens the
toggle-group demo and finds its items as radios, the selected one checked, and is seen red before the change. The
emoji-appearance-toggle-group case that already finds its group as a `radiogroup` keeps passing.

## Not in this change

A fix in rn-primitives itself; zui's web toggle groups, which keep Base UI's toggle-button semantics.
