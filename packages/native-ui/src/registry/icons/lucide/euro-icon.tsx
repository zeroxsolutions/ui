// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link EuroIcon} through. */
type EuroIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the sign in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the curve, in the 24-unit viewBox. */
const CURVE = 36.21;

/** The lengths of the upper and the lower bar. */
const BARS = [12, 9];

/** The stroke props of the bar `index`, drawn from its end over the second part of the way back. */
function bar(progress: number, index: number): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [0.5, 1], [0, 1], Extrapolation.CLAMP);
  return dash(BARS[index] ?? 0, drawn, 1 - drawn);
}

/**
 * Lucide's euro icon, whose curve is drawn in again from nothing, then its two bars from their left ends when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function EuroIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const curve = useAnimatedProps(() =>
    dash(CURVE, interpolate(1 - progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP)),
  );
  const upper = useAnimatedProps(() => bar(progress.value, 0));
  const lower = useAnimatedProps(() => bar(progress.value, 1));

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
      <AnimatedPath
        d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"
        animatedProps={curve}
      />
      <AnimatedPath d="M16 10h-12" animatedProps={upper} />
      <AnimatedPath d="M13 14h-9" animatedProps={lower} />
    </Svg>
  );
}

export { EuroIcon };
export type { EuroIconHandle };
