import type { CSSProperties, FC } from 'react';

import type { IconType } from './types';

export interface IconAvatarProps {
  /** Optional override of the mark this avatar wraps (defaults to the mark's base/mono). */
  size?: number;
  /** Background fill — a color or CSS gradient. Defaults to the brand's primary color. */
  background?: string;
  /** Foreground (icon) color. The wrapped icon paints via `currentColor`. */
  color?: string;
  /** Icon size as a fraction of `size`. */
  iconMultiple?: number;
  /** `circle` (default) or `square` (rounded). */
  shape?: 'circle' | 'square';
  style?: CSSProperties;
  className?: string;
  'aria-label'?: string;
}

/**
 * Generic avatar shell: a brand mark centered on a filled background. Adapted
 * from `@lobehub/icons`' `IconAvatar` (MIT) as a dependency-free composition —
 * a raw layout element (sanctioned per `ui-primitive-fidelity`) wrapping the
 * brand's `currentColor` icon. Internal to `brands/`; each mark's `.Avatar`
 * binds its own `Icon` + brand color.
 */
export const makeAvatar =
  (Icon: IconType, defaults: { background: string; color?: string; iconMultiple?: number }): FC<IconAvatarProps> =>
  ({
    size = 24,
    background = defaults.background,
    color = defaults.color ?? '#fff',
    iconMultiple = defaults.iconMultiple ?? 0.6,
    shape = 'circle',
    style,
    ...rest
  }) => (
    <span
      style={{
        alignItems: 'center',
        background,
        borderRadius: shape === 'circle' ? '50%' : Math.round(size * 0.25),
        color,
        display: 'inline-flex',
        flex: 'none',
        height: size,
        justifyContent: 'center',
        width: size,
        ...style,
      }}
      {...rest}
    >
      <Icon size={Math.round(size * iconMultiple)} />
    </span>
  );
