import { useEffect, useRef, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { withUniwind } from 'uniwind';
import { cn } from '../lib/utils';

type SkeletonProps = ComponentProps<typeof Animated.View> & { className?: string };

const StyledAnimatedView: ComponentType<SkeletonProps> = withUniwind(Animated.View);

const PULSE_HALF_CYCLE_MS = 1000;
const PULSE_LOW_OPACITY = 0.5;

/**
 * A muted placeholder block for content that is loading, sized by its `className`. Uniwind does not
 * run `animate-pulse` on a device, so the block fades to half opacity and back on a loop.
 */
function Skeleton({ className, style, ...props }: SkeletonProps): ReactNode {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fadeTo = (toValue: number): Animated.CompositeAnimation =>
      Animated.timing(opacity, {
        toValue,
        duration: PULSE_HALF_CYCLE_MS,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: true,
      });
    const pulse = Animated.loop(Animated.sequence([fadeTo(PULSE_LOW_OPACITY), fadeTo(1)]));
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <StyledAnimatedView className={cn('cn-skeleton', className)} style={[{ opacity }, style]} {...props} />;
}

export { Skeleton };
