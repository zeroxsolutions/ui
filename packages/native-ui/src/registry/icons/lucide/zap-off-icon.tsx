// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ZapOffIcon} through. */
type ZapOffIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the top of the bolt, in the 24-unit viewBox. */
const TOP = 12.73;

/** The length of the right of the bolt, in the 24-unit viewBox. */
const RIGHT = 7.33;

/** The length of the bottom of the bolt, in the 24-unit viewBox. */
const BOTTOM = 30.92;

/** The length of the slash, in the 24-unit viewBox. */
const SLASH = 28.28;

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
 * Lucide's zap-off icon, whose broken bolt and slash are drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function ZapOffIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, TOP, 0, 1));
  const right = useAnimatedProps(() => drawIn(progress.value, RIGHT, 0, 1));
  const bottom = useAnimatedProps(() => drawIn(progress.value, BOTTOM, 0, 1));
  const slash = useAnimatedProps(() => drawIn(progress.value, SLASH, 0, 1));

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
      <AnimatedPath d="M10.768 5.111 13.44 2.44a1.5 1.5 0 012.474 1.561l-1.633 4.625" animatedProps={top} />
      <AnimatedPath d="m18.889 13.232.672-.672A1.5 1.5 0 0018.5 10h-2.844" animatedProps={right} />
      <AnimatedPath
        d="m7.94 7.94-3.5 3.499A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l5.5-5.5"
        animatedProps={bottom}
      />
      <AnimatedPath d="m2 2 20 20" animatedProps={slash} />
    </Svg>
  );
}

export { ZapOffIcon };
export type { ZapOffIconHandle };
