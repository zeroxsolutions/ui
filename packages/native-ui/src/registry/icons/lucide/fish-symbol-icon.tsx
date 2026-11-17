// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FishSymbolIcon} through. */
type FishSymbolIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the fish in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the fish, in the 24-unit viewBox. */
const FISH = 48.48;

/**
 * Lucide's fish-symbol icon, which is drawn in again from nothing when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function FishSymbolIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const fish = useAnimatedProps(() =>
    dash(FISH, interpolate(1 - progress.value, [1 / 3, 1], [0, 1], Extrapolation.CLAMP)),
  );

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
      <AnimatedPath d="M2 16s9-15 20-4C11 23 2 8 2 8" animatedProps={fish} />
    </Svg>
  );
}

export { FishSymbolIcon };
export type { FishSymbolIconHandle };
