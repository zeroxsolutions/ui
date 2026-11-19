// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChartScatterIcon} through. */
type ChartScatterIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The opacity of the point `index` at `progress`, each coming back a little after the last. */
function point(progress: number, index: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [index / 6, index / 6 + 1 / 3], [0, 1], Extrapolation.CLAMP) };
}

/** The way out is quick, so the way back is what brings the points back. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's chart-scatter icon, whose points vanish and come back one after another when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function ChartScatterIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const first = useAnimatedProps(() => point(progress.value, 0));
  const second = useAnimatedProps(() => point(progress.value, 1));
  const third = useAnimatedProps(() => point(progress.value, 2));
  const fourth = useAnimatedProps(() => point(progress.value, 3));
  const fifth = useAnimatedProps(() => point(progress.value, 4));

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
      <AnimatedCircle cx="7.5" cy="7.5" r=".5" fill={color} animatedProps={first} />
      <AnimatedCircle cx="18.5" cy="5.5" r=".5" fill={color} animatedProps={second} />
      <AnimatedCircle cx="11.5" cy="11.5" r=".5" fill={color} animatedProps={third} />
      <AnimatedCircle cx="7.5" cy="16.5" r=".5" fill={color} animatedProps={fourth} />
      <AnimatedCircle cx="17.5" cy="14.5" r=".5" fill={color} animatedProps={fifth} />
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
    </Svg>
  );
}

export { ChartScatterIcon };
export type { ChartScatterIconHandle };
