// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CastIcon} through. */
type CastIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the signal in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's cast icon, whose signal fades back in from the corner outward, the dot, then the small arc, then the large
 * one, when started. Hidden from a screen reader: the control around it says what it does.
 */
function CastIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const large = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [0.29, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const small = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [0.14, 0.86], [0, 1], Extrapolation.CLAMP),
  }));
  const dot = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [0, 0.71], [0, 1], Extrapolation.CLAMP),
  }));

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
      <Path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
      <AnimatedPath d="M2 12a9 9 0 0 1 8 8" animatedProps={large} />
      <AnimatedPath d="M2 16a5 5 0 0 1 4 4" animatedProps={small} />
      <AnimatedLine x1="2" x2="2.01" y1="20" y2="20" animatedProps={dot} />
    </Svg>
  );
}

export { CastIcon };
export type { CastIconHandle };
