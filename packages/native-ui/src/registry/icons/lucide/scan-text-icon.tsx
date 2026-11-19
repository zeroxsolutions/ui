// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ScanTextIcon} through. */
type ScanTextIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far into the way back each line starts to be written after the one above it, and how long it takes: the web
 * twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 0.2;
const WRITE = 0.6;

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
 * Lucide's scan-text icon, whose lines are wiped and written in again, the top one first when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ScanTextIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const top = useAnimatedProps(() => drawIn(progress.value, 8, 0, WRITE));
  const middle = useAnimatedProps(() => drawIn(progress.value, 10, STAGGER, STAGGER + WRITE));
  const bottom = useAnimatedProps(() => drawIn(progress.value, 6, 2 * STAGGER, 2 * STAGGER + WRITE));

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
      <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <AnimatedPath d="M7 8h8" animatedProps={top} />
      <AnimatedPath d="M7 12h10" animatedProps={middle} />
      <AnimatedPath d="M7 16h6" animatedProps={bottom} />
    </Svg>
  );
}

export { ScanTextIcon };
export type { ScanTextIconHandle };
