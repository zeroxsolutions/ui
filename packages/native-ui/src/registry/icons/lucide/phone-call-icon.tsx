// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PhoneCallIcon} through. */
type PhoneCallIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The ring, in degrees about the middle at each half of the way out, the web twin's, and the phone's size at each:
 * turned that far, the handset would cross the canvas, which react-native-svg clips, so it shrinks a little where
 * the web twin grows it to 1.2.
 */
const RING = [0, 20, -10];
const SIZE = [1, 0.88, 0.88];

/** The opacity of a wave that is gone between `start` and `end` of the way out, and back again as the way back passes. */
function wave(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, end], [1, 0], Extrapolation.CLAMP) };
}

/**
 * Lucide's phone-call icon, which rings while its waves fade out and back in when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function PhoneCallIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], SIZE);
    return transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], RING), scaleX: size, scaleY: size });
  });
  // The outer wave goes first and comes back last, as the web twin's comes back 0.1 s after the inner one.
  const outer = useAnimatedProps(() => wave(progress.value, 0.1, 0.5));
  const inner = useAnimatedProps(() => wave(progress.value, 0.3, 0.7));

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
        <AnimatedPath d="M13 2a9 9 0 0 1 9 9" animatedProps={outer} />
        <AnimatedPath d="M13 6a5 5 0 0 1 5 5" animatedProps={inner} />
        <Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      </AnimatedG>
    </Svg>
  );
}

export { PhoneCallIcon };
export type { PhoneCallIconHandle };
