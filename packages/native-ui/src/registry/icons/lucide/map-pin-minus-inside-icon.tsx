// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MapPinMinusInsideIcon} through. */
type MapPinMinusInsideIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the pin lifts, in the 24-unit viewBox, and where it settles before it comes down: a fifth of the web twin's
 * 5 and 3, since Lucide's pin rests a unit below the top of the canvas, which react-native-svg clips.
 */
const LIFT = [0, -1, -0.6];

/** The length of the bar, in the 24-unit viewBox. */
const BAR = 6;

/**
 * The stroke of a part `length` units long, drawn in over its own stretch of the way back, from `start` to `end`
 * of it, beginning at its far end when `fromEnd`.
 */
function drawIn(
  progress: number,
  length: number,
  start: number,
  end: number,
  fromEnd = false,
): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return dash(length, drawn, fromEnd ? 1 - drawn : 0);
}

/**
 * Lucide's map-pin-minus-inside icon, which lifts while its minus is drawn in again when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function MapPinMinusInsideIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, [0, 0.6, 1], LIFT) }));
  const minus = useAnimatedProps(() => drawIn(progress.value, BAR, 0, 1));

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
      <AnimatedG animatedProps={whole}>
        <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <AnimatedPath d="M9 10h6" animatedProps={minus} />
      </AnimatedG>
    </Svg>
  );
}

export { MapPinMinusInsideIcon };
export type { MapPinMinusInsideIconHandle };
