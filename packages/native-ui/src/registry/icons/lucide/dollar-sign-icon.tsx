// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DollarSignIcon} through. */
type DollarSignIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the sign in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the S, in the 24-unit viewBox. */
const S = 42.99;

/** The length of the stroke through it. */
const STROKE = 18;

/**
 * Lucide's dollar-sign icon, whose S is drawn in again from nothing, then its stroke from the top when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function DollarSignIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const letter = useAnimatedProps(() =>
    dash(S, interpolate(1 - progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP)),
  );
  const stroke = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP);
    return dash(STROKE, drawn, 1 - drawn);
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
      <AnimatedPath d="M17 5H9.5a1 1 0 000 7h5a1 1 0 010 7H6" animatedProps={letter} />
      <AnimatedPath d="M12 21V3" animatedProps={stroke} />
    </Svg>
  );
}

export { DollarSignIcon };
export type { DollarSignIconHandle };
