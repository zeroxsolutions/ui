import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * The unsaved-changes dot an editor shows on a tab. It is announced as an image named "Unsaved changes";
 * pass `aria-label` to name it in another language.
 */
function UnsavedIndicator({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      accessible
      role="img"
      aria-label="Unsaved changes"
      className={cn('bg-foreground/70 size-2 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { UnsavedIndicator };
