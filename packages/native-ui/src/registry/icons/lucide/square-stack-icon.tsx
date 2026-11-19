// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SquareStackIcon} through. */
type SquareStackIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How much the front square and each square behind it shrink about their own middles: the web twin's. */
const FRONT = 0.8;
const BEHIND = 0.9;

/** The size of a square about its middle (`x`, `y`) that shrinks to `size` from `start` to `end` of the way out. */
function squeeze(progress: number, size: number, start: number, end: number, x: number, y: number): IconTransformProps {
  'worklet';
  const scale = interpolate(progress, [start, end], [1, size], Extrapolation.CLAMP);
  return transformProps({ scaleX: scale, scaleY: scale, originX: x, originY: y });
}

/**
 * Lucide's square-stack icon, whose squares squeeze in one after another, front first, and back when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function SquareStackIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // The squares behind wait, as the web twin's wait 0.2 and 0.3 s.
  const back = useAnimatedProps(() => squeeze(progress.value, BEHIND, 0.4, 1, 6, 6));
  const middle = useAnimatedProps(() => squeeze(progress.value, BEHIND, 0.2, 0.8, 12, 12));
  const front = useAnimatedProps(() => squeeze(progress.value, FRONT, 0, 0.6, 18, 18));

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
      <AnimatedPath d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" animatedProps={back} />
      <AnimatedPath d="M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" animatedProps={middle} />
      <AnimatedRect width="8" height="8" x="14" y="14" rx="2" animatedProps={front} />
    </Svg>
  );
}

export { SquareStackIcon };
export type { SquareStackIconHandle };
