// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandCoinsIcon} through. */
type HandCoinsIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The way out is quick, so the way back is what drops the coins in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far each coin drops, in the 24-unit viewBox: the web twin's 20 would show them past the top of
 * the canvas while they fade in, which react-native-svg clips, so each drops only as far as the room above it.
 */
const NEAR_DROP = 4;
const FAR_DROP = 1;

/** The place and opacity of a coin that drops `drop` units and fades in over its own stretch of the way back. */
function dropIn(progress: number, drop: number, start: number, end: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shown = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ y: drop * (shown - 1) }), opacity: shown };
}

/**
 * Lucide's hand-coins icon, whose coins drop into it one after the other when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function HandCoinsIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const near = useAnimatedProps(() => dropIn(progress.value, NEAR_DROP, 0, 0.7));
  const far = useAnimatedProps(() => dropIn(progress.value, FAR_DROP, 0.3, 1));

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
      <Path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <Path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <Path d="m2 16 6 6" />
      <AnimatedCircle cx="16" cy="9" r="2.9" animatedProps={near} />
      <AnimatedCircle cx="6" cy="5" r="3" animatedProps={far} />
    </Svg>
  );
}

export { HandCoinsIcon };
export type { HandCoinsIconHandle };
