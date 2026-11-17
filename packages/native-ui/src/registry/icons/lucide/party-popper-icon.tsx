// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PartyPopperIcon} through. */
type PartyPopperIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what pops the streamers and confetti out. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far the popper kicks back towards the lower left, in the 24-unit viewBox: two thirds of the web twin's 1.5,
 * which would take its tip past the corner of the canvas, which react-native-svg clips.
 */
const KICK = 1;

/**
 * How far the streamers and confetti fly from, towards the lower left, in the 24-unit viewBox: three fifths of the
 * web twin's 5, which would show the upper-left dot past the canvas as it fades in.
 */
const TRAVEL = 3;

/** The length of each streamer, in the 24-unit viewBox, from the top one clockwise. */
const UPPER = 12.75;
const LOWER = 6.3;
const LEFT = 6.3;

/**
 * The place, size and opacity of a streamer or a dot that flies out of the popper over the way back, growing from
 * `from` of its size about (`cx`, `cy`), past it and back.
 */
function flyOut(progress: number, cx: number, cy: number, from: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shown = 1 - progress;
  const size = interpolate(shown, [0, 0.25, 0.5, 0.75, 1], [from, 0.8, 1, 1.1, 1]);
  return {
    ...transformProps({
      x: -TRAVEL * progress,
      y: TRAVEL * progress,
      scaleX: size,
      scaleY: size,
      originX: cx,
      originY: cy,
    }),
    opacity: shown,
  };
}

/**
 * A streamer `length` units long flying out as {@link flyOut} has it, drawn in from the popper's end, which is its
 * far end in Lucide's path.
 */
function streamer(
  progress: number,
  length: number,
  cx: number,
  cy: number,
): ReturnType<typeof dash> & ReturnType<typeof flyOut> {
  'worklet';
  const drawn = 1 - progress;
  return { ...dash(length, drawn, 1 - drawn), ...flyOut(progress, cx, cy, 0.3) };
}

/**
 * Lucide's party-popper icon, which pops, its streamers and confetti flying out again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function PartyPopperIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const popper = useAnimatedProps(() => transformProps({ x: -KICK * progress.value, y: KICK * progress.value }));
  const upper = useAnimatedProps(() => streamer(progress.value, UPPER, 18, 6));
  const lower = useAnimatedProps(() => streamer(progress.value, LOWER, 19.5, 13.784));
  const left = useAnimatedProps(() => streamer(progress.value, LEFT, 10.216, 4.5));
  const dotUpperLeft = useAnimatedProps(() => flyOut(progress.value, 4.005, 3, 0.5));
  const dotRight = useAnimatedProps(() => flyOut(progress.value, 22.005, 8, 0.5));
  const dotTop = useAnimatedProps(() => flyOut(progress.value, 15.005, 2, 0.5));
  const dotLowerRight = useAnimatedProps(() => flyOut(progress.value, 22.005, 20, 0.5));

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
      <AnimatedG animatedProps={popper}>
        <Path d="M5.8 11.3 2 22l10.7-3.79" />
        <Path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
      </AnimatedG>
      <AnimatedPath d="M4 3h.01" animatedProps={dotUpperLeft} />
      <AnimatedPath d="M22 8h.01" animatedProps={dotRight} />
      <AnimatedPath d="M15 2h.01" animatedProps={dotTop} />
      <AnimatedPath d="M22 20h.01" animatedProps={dotLowerRight} />
      <AnimatedPath
        d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"
        animatedProps={upper}
      />
      <AnimatedPath d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" animatedProps={lower} />
      <AnimatedPath d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" animatedProps={left} />
    </Svg>
  );
}

export { PartyPopperIcon };
export type { PartyPopperIconHandle };
