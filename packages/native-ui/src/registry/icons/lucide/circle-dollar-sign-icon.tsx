// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CircleDollarSignIcon} through. */
type CircleDollarSignIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the S and of the stroke through it, in the 24-unit viewBox. */
const S = 28.57;
const STROKE = 12;

/** The way out is quick, so the way back is what draws the sign in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's circle-dollar-sign icon, whose S is drawn in again from nothing, then its stroke from the top, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function CircleDollarSignIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const s = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    return {
      ...dash(S, interpolate(shown, [0, 0.67], [0, 1], Extrapolation.CLAMP)),
      opacity: interpolate(shown, [0, 0.11], [0, 1], Extrapolation.CLAMP),
    };
  });
  const stroke = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    const drawn = interpolate(shown, [0.56, 1], [0, 1], Extrapolation.CLAMP);
    return {
      ...dash(STROKE, drawn, 1 - drawn),
      opacity: interpolate(shown, [0.56, 0.67], [0, 1], Extrapolation.CLAMP),
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
      <Circle cx="12" cy="12" r="10" />
      <AnimatedPath d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" animatedProps={s} />
      <AnimatedPath d="M12 18V6" animatedProps={stroke} />
    </Svg>
  );
}

export { CircleDollarSignIcon };
export type { CircleDollarSignIconHandle };
