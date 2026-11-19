// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandIcon} through. */
type HandIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The wave, in degrees about the wrist at each half of the way out, the web twin's, and the hand's size as it waves: at
 * full size the wave would swing the fingers past the canvas, which react-native-svg clips, so the hand shrinks towards
 * the wrist as it waves, as hand-metal does.
 */
const WAVE = [0, -15, 10];
const SIZE = [1, 0.88, 0.88];

/**
 * Lucide's hand icon, which waves from its wrist and back when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function HandIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.5, 1], WAVE),
      scaleX: interpolate(progress.value, [0, 0.5, 1], SIZE),
      scaleY: interpolate(progress.value, [0, 0.5, 1], SIZE),
      originX: 12,
      originY: 21.6,
    }),
  );

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
        <Path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <Path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
        <Path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
        <Path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </AnimatedG>
    </Svg>
  );
}

export { HandIcon };
export type { HandIconHandle };
