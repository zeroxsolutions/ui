// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MessageCircleCheckIcon} through. */
type MessageCircleCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the tick in; half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 11.31;

/**
 * Lucide's message-circle-check icon, whose tick is drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function MessageCircleCheckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  // Lucide draws the tick from its right end; the web twin's, as each tick is drawn, from its left.
  const tick = useAnimatedProps(() => dash(TICK, 1 - progress.value, progress.value));

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
      <Path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <AnimatedPath d="m16 9-5.5 5.5L8 12" animatedProps={tick} />
    </Svg>
  );
}

export { MessageCircleCheckIcon };
export type { MessageCircleCheckIconHandle };
