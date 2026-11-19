// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MicOffIcon} through. */
type MicOffIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

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
 * Lucide's mic-off icon, whose slash is drawn in again when started. Hidden from a screen reader: the control around it
 * says what it does.
 */
function MicOffIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  // It waits a quarter of the way back, as the web twin's slash waits 0.15 s of its 0.55.
  const slash = useAnimatedProps(() => drawIn(progress.value, SLASH, 0.25, 1));

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
      <Path d="M12 19v3" />
      <Path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <Path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />
      <Path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />
      <AnimatedPath d="m2 2 20 20" animatedProps={slash} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    </Svg>
  );
}

export { MicOffIcon };
export type { MicOffIconHandle };
