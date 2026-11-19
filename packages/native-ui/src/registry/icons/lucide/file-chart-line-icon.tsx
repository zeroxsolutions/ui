// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FileChartLineIcon} through. */
type FileChartLineIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the line in; half the web twin's 450 ms. */
const TIMING: IconTiming = { duration: 225, outEasing: Easing.out(Easing.exp) };

/** The length of the line, in the 24-unit viewBox. */
const LINE = 11.31;

/**
 * Lucide's file-chart-line icon, whose line is drawn in again from nothing, from its left end when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function FileChartLineIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const line = useAnimatedProps(() =>
    dash(LINE, interpolate(1 - progress.value, [0.33, 1], [0, 1], Extrapolation.CLAMP)),
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
      <Path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <Path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <AnimatedPath d="m8 17 2.5-2.5 2 2L16 13" animatedProps={line} />
    </Svg>
  );
}

export { FileChartLineIcon };
export type { FileChartLineIconHandle };
