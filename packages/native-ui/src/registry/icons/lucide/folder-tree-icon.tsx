// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderTreeIcon} through. */
type FolderTreeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the top folder, in the 24-unit viewBox. */
const TOP = 29.14;

/** The length of the bottom folder, in the 24-unit viewBox. */
const BOTTOM = 29.27;

/** The length of the branch to the top folder, in the 24-unit viewBox. */
const SHORT = 6.14;

/** The length of the branch to the bottom folder, in the 24-unit viewBox. */
const LONG = 19.14;

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
 * Lucide's folder-tree icon, whose folders and the branches to them are drawn in again one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function FolderTreeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, TOP, 0, 0.25));
  const bottom = useAnimatedProps(() => drawIn(progress.value, BOTTOM, 0.5, 0.75));
  const shortBranch = useAnimatedProps(() => drawIn(progress.value, SHORT, 0.25, 0.5, true));
  const longBranch = useAnimatedProps(() => drawIn(progress.value, LONG, 0.75, 1, true));

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
        d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
        animatedProps={top}
      />
      <AnimatedPath
        d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
        animatedProps={bottom}
      />
      <AnimatedPath d="M3 5a2 2 0 0 0 2 2h3" animatedProps={shortBranch} />
      <AnimatedPath d="M3 3v13a2 2 0 0 0 2 2h3" animatedProps={longBranch} />
    </Svg>
  );
}

export { FolderTreeIcon };
export type { FolderTreeIconHandle };
