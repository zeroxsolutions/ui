// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AudioLinesIcon} through. */
type AudioLinesIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A bar at `x` running from `top` for `length`, moved toward `toTop` and `toLength` by `progress`. */
function bar(progress: number, x: number, top: number, length: number, toTop: number, toLength: number): { d: string } {
  'worklet';
  return { d: `M${x} ${top + (toTop - top) * progress}v${length + (toLength - length) * progress}` };
}

/**
 * Lucide's audio-lines icon, whose four middle bars stretch and shrink and return when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function AudioLinesIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const second = useAnimatedProps(() => bar(progress.value, 6, 6, 11, 10, 3));
  const third = useAnimatedProps(() => bar(progress.value, 10, 3, 18, 9, 5));
  const fourth = useAnimatedProps(() => bar(progress.value, 14, 8, 7, 6, 11));
  const fifth = useAnimatedProps(() => bar(progress.value, 18, 5, 13, 7, 9));

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
      <Path d="M2 10v3" />
      <AnimatedPath d="M6 6v11" animatedProps={second} />
      <AnimatedPath d="M10 3v18" animatedProps={third} />
      <AnimatedPath d="M14 8v7" animatedProps={fourth} />
      <AnimatedPath d="M18 5v13" animatedProps={fifth} />
      <Path d="M22 10v3" />
    </Svg>
  );
}

export { AudioLinesIcon };
export type { AudioLinesIconHandle };
