// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandHeartIcon} through. */
type HandHeartIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the heart rises, in the 24-unit viewBox, and how much it grows: less rise than the web twin's 2, which
 * would take the grown heart past the top of the canvas, which react-native-svg clips.
 */
const RISE = -1.3;
const GROW = 0.1;

/**
 * Lucide's hand-heart icon, whose heart rises and grows, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function HandHeartIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const heart = useAnimatedProps(() =>
    transformProps({
      y: RISE * progress.value,
      scaleX: 1 + GROW * progress.value,
      scaleY: 1 + GROW * progress.value,
      originX: 16,
      originY: 8.195,
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
      <Path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <AnimatedPath
        d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95"
        animatedProps={heart}
      />
      <Path d="m2 15 6 6" />
      <Path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" />
    </Svg>
  );
}

export { HandHeartIcon };
export type { HandHeartIconHandle };
