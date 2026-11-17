// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SyringeIcon} through. */
type SyringeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the syringe pushes, down and to the left, and its turn and size there, about the middle: the web twin
 * pushes by 3, which would take the needle past the canvas, which react-native-svg clips, so it pushes by 2,
 * shrinking a little. The turn is the web twin's.
 */
const PUSH = 2;
const TURN = 1;
const SIZE = 0.88;

/**
 * Lucide's syringe icon, which pushes down and to the left, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function SyringeIcon({
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
      x: -PUSH * progress.value,
      y: PUSH * progress.value,
      rotate: TURN * progress.value,
      scaleX: 1 - (1 - SIZE) * progress.value,
      scaleY: 1 - (1 - SIZE) * progress.value,
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
        <Path d="m18 2 4 4" />
        <Path d="m17 7 3-3" />
        <Path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <Path d="m9 11 4 4" />
        <Path d="m5 19-3 3" />
        <Path d="m14 4 6 6" />
      </AnimatedG>
    </Svg>
  );
}

export { SyringeIcon };
export type { SyringeIconHandle };
