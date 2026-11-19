// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WaypointsIcon} through. */
type WaypointsIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * The length of each point, a circle of radius 2, of each slanted link and of the straight one, in the 24-unit viewBox.
 */
const POINT = 12.57;
const LINK = 7.31;
const CROSS = 12;

/**
 * How far into the way back each link starts after the points, and how long each part takes: the web twin's 0.15 and
 * 0.3 s, in proportion.
 */
const STAGGER = 0.2;
const DRAW = 0.4;

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
 * Lucide's waypoints icon, whose points are drawn in again, then the links between them one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function WaypointsIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, POINT, 0, DRAW));
  const left = useAnimatedProps(() => drawIn(progress.value, POINT, 0, DRAW));
  const right = useAnimatedProps(() => drawIn(progress.value, POINT, 0, DRAW));
  const bottom = useAnimatedProps(() => drawIn(progress.value, POINT, 0, DRAW));
  const upperLink = useAnimatedProps(() => drawIn(progress.value, LINK, STAGGER, STAGGER + DRAW));
  const crossLink = useAnimatedProps(() => drawIn(progress.value, CROSS, 2 * STAGGER, 2 * STAGGER + DRAW));
  const lowerLink = useAnimatedProps(() => drawIn(progress.value, LINK, 3 * STAGGER, 3 * STAGGER + DRAW));

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
      <AnimatedCircle cx="12" cy="4" r="2" animatedProps={top} />
      <AnimatedPath d="m10.586 5.414-5.172 5.172" animatedProps={upperLink} />
      <AnimatedCircle cx="4" cy="12" r="2" animatedProps={left} />
      <AnimatedPath d="M6 12h12" animatedProps={crossLink} />
      <AnimatedCircle cx="20" cy="12" r="2" animatedProps={right} />
      <AnimatedPath d="m18.586 13.414-5.172 5.172" animatedProps={lowerLink} />
      <AnimatedCircle cx="12" cy="20" r="2" animatedProps={bottom} />
    </Svg>
  );
}

export { WaypointsIcon };
export type { WaypointsIconHandle };
