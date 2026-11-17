// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BananaIcon} through. */
type BananaIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the flesh and the peel, in the 24-unit viewBox. */
const FLESH = 22.88;
const PEEL = 58.79;

/** The way out is quick, so the way back is what draws the banana in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's banana icon, whose peel and then whose flesh are drawn in again from nothing when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function BananaIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const flesh = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP);
    return { ...dash(FLESH, drawn), opacity: drawn };
  });
  const peel = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    return { ...dash(PEEL, drawn), opacity: drawn };
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
      <AnimatedPath d="M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" animatedProps={flesh} />
      <AnimatedPath
        d="M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z"
        animatedProps={peel}
      />
    </Svg>
  );
}

export { BananaIcon };
export type { BananaIconHandle };
