// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CalendarCheckIcon} through. */
type CalendarCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 8.49;

/** The way out is quick, so the way back is what draws the tick in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's calendar-check icon, whose tick is drawn in again from nothing when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function CalendarCheckIcon({
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
      <Path d="M8 2v3" />
      <Path d="M16 2v3" />
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Path d="M3 9h18" />
      <AnimatedPath d="m9 15 2 2 4-4" animatedProps={tick} />
    </Svg>
  );
}

export { CalendarCheckIcon };
export type { CalendarCheckIconHandle };
