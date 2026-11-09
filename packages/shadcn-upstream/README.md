# @zeroxsolutions/shadcn-upstream

What both registries read from shadcn-ui/ui, pinned at one commit, so the web and native registries draw
a style from the same sheet.

- `snapshot/style-<style>.css`, `globals.css` and `colors-neutral.json`: upstream's style sheets and
  colours.
- `snapshot/bases/base/ui/<name>.tsx`: upstream's base items, which the web docs' primitives are generated
  from, and `snapshot/base-item-slots.json`, the `cn-` tokens each writes.
- `snapshot/registry-ui-items.json` and `registry-hook-items.json`: the `registry:ui` and `registry:hook`
  names upstream's base-vega registry lists on the day of the refresh.
- `nx run @zeroxsolutions/shadcn-upstream:upstream-refresh [commit]` rewrites all of them from a
  shadcn-ui/ui commit, the head of `main` when none is given.
