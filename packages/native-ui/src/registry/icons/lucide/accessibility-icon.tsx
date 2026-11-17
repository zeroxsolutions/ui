// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AccessibilityIcon} through. */
type AccessibilityIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's accessibility icon, whose head bobs, whose body rocks and lifts its arm, and whose wheel turns round,
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function AccessibilityIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const head = useAnimatedProps(() => {
    const shift = interpolate(progress.value, [0, 0.5, 1], [0, 1, -1]);
    return transformProps({ x: shift, y: shift });
  });
  const body = useAnimatedProps(() => transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, 5, -5]) }));
  const arm = useAnimatedProps(() => ({
    d: `M8 5L${5 - progress.value} ${8 + progress.value}`,
    ...transformProps({ rotate: -60 * progress.value, originX: 8, originY: 5 }),
  }));
  const wheel = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0.3, 1], [0, -360], Extrapolation.CLAMP),
      originX: 9,
      originY: 16,
    }),
  );

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
      <AnimatedCircle cx="16" cy="4" r="1" animatedProps={head} />
      <AnimatedG animatedProps={body}>
        <Path d="m18 19 1-7-6 1" />
        <Path d="M8 5l5.5 3-2.36 3.5" />
        <AnimatedPath d="M8 5L5 8" animatedProps={arm} />
      </AnimatedG>
      <AnimatedG animatedProps={wheel}>
        <Path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
        <Path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
      </AnimatedG>
    </Svg>
  );
}

export { AccessibilityIcon };
export type { AccessibilityIconHandle };
