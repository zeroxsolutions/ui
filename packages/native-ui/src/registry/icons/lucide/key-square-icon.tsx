// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link KeySquareIcon} through. */
type KeySquareIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The twist in degrees at each half of the way out, and how much the key grows at the first: less than the web
 * twin's 15 and 1.05, which would swing the key's foot past the canvas, which react-native-svg clips.
 */
const TWIST = [0, 4, -4];
const GROW = 1.02;

/**
 * Lucide's key-square icon, which twists one way, then the other, and back when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function KeySquareIcon({
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
      rotate: interpolate(progress.value, [0, 0.5, 1], TWIST),
      scaleX: interpolate(progress.value, [0, 0.5, 1], [1, GROW, 1]),
      scaleY: interpolate(progress.value, [0, 0.5, 1], [1, GROW, 1]),
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
        <Path d="M12.4 2.7a2.5 2.5 0 0 1 3.4 0l5.5 5.5a2.5 2.5 0 0 1 0 3.4l-3.7 3.7a2.5 2.5 0 0 1-3.4 0L8.7 9.8a2.5 2.5 0 0 1 0-3.4z" />
        <Path d="m14 7 3 3" />
        <Path d="m9.4 10.6-6.814 6.814A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814" />
      </AnimatedG>
    </Svg>
  );
}

export { KeySquareIcon };
export type { KeySquareIconHandle };
