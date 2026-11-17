// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CalendarCheck2Icon} through. */
type CalendarCheck2IconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 8.49;

/** The way out is quick, so the way back is what draws the tick in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's calendar-check-2 icon, whose tick is drawn in again from nothing when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function CalendarCheck2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const tick = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(TICK, drawn), opacity: drawn };
  });

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
      <Path d="M 19 3 L 5 3" />
      <Path d="M 21 13 L 21 5" />
      <Path d="M 21 5 A2 2 0 0 0 19 3" />
      <Path d="M 3 19 A2 2 0 0 0 5 21" />
      <Path d="M 3 5 L 3 19" />
      <Path d="M 5 3 A2 2 0 0 0 3 5" />
      <Path d="M16 2v3" />
      <Path d="M3 9h18" />
      <Path d="M5 21 L12.5 21" />
      <Path d="M8 2v3" />
      <AnimatedPath d="m16 19 2 2 4-4" animatedProps={tick} />
    </Svg>
  );
}

export { CalendarCheck2Icon };
export type { CalendarCheck2IconHandle };
