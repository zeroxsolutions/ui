# @zeroxsolutions/ui

The web registry: the items' source under `registry/bases/base-ui`, and `registry.json`, which names
what each item ships. `@zeroxsolutions/registry-ui` serves the built registry and draws the items in
its docs.

- An item writes a class that differs between styles as a `cn-<slot>` token: upstream's slot where the
  part looks like upstream's, else one of zui's own, defined in each of `registry/styles/style-<style>.css`.
  `src/build/zui-slots.spec.ts` keeps the eight sheets and the items in step.
- `pnpm nx build-registry @zeroxsolutions/ui` writes each `base-<style>` JSON to `dist/r/styles`, every
  token replaced by that style's classes from `@zeroxsolutions/shadcn-upstream`'s sheet and zui's.
- `registry/bases/base-ui/ui/` holds the docs' primitives, upstream's base items as the CLI installs them,
  slots kept; `pnpm nx sync-primitives @zeroxsolutions/ui` rewrites them from the snapshot. The docs load
  every style's sheets, and a web page carries the picker's `style-<style>` class on `<html>`.
- `pnpm nx examples-index @zeroxsolutions/ui` writes the docs' demo index under `registry/bases/base-ui/examples`.
- `pnpm nx test @zeroxsolutions/ui` runs the items' specs; a `*.browser.spec.tsx` runs in Chromium.
- `pnpm nx test-visual @zeroxsolutions/ui` runs the visual suite, below, and `test-visual-linux` runs it as CI does.

## How things look is checked by screenshots

A spec asserts what a reader can see and do at a width: a control shown or hidden, a link present. It never
measures a radius, a padding, a colour, a size or where a part sits. Those go to the visual suite, a
`*.visual.spec.tsx` that `vitest.visual.config.mts` runs apart from the specs, so each suite fails for its own
reasons.

The suite captures every demo in `examples/` but the two its spec names as moving under reduced motion,
every primitive in `ui/` (its gallery fails when a primitive is added without a capture), the editors'
toolbars and menus as a reader opens them, and the docs' header and switches. Each is captured in the eight styles and both themes, one Chromium instance per pair, at 1280 and,
where its layout changes with width, at 375. A subject is added in its spec's list, and `test/visual.tsx`
expands it across the matrix.

Each capture is compared with its reference under `visual-baselines/`, pixel for pixel with no colour
tolerance, so a light theme's muted fill or hairline border, which sits close to the white page, cannot change
unseen, and with the pixels pixelmatch reads as anti-aliasing counted, since a radius change moves only those.
The committed references are `-linux` captures taken in the Playwright image CI's `visual` job runs in, pinned
by digest, so its Chromium and fonts change only when that digest does. A run on macOS writes and compares its
own `-darwin` references, which git ignores: locally `test-visual` says what changed since your own last run,
and `test-visual-linux` says what CI will.

`pnpm nx test-visual-linux @zeroxsolutions/ui` runs the suite in that image under Docker, on x86-64 like CI,
and brings back what it writes. Its arguments go to Vitest, such as a spec's name or `--shard=1/4`. To change
references on purpose:

1. Run `pnpm nx test-visual-linux @zeroxsolutions/ui`. Each capture that changed fails, and its
   `-reference-`, `-actual-` and `-diff-` images land in `test-output/visual/ui/`; a new subject's references
   are written beside the others, and its cases fail once so the new images are looked at.
2. Review every `-diff-` image, and every new reference, as the change's evidence.
3. Run `pnpm nx test-visual-linux @zeroxsolutions/ui -c update`, which rewrites the references, and commit
   them. A subject renamed or removed leaves its references behind; delete them in the same change.

Without Docker, push instead: CI uploads the same images as the `visual-diffs-<shard>` artefacts, and
`pnpm nx adopt-visual @zeroxsolutions/ui -- <the unpacked artefacts>` copies its captures over the references,
after `gh run download <run id> -p 'visual-diffs-*' -D /tmp/visual-diffs`.

A capture is still because the run is a reader who asked for reduced motion and the items answer that
preference; it waits for the page's fonts and images; a request to another host is answered from
`test/visual-stand-in.svg`, Geist, or a 404; the clock, locale, time zone and device scale are fixed; and
the whole page is drawn afresh before each capture, since what Chromium kept from an earlier pass could differ.
