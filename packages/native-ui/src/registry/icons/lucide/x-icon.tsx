// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link XIcon} through. */
type XIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of each stroke, in the 24-unit viewBox. */
const STROKE = 16.97;

/** The way out is quick, so the way back is what draws the strokes in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** A stroke drawn in between `from` and `to` of the way through the draw. */
function stroke(drawn: number, from: number, to: number): ReturnType<typeof dash> {
  'worklet';
  const grown = interpolate(drawn, [from, to], [0, 1], Extrapolation.CLAMP);
  return { ...dash(STROKE, grown), opacity: grown };
}

/**
 * Lucide's x icon, whose two strokes are drawn in again, the second last, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function XIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const first = useAnimatedProps(() => stroke(1 - progress.value, 0, 0.6));
  const second = useAnimatedProps(() => stroke(1 - progress.value, 0.4, 1));

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
      <AnimatedPath d="M18 6 6 18" animatedProps={first} />
      <AnimatedPath d="m6 6 12 12" animatedProps={second} />
    </Svg>
  );
}

export { XIcon };
export type { XIconHandle };
