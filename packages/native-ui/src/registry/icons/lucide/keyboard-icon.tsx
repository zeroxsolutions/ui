// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link KeyboardIcon} through. */
type KeyboardIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of a key that dims to a fifth over its own stretch of the motion, beginning at `start`. */
function press(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: 1 - 0.8 * interpolate(progress, [start, start + 0.5], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's keyboard icon, whose keys dim one after another, as if typed, and light again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function KeyboardIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const key0 = useAnimatedProps(() => press(progress.value, 0));
  const key1 = useAnimatedProps(() => press(progress.value, 0.3));
  const key2 = useAnimatedProps(() => press(progress.value, 0.1));
  const key3 = useAnimatedProps(() => press(progress.value, 0.4));
  const key4 = useAnimatedProps(() => press(progress.value, 0.2));
  const key5 = useAnimatedProps(() => press(progress.value, 0.05));
  const key6 = useAnimatedProps(() => press(progress.value, 0.5));
  const key7 = useAnimatedProps(() => press(progress.value, 0.15));

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
      <AnimatedPath d="M10 8h.01" animatedProps={key0} />
      <AnimatedPath d="M12 12h.01" animatedProps={key1} />
      <AnimatedPath d="M14 8h.01" animatedProps={key2} />
      <AnimatedPath d="M16 12h.01" animatedProps={key3} />
      <AnimatedPath d="M18 8h.01" animatedProps={key4} />
      <AnimatedPath d="M6 8h.01" animatedProps={key5} />
      <AnimatedPath d="M7 16h10" animatedProps={key6} />
      <AnimatedPath d="M8 12h.01" animatedProps={key7} />
      <Rect width="20" height="16" x="2" y="4" rx="2" />
    </Svg>
  );
}

export { KeyboardIcon };
export type { KeyboardIconHandle };
