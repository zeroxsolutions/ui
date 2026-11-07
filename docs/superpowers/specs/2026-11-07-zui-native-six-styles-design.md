# zui native: the six styles after Vega and Nova

The native registries are built in Vega and Nova. Upstream's other six styles (maia, lyra, mira, luma,
sera, rhea) exist at the native pin `ba1503c64472b82256d9de95e2e62c5901a38e8b`, and the web already
answers all eight. This change builds the native registries in all eight, through the same pipeline,
so `/r/styles/<engine>-<style>/` answers for 2 engines x 8 styles.

## What is already true

- Each of the six has its `style-<name>.css` at the pin, the same slot sheet Vega and Nova come from.
- Built with the six added, the Vega and Nova registries and sources are byte for byte what they are
  today, and `global.css` is the same file in all eight styles, so the preview's one bundle still
  holds every style.
- Maia, lyra and mira translate with no new rule. Luma, sera and rhea stop on nine classes in eight
  slots, below.

## The classes luma, sera and rhea need

| Class                                                                                  | Slots (styles)                                    | Native rendering                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not-dark:bg-clip-padding`                                                             | `cn-slider-thumb`, `cn-switch-thumb` (luma, rhea) | dropped, as an unmodified `bg-clip-padding` already is: a View has no background clip                                                                                                                                               |
| `border-transparent!`                                                                  | `cn-tabs-trigger` (luma, rhea)                    | the important is removed, as for the slots that already merge after the class it beats                                                                                                                                              |
| `rounded-2xl!`, `rounded-none!`                                                        | `cn-toast` (rhea, sera)                           | the same                                                                                                                                                                                                                            |
| `data-[swipe-direction=down]:data-nested-drawer-open:shadow-(--drawer-stacked-shadow)` | `cn-drawer-popup` (luma, rhea)                    | dropped: the native drawer opens no drawer inside another                                                                                                                                                                           |
| `aria-disabled:pointer-events-none`                                                    | `cn-combobox-chip-remove` (rhea)                  | dropped: a disabled pressable already takes no press                                                                                                                                                                                |
| `data-checked:translate-x-[calc(100%-8px)]`, `-4px`, `+2px`                            | `cn-switch-thumb` (luma, rhea, sera)              | resolved to px per size, as Vega's `calc(100%-2px)` is: the thumb's width differs by switch size in these styles, so the translate is written in each `checked+size=<size>` state, and a `+` length is added rather than subtracted |

A class none of these rules reaches still stops the build with `Untranslated <class> in <slot>`.

## Everything that lists the native styles

- `PLATFORM_STYLES.native` lists the eight, in the web's order, with Vega still the native default.
- `upstream-refresh` snapshots the six sheets with Vega's and Nova's.
- The two preview apps draw the eight: `PREVIEW_STYLES`, and one `eas update --channel <style>` per style
  for each of the two Expo projects, so each deploy publishes 16 updates instead of 4. `--channel`
  creates a missing channel and a branch of its name and links them (eas-cli 25.3.0,
  `getBranchFromChannelNameAndCreateAndLinkIfNotExistsAsync`); `--branch` creates only the branch, which
  no channel would serve. The existing `vega` and `nova` channels keep the branch each serves.
- The e2e lists of native registries cover the sixteen.
- A spec that loops over `['vega', 'nova']` to compare the two styles' output stays on those two; one
  that asserts every style is built covers the eight.

Not in this change: per-style restyling of the web items, the native ports of zui's own composed
items, and Figma libraries for the six.
