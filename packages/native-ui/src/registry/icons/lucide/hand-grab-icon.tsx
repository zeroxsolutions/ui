// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandGrabIcon} through. */
type HandGrabIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's hand-grab icon, which squeezes shut a little and opens when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function HandGrabIcon({
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
      scaleX: 1 - 0.1 * progress.value,
      scaleY: 1 - 0.1 * progress.value,
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
        <Path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" />
        <Path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
        <Path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" />
        <Path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <Path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />
      </AnimatedG>
    </Svg>
  );
}

export { HandGrabIcon };
export type { HandGrabIconHandle };
