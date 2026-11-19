// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BoxIcon} through. */
type BoxIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the outline, the top edges and the front edge, in the 24-unit viewBox. */
const OUTLINE = 60.81;
const TOP = 20.07;
const FRONT = 10;

/** The stroke props of an edge `length` long at `progress`, drawn in from its start and fading in as it begins. */
function drawnIn(length: number, progress: number): ReturnType<typeof dash> {
  'worklet';
  const shown = 1 - progress;
  return { ...dash(length, shown), opacity: interpolate(shown, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
}

/** The way out is quick, so the way back is what draws the box in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's box icon, drawn in again from nothing, its outline and its two inner edges together, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function BoxIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const outline = useAnimatedProps(() => drawnIn(OUTLINE, progress.value));
  const top = useAnimatedProps(() => drawnIn(TOP, progress.value));
  const front = useAnimatedProps(() => drawnIn(FRONT, progress.value));

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
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        animatedProps={outline}
      />
      <AnimatedPath d="m3.3 7 8.7 5 8.7-5" animatedProps={top} />
      <AnimatedPath d="M12 22V12" animatedProps={front} />
    </Svg>
  );
}

export { BoxIcon };
export type { BoxIconHandle };
