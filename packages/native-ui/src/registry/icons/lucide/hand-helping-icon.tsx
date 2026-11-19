// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandHelpingIcon} through. */
type HandHelpingIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the hand reaches up and to the right, in the 24-unit viewBox: under half the web twin's 2, which would
 * take the fingertips past the canvas, which react-native-svg clips.
 */
const REACH = 0.9;

/**
 * Lucide's hand-helping icon, which reaches up and out, and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function HandHelpingIcon({
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
      x: REACH * progress.value,
      y: -REACH * progress.value,
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
        <Path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" />
        <Path d="m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
        <Path d="m2 13 6 6" />
      </AnimatedG>
    </Svg>
  );
}

export { HandHelpingIcon };
export type { HandHelpingIconHandle };
