// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link SparklesIcon} through. */
type SparklesIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's sparkles icon, whose big star lifts and fills in while the small ones blink, then returns, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function SparklesIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const star = useAnimatedProps(() => ({
    fillOpacity: progress.value,
    ...transformProps({ y: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, -1, 0, 0]) }),
  }));
  const blink = useAnimatedProps(() => ({ opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0, 1]) }));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedPath
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        fill={color}
        animatedProps={star}
      />
      <AnimatedPath d="M20 2v4" animatedProps={blink} />
      <AnimatedPath d="M22 4h-4" animatedProps={blink} />
      <AnimatedCircle cx="4" cy="20" r="2" animatedProps={blink} />
    </Svg>
  );
}

export { SparklesIcon };
export type { SparklesIconHandle };
