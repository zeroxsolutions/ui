// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MonitorCheckIcon} through. */
type MonitorCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the tick in; half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 8.49;

/**
 * Lucide's monitor-check icon, whose tick is drawn in again from nothing when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function MonitorCheckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const tick = useAnimatedProps(() => dash(TICK, 1 - progress.value));

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
      <Rect width="20" height="14" x="2" y="3" rx="2" />
      <Path d="M12 17v4" />
      <Path d="M8 21h8" />
      <AnimatedPath d="m9 10 2 2 4-4" animatedProps={tick} />
    </Svg>
  );
}

export { MonitorCheckIcon };
export type { MonitorCheckIconHandle };
