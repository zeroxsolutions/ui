// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChartBarIncreasingIcon} through. */
type ChartBarIncreasingIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of each bar, first to last, in the 24-unit viewBox. */
const LENGTHS = [3, 8, 12];

/**
 * The stroke props of the bar `order`th from the first at `progress`: the last bar goes first on the way
 * out, so the first comes back first on the way back. Each fades as it shortens.
 */
function bar(order: number, progress: number): ReturnType<typeof dash> {
  'worklet';
  const start = 0.2 * (LENGTHS.length - 1 - order);
  const drawn = interpolate(progress, [start, start + 0.6], [1, 0], Extrapolation.CLAMP);
  return { ...dash(LENGTHS[order], drawn), opacity: drawn };
}

/**
 * Lucide's chart-bar-increasing icon, whose bars are taken away, the last first, and drawn back in from the first, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ChartBarIncreasingIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => bar(0, progress.value));
  const second = useAnimatedProps(() => bar(1, progress.value));
  const third = useAnimatedProps(() => bar(2, progress.value));

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
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <AnimatedPath d="M7 11h8" animatedProps={second} />
      <AnimatedPath d="M7 16h12" animatedProps={third} />
      <AnimatedPath d="M7 6h3" animatedProps={first} />
    </Svg>
  );
}

export { ChartBarIncreasingIcon };
export type { ChartBarIncreasingIconHandle };
