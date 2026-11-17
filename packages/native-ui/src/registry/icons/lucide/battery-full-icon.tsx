// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BatteryFullIcon} through. */
type BatteryFullIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The bar at `index` of `3` faded out: the last bar goes first, so the first bar is the first back.
 */
function bar(progress: number, index: number): { opacity: number } {
  'worklet';
  const start = 0.2 * (2 - index);
  return { opacity: 1 - interpolate(progress, [start, start + 0.6], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's battery-full icon, whose bars fade out from the last and fade back in from the first, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function BatteryFullIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => bar(progress.value, 0));
  const second = useAnimatedProps(() => bar(progress.value, 1));
  const third = useAnimatedProps(() => bar(progress.value, 2));

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
      <Rect x="2" y="6" width="16" height="12" rx="2" />
      <Path d="M22 14v-4" />
      <AnimatedPath d="M6 10v4" animatedProps={first} />
      <AnimatedPath d="M10 10v4" animatedProps={second} />
      <AnimatedPath d="M14 10v4" animatedProps={third} />
    </Svg>
  );
}

export { BatteryFullIcon };
export type { BatteryFullIconHandle };
