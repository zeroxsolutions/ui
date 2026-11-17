// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderGit2Icon} through. */
type FolderGit2IconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each commit, 2 pi 2, in the 24-unit viewBox. */
const RING = 12.57;

/** The length of the branch, in the 24-unit viewBox. */
const BRANCH = 15.86;

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
 * Lucide's folder-git-2 icon, whose commit, branch and second commit are drawn in again one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function FolderGit2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const commit = useAnimatedProps(() => drawIn(progress.value, RING, 0, 1 / 3));
  const branch = useAnimatedProps(() => drawIn(progress.value, BRANCH, 1 / 3, 2 / 3, true));
  const tip = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));

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
      <Path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
      <AnimatedCircle cx="13" cy="12" r="2" animatedProps={commit} />
      <AnimatedPath d="M18 19a5 5 0 0 1-5-5v8" animatedProps={branch} />
      <AnimatedCircle cx="20" cy="19" r="2" animatedProps={tip} />
    </Svg>
  );
}

export { FolderGit2Icon };
export type { FolderGit2IconHandle };
