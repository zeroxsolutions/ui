import type { ComponentPropsWithoutRef, FC } from 'react';

/**
 * Shared props for every brand-mark icon-form variant (base, `.Color`, `.Mono`).
 * `size` maps to the svg width/height (default `1em`); all other svg props pass
 * through. Internal to `brands/` — not part of the documented public surface.
 */
export type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** A brand-mark icon-form variant component. */
export type IconType = FC<IconProps>;
