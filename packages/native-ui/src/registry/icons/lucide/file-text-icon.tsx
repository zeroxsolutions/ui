// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FileTextIcon} through. */
type FileTextIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A line of text `length` units long, pulled in from its end `delay` of the way in. */
function line(progress: number, delay: number, length: number): ReturnType<typeof dash> {
  'worklet';
  return dash(length, 1 - interpolate(progress, [delay, 1], [0, 1], Extrapolation.CLAMP));
}

/**
 * Lucide's file-text icon, which swells a little while its three lines pull in and return one after another
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function FileTextIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => ({
    ...transformProps({ scaleX: 1 + 0.05 * progress.value, scaleY: 1 + 0.05 * progress.value }),
  }));
  const first = useAnimatedProps(() => line(progress.value, 0, 2));
  const second = useAnimatedProps(() => line(progress.value, 0.2, 8));
  const third = useAnimatedProps(() => line(progress.value, 0.4, 8));

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
      <AnimatedG animatedProps={whole}>
        <Path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        <Path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <AnimatedPath d="M10 9H8" animatedProps={first} />
        <AnimatedPath d="M16 13H8" animatedProps={second} />
        <AnimatedPath d="M16 17H8" animatedProps={third} />
      </AnimatedG>
    </Svg>
  );
}

export { FileTextIcon };
export type { FileTextIconHandle };
