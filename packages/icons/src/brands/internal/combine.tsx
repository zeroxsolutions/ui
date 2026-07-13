import type { CSSProperties, FC, ReactNode } from 'react';

import type { IconType } from './types';

export interface IconCombineProps {
  size?: number;
  /** Wordmark text (defaults to the brand name). */
  text?: ReactNode;
  /** Wordmark color. Defaults to `currentColor` (theme-friendly). */
  textColor?: string;
  /** Gap between icon and text, as a fraction of `size`. */
  spaceMultiple?: number;
  /** Text font-size as a fraction of `size`. */
  textMultiple?: number;
  style?: CSSProperties;
  className?: string;
  'aria-label'?: string;
}

/**
 * Generic combine shell: a brand mark paired with its wordmark. Adapted from
 * `@lobehub/icons`' `IconCombine` (MIT) as a dependency-free composition — raw
 * layout elements (sanctioned per `ui-primitive-fidelity`) around the brand's
 * icon and name. Internal to `brands/`; each mark's `.Combine` binds its own
 * `Icon` + brand name.
 */
export const makeCombine =
  (Icon: IconType, name: string, defaults?: { spaceMultiple?: number; textMultiple?: number }): FC<IconCombineProps> =>
  ({
    size = 24,
    text = name,
    textColor = 'currentColor',
    spaceMultiple = defaults?.spaceMultiple ?? 0.2,
    textMultiple = defaults?.textMultiple ?? 0.75,
    style,
    ...rest
  }) => (
    <span
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        gap: Math.round(size * spaceMultiple),
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      <Icon size={size} />
      <span style={{ color: textColor, fontSize: Math.round(size * textMultiple), fontWeight: 600 }}>
        {text}
      </span>
    </span>
  );
