// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link EarthIcon} through. */
type EarthIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the globe in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the globe's outline, in the 24-unit viewBox. */
const GLOBE = 62.83;

/** The lengths of the three lines of land, in the order they are drawn. */
const LAND = [12.22, 22.11, 17.33];

/** The stroke props of the land line `index`, drawn from its end over the second part of the way back. */
function land(progress: number, index: number): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [0.4, 1], [0, 1], Extrapolation.CLAMP);
  return dash(LAND[index] ?? 0, drawn, 1 - drawn);
}

/**
 * Lucide's earth icon, whose globe is drawn in again from nothing, then its land from the ends of its lines when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function EarthIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const globe = useAnimatedProps(() =>
    dash(GLOBE, interpolate(1 - progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP)),
  );
  const land0 = useAnimatedProps(() => land(progress.value, 0));
  const land1 = useAnimatedProps(() => land(progress.value, 1));
  const land2 = useAnimatedProps(() => land(progress.value, 2));

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
      <AnimatedPath d="M21.54 15H17a2 2 0 0 0-2 2v4.54" animatedProps={land0} />
      <AnimatedPath
        d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"
        animatedProps={land1}
      />
      <AnimatedPath d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" animatedProps={land2} />
      <AnimatedCircle cx="12" cy="12" r="10" animatedProps={globe} />
    </Svg>
  );
}

export { EarthIcon };
export type { EarthIconHandle };
