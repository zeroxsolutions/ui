// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CalendarDaysIcon} through. */
type CalendarDaysIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of the day `index` in reading order at `progress`, each dimming a little after the last. */
function day(progress: number, index: number): { opacity: number } {
  'worklet';
  const dimmed = interpolate(progress, [0.1 * index, 0.1 * index + 0.5], [0, 1], Extrapolation.CLAMP);
  return { opacity: 1 - 0.7 * Math.sin(Math.PI * dimmed) };
}

/**
 * Lucide's calendar-days icon, whose days dim and brighten again one after another, in a wave across the month and
 * back, when started. Hidden from a screen reader: the control around it says what it does.
 */
function CalendarDaysIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => day(progress.value, 0));
  const second = useAnimatedProps(() => day(progress.value, 1));
  const third = useAnimatedProps(() => day(progress.value, 2));
  const fourth = useAnimatedProps(() => day(progress.value, 3));
  const fifth = useAnimatedProps(() => day(progress.value, 4));
  const sixth = useAnimatedProps(() => day(progress.value, 5));

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
      <Path d="M8 2v3" />
      <Path d="M16 2v3" />
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Path d="M3 9h18" />
      <AnimatedPath d="M8 13h.01" animatedProps={first} />
      <AnimatedPath d="M12 13h.01" animatedProps={second} />
      <AnimatedPath d="M16 13h.01" animatedProps={third} />
      <AnimatedPath d="M8 17h.01" animatedProps={fourth} />
      <AnimatedPath d="M12 17h.01" animatedProps={fifth} />
      <AnimatedPath d="M16 17h.01" animatedProps={sixth} />
    </Svg>
  );
}

export { CalendarDaysIcon };
export type { CalendarDaysIconHandle };
