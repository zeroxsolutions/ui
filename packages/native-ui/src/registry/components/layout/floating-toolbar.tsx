import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * The floating tool palette of an editor canvas: a rounded card-colour bar with a hairline border and a shadow,
 * around the tools the caller composes. It is announced as a toolbar, so give it an `aria-label`. Placement,
 * such as `absolute bottom-3 self-center z-20`, is the caller's `className`.
 */
function FloatingToolbar({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      role="toolbar"
      className={cn('cn-floating-toolbar bg-card/95 flex-row items-center gap-0.5 border px-1.5 py-1', className)}
      {...props}
    />
  );
}

export { FloatingToolbar };
