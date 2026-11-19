// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChartLineIcon} through. */
type ChartLineIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the line, in the 24-unit viewBox. */
const LINE = 16.97;

/** The way out is quick, so the way back is what draws the line in. */
const TIMING: IconTiming = { duration: 225, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's chart-line icon, whose line is drawn in again from nothing, left to right, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ChartLineIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const line = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    return {
      ...dash(LINE, interpolate(shown, [0.33, 1], [0, 1], Extrapolation.CLAMP)),
      opacity: interpolate(shown, [0.22, 0.89], [0, 1], Extrapolation.CLAMP),
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
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <AnimatedPath d="m7 13 3-3 4 4 5-5" animatedProps={line} />
    </Svg>
  );
}

export { ChartLineIcon };
export type { ChartLineIconHandle };
