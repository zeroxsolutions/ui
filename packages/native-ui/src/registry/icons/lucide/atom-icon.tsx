// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AtomIcon} through. */
type AtomIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the nucleus and of each orbit, in the 24-unit viewBox. */
const NUCLEUS = 6.28;
const ORBIT = 54.77;

/** A stroke `length` long drawn in over the part of the way back from `from` to `to`. */
function drawIn(progress: number, length: number, from: number, to: number): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [from, to], [0, 1], Extrapolation.CLAMP);
  return { ...dash(length, drawn, 1 - drawn), opacity: drawn };
}

/** The way out is quick, so the way back is what draws the nucleus and the orbits in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's atom icon, whose nucleus and then each orbit are drawn in again from nothing when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function AtomIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const nucleus = useAnimatedProps(() => drawIn(progress.value, NUCLEUS, 0, 0.4));
  const first = useAnimatedProps(() => drawIn(progress.value, ORBIT, 0.3, 0.7));
  const second = useAnimatedProps(() => drawIn(progress.value, ORBIT, 0.6, 1));

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
      <AnimatedCircle cx="12" cy="12" r="1" animatedProps={nucleus} />
      <AnimatedPath
        d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"
        animatedProps={first}
      />
      <AnimatedPath
        d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"
        animatedProps={second}
      />
    </Svg>
  );
}

export { AtomIcon };
export type { AtomIconHandle };
