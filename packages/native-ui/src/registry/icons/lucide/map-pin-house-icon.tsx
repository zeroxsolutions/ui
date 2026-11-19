// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MapPinHouseIcon} through. */
type MapPinHouseIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the pin lifts, in the 24-unit viewBox, and where it settles before it comes down: a fifth of the web twin's
 * 5 and 3, since Lucide's pin rests a unit below the top of the canvas, which react-native-svg clips.
 */
const LIFT = [0, -1, -0.6];

/** The length of the house, in the 24-unit viewBox. */
const HOUSE = 27.5;

/** The length of the door, in the 24-unit viewBox. */
const DOOR = 3;

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
 * Lucide's map-pin-house icon, which lifts while its house is drawn in again when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function MapPinHouseIcon({
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
  const house = useAnimatedProps(() => drawIn(progress.value, HOUSE, 0, 1));
  const door = useAnimatedProps(() => drawIn(progress.value, DOOR, 0, 1));

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
        <Path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2" />
        <Circle cx="10" cy="10" r="3" />
        <AnimatedPath
          d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"
          animatedProps={house}
        />
        <AnimatedPath d="M18 22v-3" animatedProps={door} />
      </AnimatedG>
    </Svg>
  );
}

export { MapPinHouseIcon };
export type { MapPinHouseIconHandle };
