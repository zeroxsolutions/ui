import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Adapt a lucide icon to the `@lobehub/icons` mark API (`size` as a 1em-style
 * string) so it can sit in a provider→mark registry beside the real brand marks.
 * Used where a vendor ships no wordmark and a neutral lucide glyph stands in.
 * Shared so a registry's placeholder and the standalone marks use one adapter
 * instead of repeating the size shim.
 */
export function lucideMark(
  Icon: LucideIcon,
  strokeWidth = 1.75,
): ComponentType<{ size?: string | number }> {
  return ({ size = '1em' }) => (
    <Icon
      size={typeof size === 'number' ? size : undefined}
      style={typeof size === 'string' ? { width: size, height: size } : undefined}
      strokeWidth={strokeWidth}
    />
  );
}
