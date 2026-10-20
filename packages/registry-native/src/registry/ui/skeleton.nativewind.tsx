import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';

/**
 * A muted placeholder block for content that is loading, sized by its `className`. NativeWind
 * runs `animate-pulse` on a device.
 */
function Skeleton({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('animate-pulse cn-skeleton', className)} {...props} />;
}

export { Skeleton };
