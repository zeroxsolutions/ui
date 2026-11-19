// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconHandle,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CheckIcon} through. */
type CheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 22.63;

/** The way out is quick, so the way back is what draws the tick in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's check icon, drawn in again from nothing, growing from half size, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CheckIcon({
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
    const scale = 0.5 + 0.5 * drawn;
    return {
      ...dash(TICK, drawn, 1 - drawn),
      opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP),
      ...transformProps({ scaleX: scale, scaleY: scale, originY: 11.5 }),
    };
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
      <AnimatedPath d="M20 6 9 17l-5-5" animatedProps={tick} />
    </Svg>
  );
}

export { CheckIcon };
export type { CheckIconHandle };
